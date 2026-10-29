import os
import glob
import re

def bump_partners():
    files = [
        'partners/index.html',
        'partners/thanks/index.html',
        'ar/partners/index.html',
        'ar/partners/thanks/index.html',
        'fa/partners/index.html',
        'fa/partners/thanks/index.html',
        'zh/partners/index.html',
        'zh/partners/thanks/index.html',
        'sharif-partners-demo/index.html',
        'sharif-partners-demo/thanks/index.html'
    ]
    
    count = 0
    for fpath in files:
        if os.path.exists(fpath):
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
            # Replace ?v=... on partners-app.js and partners-i18n.js with ?v=20261029d
            new_content = re.sub(r'(partners-(?:app|i18n)\.js)(\?v=[a-zA-Z0-9_-]+)?', r'\1?v=20261029d', content)
            if new_content != content:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f"Bumped {fpath}")
    print(f"Total files bumped: {count}")

if __name__ == '__main__':
    bump_partners()

