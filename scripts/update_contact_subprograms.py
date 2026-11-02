#!/usr/bin/env python3
import os
import re

CONTACT_FILES = {
    'contact/index.html': 'en',
    'ar/contact/index.html': 'ar',
    'fa/contact/index.html': 'fa',
    'zh/contact/index.html': 'zh'
}

OPTGROUPS_HTML = {
    'en': '''                                <option value="" data-i18n="contact.selectSubProgram">Select Sub-Program Pathway</option>
                                <optgroup label="Citizenship By Investment (Passports)">
                                    <option value="dominica">Dominica | Passport</option>
                                    <option value="stkitts">St. Kitts &amp; Nevis | Passport</option>
                                    <option value="antigua">Antigua &amp; Barbuda | Passport</option>
                                    <option value="stlucia">Saint Lucia | Passport</option>
                                    <option value="grenada">Grenada | Passport</option>
                                    <option value="vanuatu">Vanuatu | Passport</option>
                                    <option value="saotome">São Tomé and Príncipe | Passport</option>
                                    <option value="nauru">Republic of Nauru | Passport</option>
                                </optgroup>
                                <optgroup label="Residency By Investment (Golden Visas)">
                                    <option value="uae-gv">United Arab Emirates | Golden Visa</option>
                                    <option value="greece-gv">Greece | Golden Visa</option>
                                    <option value="portugal-gv">Portugal | Golden Visa</option>
                                    <option value="panama-pr">Panama | Qualified Investor PR</option>
                                </optgroup>
                                <optgroup label="Dubai Real Estate &amp; Property">
                                    <option value="dubai-offplan">Dubai Off-Plan / New Launch</option>
                                    <option value="dubai-ready">Dubai Ready Homes &amp; Luxury Villas</option>
                                    <option value="commercial-re">Commercial &amp; Rental Assets</option>
                                </optgroup>
                                <optgroup label="Global Educational Advisory">
                                    <option value="boarding-schools">UK &amp; Swiss Boarding Schools</option>
                                    <option value="undergrad">Undergraduate Degrees Placement</option>
                                    <option value="postgrad">Postgraduate &amp; MBA Admission</option>
                                </optgroup>''',

    'ar': '''                                <option value="" data-i18n="contact.selectSubProgram">اختر المسار الفرعي للبرنامج</option>
                                <optgroup label="الجنسية عن طريق الاستثمار (جوازات السفر)">
                                    <option value="dominica">دومينيكا | جواز سفر</option>
                                    <option value="stkitts">سانت كيتس ونيفيس | جواز سفر</option>
                                    <option value="antigua">أنتيغوا وبربودا | جواز سفر</option>
                                    <option value="stlucia">سانت لوسيا | جواز سفر</option>
                                    <option value="grenada">غرينادا | جواز سفر</option>
                                    <option value="vanuatu">فانواتو | جواز سفر</option>
                                    <option value="saotome">ساو تومي وبرينسيب | جواز سفر</option>
                                    <option value="nauru">جمهورية ناورو | جواز سفر</option>
                                </optgroup>
                                <optgroup label="الإقامة عن طريق الاستثمار (التأشيرة الذهبية)">
                                    <option value="uae-gv">الإمارات العربية المتحدة | التأشيرة الذهبية</option>
                                    <option value="greece-gv">اليونان | التأشيرة الذهبية</option>
                                    <option value="portugal-gv">البرتغال | التأشيرة الذهبية</option>
                                    <option value="panama-pr">بنما | إقامة المستثمر المؤهل</option>
                                </optgroup>
                                <optgroup label="عقارات دبي والاستثمار العقاري">
                                    <option value="dubai-offplan">عقارات دبي على الخارطة والمشاريع الجديدة</option>
                                    <option value="dubai-ready">المنازل والفلل الجاهزة في دبي</option>
                                    <option value="commercial-re">المساحات التجارية والأصول الاستثمارية</option>
                                </optgroup>
                                <optgroup label="الاستشارات التعليمية والقبول الجامعي">
                                    <option value="boarding-schools">المدارس الداخلية في بريطانيا وسويسرا</option>
                                    <option value="undergrad">القبول الجامعي لدرجة البكالوريوس</option>
                                    <option value="postgrad">الدراسات العليا وماجستير إدارة الأعمال</option>
                                </optgroup>''',

    'fa': '''                                <option value="" data-i18n="contact.selectSubProgram">انتخاب مسیر فرعی برنامه</option>
                                <optgroup label="اخذ شهروندی و پاسپورت از طریق سرمایه‌گذاری">
                                    <option value="dominica">دومینیکا | پاسپورت</option>
                                    <option value="stkitts">سنت کیتس و نویس | پاسپورت</option>
                                    <option value="antigua">آنتیگوا و باربودا | پاسپورت</option>
                                    <option value="stlucia">سنت لوسیا | پاسپورت</option>
                                    <option value="grenada">گرانادا | پاسپورت</option>
                                    <option value="vanuatu">وانواتو | پاسپورت</option>
                                    <option value="saotome">سائوتومه و پرنسیپ | پاسپورت</option>
                                    <option value="nauru">جمهوری نائورو | پاسپورت</option>
                                </optgroup>
                                <optgroup label="اخذ اقامت و ویزای طلایی (Golden Visa)">
                                    <option value="uae-gv">امارات متحده عربی | ویزای طلایی ۱۰ ساله</option>
                                    <option value="greece-gv">یونان | ویزای طلایی اروپا</option>
                                    <option value="portugal-gv">پرتغال | ویزای طلایی سرمایه‌گذاری</option>
                                    <option value="panama-pr">پاناما | اقامت دائم سرمایه‌گذار واجد شرایط</option>
                                </optgroup>
                                <optgroup label="املاک دبی و سرمایه‌گذاری ملکی">
                                    <option value="dubai-offplan">پروژه‌های در حال ساخت و پیش‌فروش دبی</option>
                                    <option value="dubai-ready">خانه‌ها، آپارتمان‌ها و ویلاهای آماده دبی</option>
                                    <option value="commercial-re">املاک تجاری و اداری سرمایه‌گذاری</option>
                                </optgroup>
                                <optgroup label="مشاوره تحصیلی و پذیرش دانشگاه‌های بین‌المللی">
                                    <option value="boarding-schools">مدارس شبانه‌روزی نخبگان بریتانیا و سوئیس</option>
                                    <option value="undergrad">پذیرش دوره‌های کارشناسی دانشگاهی</option>
                                    <option value="postgrad">تحصیلات تکمیلی، کارشناسی ارشد و ام‌بی‌ای</option>
                                </optgroup>''',

    'zh': '''                                <option value="" data-i18n="contact.selectSubProgram">请选择细分通道</option>
                                <optgroup label="投资入籍项目（第二护照）">
                                    <option value="dominica">多米尼克 | 第二护照</option>
                                    <option value="stkitts">圣基茨和尼维斯 | 第二护照</option>
                                    <option value="antigua">安提瓜和巴布达 | 第二护照</option>
                                    <option value="stlucia">圣卢西亚 | 第二护照</option>
                                    <option value="grenada">格林纳达 | 第二护照</option>
                                    <option value="vanuatu">瓦努阿图 | 第二护照</option>
                                    <option value="saotome">圣多美和普林西比 | 第二护照</option>
                                    <option value="nauru">瑙鲁共和国 | 第二护照</option>
                                </optgroup>
                                <optgroup label="投资居留项目（黄金签证）">
                                    <option value="uae-gv">阿拉伯联合酋长国 | 10年黄金签证</option>
                                    <option value="greece-gv">希腊 | 欧洲黄金签证</option>
                                    <option value="portugal-gv">葡萄牙 | 黄金居留签证</option>
                                    <option value="panama-pr">巴拿马 | 合格投资者永久居留</option>
                                </optgroup>
                                <optgroup label="迪拜房产与高端置业">
                                    <option value="dubai-offplan">迪拜期房 / 全球首发项目</option>
                                    <option value="dubai-ready">现房与高端奢华别墅</option>
                                    <option value="commercial-re">商业物业与投资型办公楼</option>
                                </optgroup>
                                <optgroup label="全球优质教育与名校咨询">
                                    <option value="boarding-schools">英国与瑞士顶尖寄宿学校</option>
                                    <option value="undergrad">海外名校本科申请录取</option>
                                    <option value="postgrad">研究生与MBA高级学位录取</option>
                                </optgroup>'''
}

