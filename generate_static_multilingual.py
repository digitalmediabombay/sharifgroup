import os
import re
import json
import html
from bs4 import BeautifulSoup

BASE_DIR = r"c:\Users\Admin\Desktop\sharifgrp"

LANGS = {
    "fa": {"dir": "rtl", "label": "FA", "name": "Persian", "locale": "fa_IR", "brand": "شریف گروپ"},
    "ar": {"dir": "rtl", "label": "AR", "name": "Arabic", "locale": "ar_AE", "brand": "مجموعة شريف"},
    "zh": {"dir": "ltr", "label": "ZH", "name": "Chinese", "locale": "zh_CN", "brand": "谢里夫集团"}
}

ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

def localize_numbers(text, lang):
    if not text or not isinstance(text, str):
        return text
    if lang == 'ar':
        for i, d in enumerate(ARABIC_DIGITS):
            text = text.replace(str(i), d)
    elif lang == 'fa':
        for i, d in enumerate(PERSIAN_DIGITS):
            text = text.replace(str(i), d)
    return text

def get_nested_value(obj, key_path):
    if not obj or not key_path:
        return None
    parts = key_path.split('.')
    curr = obj
    for part in parts:
        if isinstance(curr, dict) and part in curr:
            curr = curr[part]
        else:
            return None
    return curr

def get_clean_path(rel_path):
    parts = rel_path.replace("\\", "/").split("/")
    if parts[-1] == "index.html":
        parts.pop()
    if not parts:
        return "/"
    return "/" + "/".join(parts) + "/"

def localize_internal_url(url, lang):
    if not url or not isinstance(url, str):
        return url
    if not url.startswith("/") or url.startswith("//") or url.startswith("/#"):
        return url
    if url.startswith("/assets/") or url.startswith("/admin/") or url.startswith("/api/"):
        return url
    if re.search(r'\.(webp|jpg|jpeg|png|gif|svg|ico|css|js|json|xml|pdf|mp4|bat|ps1)$', url, re.I):
        return url
    clean = re.sub(r'^/(ar|fa|zh|en)(/|$)', '/', url)
    if not clean.startswith('/'):
        clean = '/' + clean
    if clean == '/':
        return f"/{lang}/"
    return f"/{lang}{clean}"

