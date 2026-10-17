import os
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

ANTI_COLLISION_CSS = """
/* Header Anti-Collision Responsive Rules */
.nav-new-badge,
#main-header [data-i18n="nav.newBadge"] {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 7.5px !important;
    line-height: 1 !important;
    padding: 2px 4.5px !important;
    border-radius: 9999px !important;
    background-color: #786142 !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    letter-spacing: 0 !important;
    margin-left: 4px !important;
    margin-right: 0 !important;
    vertical-align: middle !important;
    flex-shrink: 0 !important;
    white-space: nowrap !important;
}
[dir="rtl"] .nav-new-badge,
[dir="rtl"] #main-header [data-i18n="nav.newBadge"] {
    margin-left: 0 !important;
    margin-right: 4px !important;
}
@media (max-width: 1535px) {
    #main-header .nav-sep,
    #main-header nav span.text-neutral-300,
    #main-header span.text-neutral-300 {
        display: none !important;
    }
    #main-header nav {
        gap: 0.25rem 0.65rem !important;
    }
    #main-header nav > * {
        letter-spacing: 0.05em !important;
        font-size: 10px !important;
    }
    #main-header a[data-i18n="nav.eligibilityChecker"],
    #main-header a[data-i18n="nav.bookConsultation"],
    #main-header a[href*="eligibilitychecker"],
    #main-header a[href*="contact"] {
        padding: 0.45rem 0.85rem !important;
        font-size: 9.5px !important;
        letter-spacing: 0.06em !important;
    }
}
@media (max-width: 1280px) {
    #main-header nav {
        gap: 0.2rem 0.45rem !important;
    }
    #main-header nav > * {
        letter-spacing: 0.03em !important;
        font-size: 9.5px !important;
    }
    #main-header a[data-i18n="nav.eligibilityChecker"],
    #main-header a[data-i18n="nav.bookConsultation"],
    #main-header a[href*="eligibilitychecker"],
    #main-header a[href*="contact"] {
        padding: 0.35rem 0.7rem !important;
        font-size: 9px !important;
        letter-spacing: 0.04em !important;
    }
}
@media (max-width: 1150px) {
    #main-header nav,
    #main-header div.hidden.lg\\:flex {
        display: none !important;
    }
    #main-header button[onclick*="toggleMobileMenu"],
    #main-header button[aria-label="Toggle Navigation Menu"],
    #main-header button[aria-label="Toggle Menu"],
    #main-header .lg\\:hidden,
    #main-header .xl\\:hidden {
        display: flex !important;
    }
}
html[lang="ar"] #main-header nav > *,
html[lang="fa"] #main-header nav > *,
[dir="rtl"] #main-header nav > *,
[dir="rtl"] #main-header a[data-i18n="nav.eligibilityChecker"],
[dir="rtl"] #main-header a[data-i18n="nav.bookConsultation"] {
    letter-spacing: 0 !important;
}
"""

DESKTOP_WEBINAR_ITEM = """<span class="nav-sep text-neutral-300 font-light">|</span>
<a class="hover:text-luxury-gold transition duration-200 py-2 inline-flex items-center" href="/webinars/" onmouseenter="typeof closeAllMegaMenus === 'function' ? closeAllMegaMenus() : (typeof scheduleMenuClose === 'function' ? scheduleMenuClose() : null)">
<span data-i18n="nav.webinars">Webinars</span>
<span class="nav-new-badge ml-1.5 px-1.5 py-0.5 rounded-full bg-[#786142] text-white text-[7.5px] font-bold leading-none inline-flex items-center justify-center shrink-0" style="margin-left: 5px; background-color: #786142; color: #ffffff; border-radius: 9999px; padding: 2px 5px; font-size: 7.5px; font-weight: 700; line-height: 1; display: inline-flex; align-items: center; white-space: nowrap;" data-i18n="nav.newBadge">New</span>
</a>"""

