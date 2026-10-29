import os
import glob

def bump_versions():
    patterns = [
        'events/**/*.html',
        'ar/events/**/*.html',
        'fa/events/**/*.html',
        'zh/events/**/*.html',
        'webinars/**/*.html',
        'events/index.html',
        'ar/events/index.html',
        'fa/events/index.html',
        'zh/events/index.html',
        'webinars/index.html',
        'Sharif-Webinars-Demo_1/**/*.html'
    ]
    
    files = set()
    for pat in patterns:
        for f in glob.glob(pat, recursive=True):
            if os.path.isfile(f):
                files.add(f)
                
    count = 0
    for fpath in files:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        if '20261029b' in content:
            new_content = content.replace('20261029b', '20261029c')
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count += 1
            print(f"Bumped {fpath}")
            
    print(f"Total files updated: {count}")

if __name__ == '__main__':
    bump_versions()

