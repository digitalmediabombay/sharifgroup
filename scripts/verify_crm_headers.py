import re

content = open('scripts/SharifGroup_Master_CRM_AppsScript.js', encoding='utf-8').read()

# Check CATEGORY_HEADERS count
hdr_match = re.search(r'const CATEGORY_HEADERS = \[(.*?)\];', content, re.DOTALL)
if hdr_match:
    items = [l.strip() for l in hdr_match.group(1).split('\n') if '"' in l]
    print('CATEGORY_HEADERS count:', len(items))
    for i, h in enumerate(items):
        print('  col ' + str(i+1) + ': ' + h.strip())

# Check appendRow values count in handleCategoryLead
row_match = re.search(r'var row = \[(.*?)\];', content, re.DOTALL)
if row_match:
    vals = [l.strip() for l in row_match.group(1).split('\n') if l.strip() and not l.strip().startswith('//')]
    print('\nappendRow values count: ' + str(len(vals)))
    for i, v in enumerate(vals):
        print('  col ' + str(i+1) + ': ' + v.strip())
