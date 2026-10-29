# -*- coding: utf-8 -*-
import sys

def update_dashboard():
    filepath = 'admin/dashboard.html'
    print(f"Updating {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    helper = '''        const localizeAdminSpeakerList = (list, code) => {
          const DEFS = {
            en: [
              { name: "Mohammad Borsalani", title: "Senior Consultant, Caribbean Citizenship Programs", affiliation: "Sharif Group Dubai" },
              { name: "Mehdi Yarahmadi", title: "Dominica Passport Program Specialist", affiliation: "Sharif Group Dubai" }
            ],
            fa: [
              { name: "محمد برسلانی", title: "مشاور ارشد برنامه‌های شهروندی حوزه کارائیب", affiliation: "شریف گروپ دبی" },
              { name: "مهدی یاراحمدی", title: "کارشناس برنامه پاسپورت دومینیکا", affiliation: "شریف گروپ دبی" }
            ],
            ar: [
              { name: "محمد برسلاني", title: "مستشار أول لبرامج الجنسية في دول الكاريبي", affiliation: "شريف جروب دبي" },
              { name: "مهدي يار أحمدي", title: "خبير برنامج جواز سفر دومينيكا", affiliation: "شريف جروب دبي" }
            ],
            zh: [
              { name: "穆罕默德·巴尔塞拉尼 (Mohammad Borsalani)", title: "加勒比公民身份项目资深顾问", affiliation: "迪拜谢里夫集团" },
              { name: "迈赫迪·亚拉赫马迪 (Mehdi Yarahmadi)", title: "多米尼克护照项目专家", affiliation: "迪拜谢里夫集团" }
            ]
          };
          const defs = DEFS[code] || DEFS.en;
          return list.map(sp => {
            const n = sp.name || '';
            if (/bors[ae]lani|برسلان|巴尔塞拉尼/i.test(n)) {
              return { name: defs[0].name, title: defs[0].title, affiliation: defs[0].affiliation };
            }
            if (/yarahmad|یار\\s*احمد|يار\\s*أحمد|亚拉赫马迪/i.test(n)) {
              return { name: defs[1].name, title: defs[1].title, affiliation: defs[1].affiliation };
            }
            return sp;
          });
        };

        // Update allSessions catalog in window.CMS and window.SGCMS_WEBINARS'''

    target = '        // Update allSessions catalog in window.CMS and window.SGCMS_WEBINARS'
    if 'localizeAdminSpeakerList' not in content:
        content = content.replace(target, helper, 1)

    # Replace the 3 assignments inside the forEach loops
    content = content.replace(
        'match[lgCode].speakers = compiledSpeakers;',
        'match[lgCode].speakers = localizeAdminSpeakerList(compiledSpeakers, lgCode);'
    )
    content = content.replace(
        'matchCms[lgCode].speakers = compiledSpeakers;',
        'matchCms[lgCode].speakers = localizeAdminSpeakerList(compiledSpeakers, lgCode);'
    )
    content = content.replace(
        'item[lgCode].speakers = compiledSpeakers;',
        'item[lgCode].speakers = localizeAdminSpeakerList(compiledSpeakers, lgCode);'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Dashboard updated successfully.")

if __name__ == '__main__':
    update_dashboard()