FOOTER_WEBINAR_ITEM = """<li><a class="hover:text-luxury-gold transition inline-flex items-center gap-1.5" href="/webinars/"><span data-i18n="footer.webinars">Webinars</span> <span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span></a></li>"""

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as fp:
        content = fp.read()

    orig = content

    # 1. Update <nav> desktop inside <header id="main-header">
    header_m = re.search(r'(<header[^>]*id=["\']main-header["\'][^>]*>[\s\S]*?</header>)', content)
    if header_m:
        old_header = header_m.group(1)
        new_header = old_header

        # Container width upgrade if 1440px
        new_header = re.sub(r'max-w-\[1440px\](\s+mx-auto)', r'max-w-[1600px] w-full\1', new_header)

        # Nav tag
        nav_m = re.search(r'(<nav\b[^>]*>)([\s\S]*?)(</nav>)', new_header)
        if nav_m:
            nav_open = nav_m.group(1)
            nav_body = nav_m.group(2)
            nav_close = nav_m.group(3)

            if '/webinars/' not in nav_body:
                # Add nav-sep to existing separators
                nav_body = re.sub(r'<span class="text-neutral-300 font-light">\|</span>', r'<span class="nav-sep text-neutral-300 font-light">|</span>', nav_body)

                # Find blog link
                blog_pattern = r'(<a\b[^>]*href=["\'][^"\']*blog[^"\']*["\'][^>]*>[\s\S]*?</a>)'
                blog_m = re.search(blog_pattern, nav_body, re.I)
                if blog_m:
                    matched_blog = blog_m.group(1)
                    replacement = matched_blog + '\n' + DESKTOP_WEBINAR_ITEM
                    nav_body = nav_body[:blog_m.start()] + replacement + nav_body[blog_m.end():]
                else:
                    nav_body = nav_body + '\n' + DESKTOP_WEBINAR_ITEM

            new_header = new_header[:nav_m.start()] + nav_open + nav_body + nav_close + new_header[nav_m.end():]

        content = content[:header_m.start()] + new_header + content[header_m.end():]

    # 2. Update Mobile Menu Drawer
    drawer_start = content.find('id="mobile-menu-drawer"')
    if drawer_start == -1:
        drawer_start = content.find("id='mobile-menu-drawer'")

    if drawer_start != -1:
        candidates = [content.find('</main>', drawer_start), content.find('<footer', drawer_start), content.find('</body>', drawer_start)]
        candidates = [c for c in candidates if c != -1]
        drawer_end = min(candidates) if candidates else len(content)

        drawer_content = content[drawer_start:drawer_end]
        if '/webinars/' not in drawer_content:
            new_drawer = drawer_content
            # Check pattern 1: <div><a ... href="/blog/" ...>...</a></div>
            p1 = re.search(r'(<div>\s*<a\b[^>]*href=["\'][^"\']*blog[^"\']*["\'][^>]*>[\s\S]*?</a>\s*</div>)', new_drawer, re.I)
            if p1 and 'lang-option' not in p1.group(1):
                item = """<div>
<a class="py-2.5 border-b border-neutral-100 hover:text-luxury-gold transition flex items-center justify-between" href="/webinars/" onclick="toggleMobileMenu()">
<span data-i18n="mobileMenu.webinars">WEBINARS</span>
<span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span>
</a>
</div>"""
                new_drawer = new_drawer[:p1.end()] + '\n' + item + new_drawer[p1.end():]
            else:
                # Check pattern 2: <li><a ... href="/blog/" ...>...</a></li>
                p2 = re.search(r'(<li\b[^>]*>\s*<a\b[^>]*href=["\'][^"\']*blog[^"\']*["\'][^>]*>[\s\S]*?</a>\s*</li>)', new_drawer, re.I)
                if p2 and 'lang-option' not in p2.group(1):
                    item = """<li><a class="flex items-center justify-between hover:text-luxury-gold py-0.5" href="/webinars/" onclick="toggleMobileMenu()"><span data-i18n="mobileMenu.webinars">Webinars</span><span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span></a></li>"""
                    new_drawer = new_drawer[:p2.end()] + '\n' + item + new_drawer[p2.end():]
                else:
                    # Check pattern 3: <a class="py-3 border-b border-neutral-200 ... href="/blog/" ...>...</a>
                    p3 = re.search(r'(<a\b[^>]*class=["\'][^"\']*border-b[^"\']*["\'][^>]*href=["\'][^"\']*blog[^"\']*["\'][^>]*>[\s\S]*?</a>)', new_drawer, re.I)
                    if p3 and 'lang-option' not in p3.group(1):
                        item = """<a class="py-3 border-b border-neutral-200 hover:text-luxury-gold transition flex items-center justify-between" href="/webinars/" onclick="toggleMobileMenu()">
<span data-i18n="mobileMenu.webinars">WEBINARS</span>
<span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span>
</a>"""
                        new_drawer = new_drawer[:p3.end()] + '\n' + item + new_drawer[p3.end():]
                    else:
                        # Check pattern 4: Any <a ... href="/blog/" ...>...</a> (excluding lang-option)
                        links = list(re.finditer(r'(<a\b[^>]*href=["\'][^"\']*blog[^"\']*["\'][^>]*>[\s\S]*?</a>)', new_drawer, re.I))
                        valid_links = [l for l in links if 'lang-option' not in l.group(1)]
                        if valid_links:
                            target = valid_links[0]
                            item = """<a class="flex items-center justify-between text-neutral-800 hover:text-[#C5A880] pl-3 py-0.5" href="/webinars/" onclick="toggleMobileMenu()"><span data-i18n="mobileMenu.webinars">Webinars</span><span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span></a>"""
                            new_drawer = new_drawer[:target.end()] + '\n' + item + new_drawer[target.end():]

            if new_drawer != drawer_content:
                content = content[:drawer_start] + new_drawer + content[drawer_end:]

    # 3. Update Footer
    footer_m = re.search(r'(<footer\b[\s\S]*?</footer>)', content, re.I)
    if footer_m and '/webinars/' not in footer_m.group(1):
        old_footer = footer_m.group(1)
        new_footer = old_footer
        f_blog = re.search(r'(<li\b[^>]*>\s*<a\b[^>]*href=["\'][^"\']*blog[^"\']*["\'][^>]*>[\s\S]*?</a>\s*</li>)', new_footer, re.I)
        if f_blog:
            new_footer = new_footer[:f_blog.end()] + '\n' + FOOTER_WEBINAR_ITEM + new_footer[f_blog.end():]
        content = content[:footer_m.start()] + new_footer + content[footer_m.end():]

    # 4. Inject Anti-Collision CSS into <style> if not already there
    if 'Header Anti-Collision Responsive Rules' not in content and '.nav-new-badge' not in content:
        style_idx = content.find('</style>')
        if style_idx != -1:
            content = content[:style_idx] + '\n' + ANTI_COLLISION_CSS + '\n' + content[style_idx:]
        else:
            head_idx = content.find('</head>')
            if head_idx != -1:
                content = content[:head_idx] + '<style>\n' + ANTI_COLLISION_CSS + '\n</style>\n' + content[head_idx:]

    # 5. Bump multilingual.css version if present
    content = re.sub(r'multilingual\.css\?v=[^"\'\s>]+', 'multilingual.css?v=20261017_v2', content)

    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as fp:
            fp.write(content)
        return True
    return False

def main():
    exclude_dirs = {'.git', 'fa', 'ar', 'zh', 'node_modules', '.gemini', 'admin', 'scratch', 'Sharif-Webinars-Demo_1'}
    pages = []
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if f.endswith('.html') and f != 'dashboard.html' and not f.startswith('WorldMap'):
                p = os.path.normpath(os.path.join(root, f))
                if p not in ['index.html', 'aboutus\\index.html', 'blog\\index.html', 'webinars\\index.html']:
                    pages.append(p)

    pages.sort()
    print(f"Discovered {len(pages)} English pages to process...")

    updated_count = 0
    skipped_count = 0

    for p in pages:
        res = update_file(p)
        if res:
            updated_count += 1
            print(f"  [UPDATED] {p}")
        else:
            skipped_count += 1
            print(f"  [SKIPPED] {p}")

    print(f"\nBatch Update Complete: {updated_count} files updated, {skipped_count} skipped.")

if __name__ == '__main__':
    main()