def process_page(file_path, rel_path, clean_path, lang, cfg, locale_data, articles_data):
    with open(file_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, "html.parser")

    # 1. Update html lang and dir
    if soup.html:
        soup.html['lang'] = lang
        soup.html['dir'] = cfg['dir']
        # remove i18n-pending from static pre-rendered pages so content shows immediately
        classes = soup.html.get('class', [])
        if isinstance(classes, list):
            soup.html['class'] = [c for c in classes if c != 'i18n-pending']

    # 2. Canonical and hreflangs
    canonical_tag = soup.find('link', rel='canonical')
    localized_canonical = f"https://sharifgroup.ae/{lang}{clean_path}" if clean_path != "/" else f"https://sharifgroup.ae/{lang}/"
    if canonical_tag:
        canonical_tag['href'] = localized_canonical
    
    # Reciprocal hreflangs
    for link in soup.find_all('link', rel='alternate'):
        if link.get('hreflang'):
            hl = link['hreflang']
            if hl in ['x-default', 'en']:
                link['href'] = f"https://sharifgroup.ae{clean_path}"
            elif hl in ['fa', 'ar', 'zh']:
                link['href'] = f"https://sharifgroup.ae/{hl}{clean_path}" if clean_path != "/" else f"https://sharifgroup.ae/{hl}/"

    # 3. Detect page type and localized metadata
    page_title = None
    page_desc = None
    slug = None

    if clean_path == "/":
        page_title = get_nested_value(locale_data, "meta.title")
        page_desc = get_nested_value(locale_data, "meta.description")
    elif clean_path.startswith("/blog/") and clean_path != "/blog/":
        # Extract slug
        parts = clean_path.strip("/").split("/")
        if len(parts) >= 2:
            slug = parts[1]
            if slug in articles_data:
                art = articles_data[slug]
                page_title = f"{art.get('title', '')} | {cfg['brand']}"
                # Extract first paragraph text as description
                content_html = art.get('content', '')
                m = re.search(r'<p>(.*?)</p>', content_html, re.DOTALL)
                if m:
                    clean_text = re.sub(r'<[^>]+>', '', m.group(1)).strip()
                    page_desc = clean_text[:160]
    elif clean_path == "/blog/":
        page_title = get_nested_value(locale_data, "blog.title")
        if page_title:
            page_title = f"{page_title} | {cfg['brand']}"
        page_desc = get_nested_value(locale_data, "blog.heroDesc")

    # Update <title>
    if page_title:
        title_el = soup.find('title')
        if title_el:
            title_el.string = page_title
        meta_title = soup.find('meta', attrs={'name': 'title'})
        if meta_title:
            meta_title['content'] = page_title

    # Update <meta name="description">
    if page_desc:
        desc_el = soup.find('meta', attrs={'name': 'description'})
        if desc_el:
            desc_el['content'] = page_desc

    # Update Open Graph & Twitter tags
    og_url = soup.find('meta', property='og:url')
    if og_url:
        og_url['content'] = localized_canonical
    tw_url = soup.find('meta', attrs={'name': 'twitter:url'})
    if tw_url:
        tw_url['content'] = localized_canonical
    og_locale = soup.find('meta', property='og:locale')
    if og_locale:
        og_locale['content'] = cfg['locale']

    if page_title:
        og_t = soup.find('meta', property='og:title')
        if og_t:
            og_t['content'] = page_title
        tw_t = soup.find('meta', attrs={'name': 'twitter:title'})
        if tw_t:
            tw_t['content'] = page_title
    if page_desc:
        og_d = soup.find('meta', property='og:description')
        if og_d:
            og_d['content'] = page_desc
        tw_d = soup.find('meta', attrs={'name': 'twitter:description'})
        if tw_d:
            tw_d['content'] = page_desc

    # 4. Language Switcher UI
    # Desktop current lang text
    cur_text = soup.find(id='current-lang-text')
    if cur_text:
        cur_text.string = cfg['label']

    # Desktop options
    for opt in soup.find_all(attrs={'class': lambda c: c and 'lang-option' in c}):
        opt_lang = opt.get('data-lang')
        classes = opt.get('class', [])
        if isinstance(classes, str):
            classes = classes.split()
        if opt_lang == lang:
            if 'active-lang' not in classes:
                classes.append('active-lang')
        else:
            classes = [c for c in classes if c != 'active-lang']
        opt['class'] = classes

    # Mobile options
    for opt in soup.find_all(attrs={'class': lambda c: c and 'mobile-lang-option' in c}):
        opt_lang = opt.get('data-lang')
        classes = opt.get('class', [])
        if isinstance(classes, str):
            classes = classes.split()
        if opt_lang == lang:
            if 'active-lang' not in classes:
                classes.append('active-lang')
        else:
            classes = [c for c in classes if c != 'active-lang']
        opt['class'] = classes

    # 5. Translate all [data-i18n]
    for el in soup.find_all(attrs={'data-i18n': True}):
        key = el['data-i18n']
        val = get_nested_value(locale_data, key)
        if val is not None and isinstance(val, str):
            localized = localize_numbers(val, lang)
            # If element has inner glow / span
            glow = el.find(class_=lambda c: c and ('contact-hero-glow' in c or 'dominica-hero-glow' in c or 'stlucia-hero-glow' in c))
            if glow:
                glow.string = localized
            elif el.find(attrs={'data-i18n': True}):
                # Has child with data-i18n, leave parent
                pass
            elif el.find(class_=lambda c: c and 'text-red-500' in c):
                star = el.find(class_=lambda c: c and 'text-red-500' in c)
                star_html = str(star)
                el.clear()
                el.append(localized + " ")
                star_soup = BeautifulSoup(star_html, 'html.parser')
                el.append(star_soup)
            elif '<' in localized and '>' in localized:
                el.clear()
                el.append(BeautifulSoup(localized, 'html.parser'))
            else:
                el.string = localized

    # 6. Translate all [data-i18n-html]
    for el in soup.find_all(attrs={'data-i18n-html': True}):
        key = el['data-i18n-html']
        val = get_nested_value(locale_data, key)
        if val is not None and isinstance(val, str):
            el.clear()
            el.append(BeautifulSoup(val, 'html.parser'))

    # 7. Translate placeholders
    for el in soup.find_all(attrs={'data-i18n-placeholder': True}):
        key = el['data-i18n-placeholder']
        val = get_nested_value(locale_data, key)
        if val is not None and isinstance(val, str):
            el['placeholder'] = localize_numbers(val, lang)

    # 8. Special handling for blog article content if this is a blog post
    if slug and slug in articles_data:
        art = articles_data[slug]
        # Update H1
        h1 = soup.find('h1')
        if h1 and art.get('title'):
            h1.string = art['title']

        # Update article content
        art_content_el = soup.find(class_=lambda c: c and 'article-content' in c)
        if art_content_el and art.get('content'):
            art_content_el.clear()
            art_content_el.append(BeautifulSoup(art['content'], 'html.parser'))

        # Update FAQs
        if art.get('faqs'):
            faqs = art['faqs']
            for i, faq_data in enumerate(faqs):
                btn = soup.find('button', onclick=f"toggleBlogFAQ('faq-dyn-{i}')")
                if btn:
                    span = btn.find('span')
                    if span and 'q' in faq_data:
                        span.string = faq_data['q']
                content_div = soup.find('div', id=f"content-faq-dyn-{i}")
                if content_div and 'a' in faq_data:
                    p = content_div.find('p')
                    if p:
                        p.string = faq_data['a']

    # 9. Localize all internal anchor hrefs
    for a in soup.find_all('a', href=True):
        raw_href = a['href']
        # Skip language switcher options, they already have correct targets
        if 'lang-option' in (a.get('class') or []) or 'mobile-lang-option' in (a.get('class') or []):
            continue
        a['href'] = localize_internal_url(raw_href, lang)

    # 10. Write output file
    target_rel = os.path.join(lang, rel_path)
    target_abs = os.path.join(BASE_DIR, target_rel)
    os.makedirs(os.path.dirname(target_abs), exist_ok=True)

    with open(target_abs, "w", encoding="utf-8") as f:
        f.write(str(soup))

    return target_abs

