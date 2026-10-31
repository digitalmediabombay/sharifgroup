target = '''                    window.__blogRetryCount = 0;
                    if (listingSection && detailSection) {
                        listingSection.style.display = '';
                        detailSection.classList.add('hidden');
                    }
                    console.warn("[Blog] Article content not found for slug:", slug);'''

replacement = '''                    window.__blogRetryCount = 0;
                    if (slug && slug !== 'index.html' && slug !== 'blog' && slug !== 'blog.html') {
                        window.location.replace('/404.html');
                        return;
                    }
                    if (listingSection && detailSection) {
                        listingSection.style.display = '';
                        detailSection.classList.add('hidden');
                    }
                    console.warn("[Blog] Article content not found for slug:", slug);'''

for path in ['blog/index.html', 'ar/blog/index.html', 'fa/blog/index.html', 'zh/blog/index.html']:
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read().replace('\r\n', '\n')
    if target in c:
        c = c.replace(target, replacement, 1)
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(c)
        print('Updated', path)
    else:
        print('Target not found in', path)