def update_contact_file(rel_path, lang):
    if not os.path.exists(rel_path):
        print(f"File not found: {rel_path}")
        return

    with open(rel_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace subProgram select inner content
    pattern = re.compile(r'(<select[^>]*id="sub-service-choice-standalone"[^>]*>)(.*?)(</select>)', re.DOTALL)
    m = pattern.search(content)
    if m:
        open_tag = m.group(1).replace(' required=""', '').replace(' required', '')
        close_tag = m.group(3)
        new_inner = "\n" + OPTGROUPS_HTML[lang] + "\n                            "
        content = content[:m.start()] + open_tag + new_inner + close_tag + content[m.end():]
        print(f"Updated subProgram select in {rel_path}")
    else:
        print(f"subProgram select NOT matched in {rel_path}")

    # 2. Neutralize duplicate inline optionsMap and handleServiceSelectionChange
    inline_pattern = re.compile(r'// Sub-service Options Dynamic Populator.*?function handleServiceSelectionChange\(selectElem\)\s*\{.*?\}\s*', re.DOTALL)
    if inline_pattern.search(content):
        content = inline_pattern.sub('// Sub-service Options dynamic population handled centrally via /assets/js/forms.js\n', content)
        print(f"Removed conflicting inline handleServiceSelectionChange in {rel_path}")

    with open(rel_path, 'w', encoding='utf-8') as f:
        f.write(content)

for p, l in CONTACT_FILES.items():
    update_contact_file(p, l)

# Also update index.html homepages
HOME_FILES = {
    'index.html': 'en',
    'ar/index.html': 'ar',
    'fa/index.html': 'fa',
    'zh/index.html': 'zh'
}

for p, l in HOME_FILES.items():
    if not os.path.exists(p):
        continue
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = re.compile(r'(<select[^>]*id="sub-service-choice"[^>]*>)(.*?)(</select>)', re.DOTALL)
    m = pattern.search(content)
    if m:
        open_tag = m.group(1).replace(' required=""', '').replace(' required', '')
        close_tag = m.group(3)
        new_inner = "\n" + OPTGROUPS_HTML[l] + "\n</select>"
        content = content[:m.start()] + open_tag + new_inner + content[m.end():]
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated subProgram select in homepage {p}")

print("All contact and homepage forms updated successfully!")