def main():
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    print("Starting Multilingual Static Pre-rendering Generator...")

    # Load translation files
    translations = {}
    articles = {}
    for lang in LANGS:
        loc_file = os.path.join(BASE_DIR, f"assets/locales/{lang}.json")
        art_file = os.path.join(BASE_DIR, f"assets/locales/articles_{lang}.json")
        with open(loc_file, "r", encoding="utf-8") as f:
            translations[lang] = json.load(f)
        if os.path.exists(art_file):
            with open(art_file, "r", encoding="utf-8") as f:
                articles[lang] = json.load(f)
        else:
            articles[lang] = {}

    # Discover English files
    english_files = []
    for root, dirs, files in os.walk(BASE_DIR):
        parts = root.split(os.sep)
        if any(p in parts for p in ["admin", "scratch", ".git", "fa", "ar", "zh"]):
            continue
        for f in files:
            if f == "index.html":
                english_files.append(os.path.join(root, f))

    print(f"Discovered {len(english_files)} source English pages.")

    for lang, cfg in LANGS.items():
        print(f"\nGenerating static pages for language: {lang.upper()} ({cfg['name']})...")
        count = 0
        for fpath in english_files:
            rel = os.path.relpath(fpath, BASE_DIR)
            clean_path = get_clean_path(rel)
            process_page(fpath, rel, clean_path, lang, cfg, translations[lang], articles[lang])
            count += 1
        print(f"Generated {count} pages for /{lang}/")

    print("\nAll multilingual static pages generated successfully!")

if __name__ == "__main__":
    main()
