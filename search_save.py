with open('admin/dashboard.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

keywords = ['syncToDb', 'api/save', 'fetch(', 'Backend.sync']
for idx, l in enumerate(lines):
    for kw in keywords:
        if kw in l:
            safe = l.strip()[:120].encode('ascii', errors='replace').decode()
            print(f'{idx+1}: {safe}')
            break
