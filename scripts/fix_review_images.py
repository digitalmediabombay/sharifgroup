import re
import json

# 1. Update HTML files
html_files = ['index.html', 'ar/index.html', 'fa/index.html', 'zh/index.html']
for hf in html_files:
    with open(hf, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace relative or root clients/clientX.webp
    def repl(m):
        num = m.group(1)
        return f'src="/assets/images/clients/client{num}.webp" onerror="this.onerror=null;this.src=\'/clients/client{num}.webp\'"'
    
    new_content = re.sub(r'src=["\']/?clients/client([1-7])\.webp["\'](?:\s+onerror="[^"]*")?', repl, content)
    
    if new_content != content:
        with open(hf, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {hf}')
    else:
        print(f'No change in {hf}')

# 2. Update JSON files
json_files = ['assets/data/published_content.json', 'admin/api/published_content.json', 'admin/api/draft_content.json']
for jf in json_files:
    with open(jf, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Check sgcms_homepage -> reviews -> slides
    rev = data.get('sgcms_homepage', {}).get('reviews', {})
    if 'slides' in rev:
        for idx, s in enumerate(rev['slides']):
            s['img'] = f'/assets/images/clients/client{idx+1}.webp'
            
    # Also homepage -> reviews -> slides if present
    rev2 = data.get('homepage', {}).get('reviews', {})
    if 'slides' in rev2:
        for idx, s in enumerate(rev2['slides']):
            s['img'] = f'/assets/images/clients/client{idx+1}.webp'
            
    with open(jf, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'Updated {jf}')

# 3. Update admin/cms.js
with open('admin/cms.js', 'r', encoding='utf-8') as f:
    cms_js = f.read()

for i in range(1, 8):
    cms_js = cms_js.replace(f"img: 'clients/client{i}.webp'", f"img: '/assets/images/clients/client{i}.webp'")
    cms_js = cms_js.replace(f"img: '/clients/client{i}.webp'", f"img: '/assets/images/clients/client{i}.webp'")

with open('admin/cms.js', 'w', encoding='utf-8') as f:
    f.write(cms_js)
print('Updated admin/cms.js')

# 4. Update assets/js/cms-live.js
with open('assets/js/cms-live.js', 'r', encoding='utf-8') as f:
    cms_live = f.read()

old_block = """        for (var ri = 0; ri < rev.slides.length; ri++) {
          if (quotes[ri] && rev.slides[ri].quote) quotes[ri].textContent = rev.slides[ri].quote;
          if (imgs[ri] && rev.slides[ri].img) {
            var imgSrc = rev.slides[ri].img.replace(/\\.(png|jpe?g)$/i, '.webp');
            imgs[ri].src = imgSrc;
          }
        }"""

new_block = """        for (var ri = 0; ri < rev.slides.length; ri++) {
          if (quotes[ri] && rev.slides[ri].quote) quotes[ri].textContent = rev.slides[ri].quote;
          if (imgs[ri] && rev.slides[ri].img) {
            var imgSrc = rev.slides[ri].img.replace(/\\.(png|jpe?g)$/i, '.webp');
            if (imgSrc.indexOf('client') !== -1) {
              imgSrc = '/assets/images/clients/client' + (ri + 1) + '.webp';
            } else if (!imgSrc.startsWith('/') && !imgSrc.startsWith('http')) {
              imgSrc = '/' + imgSrc;
            }
            imgs[ri].src = imgSrc;
            (function(im, num) {
              im.onerror = function() {
                if (im.src.indexOf('/clients/') === -1) {
                  im.src = '/clients/client' + num + '.webp';
                }
              };
            })(imgs[ri], ri + 1);
          }
        }"""

if old_block in cms_live:
    cms_live = cms_live.replace(old_block, new_block)
    with open('assets/js/cms-live.js', 'w', encoding='utf-8') as f:
        f.write(cms_live)
    print('Updated assets/js/cms-live.js')
else:
    print('Could not find old_block in assets/js/cms-live.js')

# 5. Update assets/js/navbar.js global image error handler
with open('assets/js/navbar.js', 'r', encoding='utf-8') as f:
    nav_js = f.read()

old_nav_fallback = """  // T15: Global image error fallback for external CDN / host failures (403/429/404/520)
  document.addEventListener('error', function(e) {
    if (e.target && e.target.tagName === 'IMG' && !e.target.dataset.fallbackTried) {
      e.target.dataset.fallbackTried = 'true';
      if (e.target.src && !e.target.src.includes('dubai-office-2.webp') && !e.target.src.includes('vector_')) {
        e.target.src = '/assets/images/dubai-office-2.webp';
      }
    }
  }, true);"""

new_nav_fallback = """  // T15: Global image error fallback for external CDN / host failures (403/429/404/520)
  document.addEventListener('error', function(e) {
    if (e.target && e.target.tagName === 'IMG' && !e.target.dataset.fallbackTried) {
      e.target.dataset.fallbackTried = 'true';
      if (e.target.src && !e.target.src.includes('dubai-office-2.webp') && !e.target.src.includes('vector_')) {
        if (e.target.src.includes('client')) {
          var cm = e.target.src.match(/client([1-7])\\.(webp|png|jpe?g)/i);
          if (cm) {
            e.target.src = '/assets/images/clients/client' + cm[1] + '.webp';
            return;
          }
        }
        e.target.src = '/assets/images/dubai-office-2.webp';
      }
    }
  }, true);"""

if old_nav_fallback in nav_js:
    nav_js = nav_js.replace(old_nav_fallback, new_nav_fallback)
    with open('assets/js/navbar.js', 'w', encoding='utf-8') as f:
        f.write(nav_js)
    print('Updated assets/js/navbar.js')
else:
    print('Could not find old_nav_fallback in assets/js/navbar.js')
