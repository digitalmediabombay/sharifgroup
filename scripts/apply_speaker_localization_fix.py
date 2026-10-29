# -*- coding: utf-8 -*-
import sys
import os

def update_webinars_app(filepath):
    print(f"Updating {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Insert helper definitions before 'function webinars()'
    helper_code = '''  const DEFAULT_SPEAKERS_BY_LANG = {
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

  const isBorsalani = name => {
    if (!name || typeof name !== 'string') return false;
    return /bors[ae]lani|برسلان|巴尔塞拉尼/i.test(name);
  };

  const isYarahmadi = name => {
    if (!name || typeof name !== 'string') return false;
    return /yarahmad|یار\s*احمد|يار\s*أحمد|亚拉赫马迪/i.test(name);
  };

  const localizeSpeaker = (sp, targetLang) => {
    if (!sp) return sp;
    const tgt = targetLang || (typeof lang !== 'undefined' ? lang : 'en') || 'en';
    const defs = DEFAULT_SPEAKERS_BY_LANG[tgt] || DEFAULT_SPEAKERS_BY_LANG.en;
    
    if (Array.isArray(sp)) {
      const [k] = sp;
      if (k === 'host') return null;
      if (k === 'expert' || isBorsalani(k)) return defs[0];
      if (k === 'expert2' || isYarahmadi(k)) return defs[1];
    }
    
    const name = typeof sp === 'string' ? sp : (sp.name || '');
    if (isBorsalani(name)) {
      return {
        name: defs[0].name,
        title: defs[0].title,
        affiliation: defs[0].affiliation,
        note: (sp && typeof sp === 'object') ? (sp.note || '') : ''
      };
    }
    if (isYarahmadi(name)) {
      return {
        name: defs[1].name,
        title: defs[1].title,
        affiliation: defs[1].affiliation,
        note: (sp && typeof sp === 'object') ? (sp.note || '') : ''
      };
    }
    return sp;
  };

  const localizeSpeakers = (list, targetLang) => {
    const tgt = targetLang || (typeof lang !== 'undefined' ? lang : 'en') || 'en';
    if (!Array.isArray(list) || !list.length) {
      return (DEFAULT_SPEAKERS_BY_LANG[tgt] || DEFAULT_SPEAKERS_BY_LANG.en).slice();
    }
    return list
      .map(sp => localizeSpeaker(sp, tgt))
      .filter(Boolean)
      .filter(sp => {
        if (Array.isArray(sp)) return sp[0] !== 'host';
        const roleStr = (((sp && sp.title) || '') + ' ' + ((sp && sp.role) || '') + ' ' + ((sp && sp.note) || '')).toLowerCase();
        return !roleStr.includes('host') && !roleStr.includes('مجری') && !roleStr.includes('مقدّم') && !roleStr.includes('主持人');
      });
  };

  function webinars() {'''

    if 'const DEFAULT_SPEAKERS_BY_LANG' not in content:
        content = content.replace('function webinars() {', helper_code, 1)
        print("  Added DEFAULT_SPEAKERS_BY_LANG and localizeSpeakers helpers.")
    else:
        print("  DEFAULT_SPEAKERS_BY_LANG already present.")

    # 2. In webinars(), update schedule merge to localize for each lgCode
    old_sched_merge = '''        if (spList && spList.length) {
          w.speakers = spList;
          w.speakers_updated = true;
          ['en', 'fa', 'ar', 'zh'].forEach(lgCode => {
            if (!w[lgCode]) w[lgCode] = {};
            w[lgCode].speakers = spList;
          });
        }'''

    new_sched_merge = '''        if (spList && spList.length) {
          w.speakers = spList;
          w.speakers_updated = true;
          ['en', 'fa', 'ar', 'zh'].forEach(lgCode => {
            if (!w[lgCode]) w[lgCode] = {};
            w[lgCode].speakers = localizeSpeakers(spList, lgCode);
          });
        }'''

    if old_sched_merge in content:
        content = content.replace(old_sched_merge, new_sched_merge)
        print("  Updated schedule merge in webinars() to localize speakers per language.")

    # 3. In C(w), ensure cur.speakers is prioritized and passed through localizeSpeakers(..., lang)
    old_c_speakers = '''      speakers: (w.speakers_updated && Array.isArray(w.speakers) && w.speakers.length)
        ? w.speakers
        : ((Array.isArray(w.speakers) && w.speakers.length) ? w.speakers : ((Array.isArray(cur.speakers) && cur.speakers.length) ? cur.speakers : []))'''

    new_c_speakers = '''      speakers: (() => {
        let rawSpeakers = [];
        if (Array.isArray(cur.speakers) && cur.speakers.length) {
          rawSpeakers = cur.speakers;
        } else if (Array.isArray(w.speakers) && w.speakers.length) {
          rawSpeakers = w.speakers;
        } else if (Array.isArray(en.speakers) && en.speakers.length) {
          rawSpeakers = en.speakers;
        }
        return localizeSpeakers(rawSpeakers, lang);
      })()'''

    if old_c_speakers in content:
        content = content.replace(old_c_speakers, new_c_speakers)
        print("  Updated C(w) speakers resolver.")
    else:
        print("  Note: old_c_speakers not found or already updated.")

    # 4. In viewDetail(slug)
    # Check if defaultSpeakersByLang block exists in viewDetail
    old_viewdetail_block = '''    const defaultSpeakersByLang = {
      en: [
        { name: "Mohammad Borsalani", title: "Senior Consultant, Caribbean Citizenship Programs", affiliation: "Sharif Group Dubai" },
        { name: "Mehdi Yarahmadi", title: "Dominica Passport Program Specialist", affiliation: "Sharif Group Dubai" }
      ],
      fa: [
        { name: "محمد برسلانی", title: "مشاور ارشد برنامه‌های شهروندی کارائیبی", affiliation: "شریف گروپ دبی" },
        { name: "مهدی یاراحمدی", title: "کارشناس برنامه پاسپورت دومینیکا", affiliation: "شریف گروپ دبی" }
      ],
      ar: [
        { name: "محمد برسلاني", title: "مستشار أول لبرامج الجنسية في دول الكاريبي", affiliation: "شريف جروب دبي" },
        { name: "مهدي يار أحمدي", title: "خبير برنامج جواز سفر دومينيكا", affiliation: "شريف جروب دبي" }
      ],
      zh: [
        { name: "穆罕默德·巴尔塞拉尼 (Mohammad Borsalani)", title: "加勒比公民身份项目高级顾问", affiliation: "Sharif Group 迪拜" },
        { name: "迈赫迪·亚拉赫马迪 (Mehdi Yarahmadi)", title: "多米尼克护照项目专家", affiliation: "Sharif Group 迪拜" }
      ]
    };
    const defaultTwoSpeakers = defaultSpeakersByLang[lang] || defaultSpeakersByLang.en;
    let speakersList = (Array.isArray(c.speakers) && c.speakers.length)
      ? c.speakers
      : ((Array.isArray(w.speakers) && w.speakers.length) ? w.speakers : defaultTwoSpeakers);
    // Filter out any legacy host entry
    speakersList = speakersList.filter(sp => {
      if (Array.isArray(sp)) return sp[0] !== 'host';
      const roleStr = ((sp.title || '') + ' ' + (sp.role || '') + ' ' + (sp.note || '')).toLowerCase();
      return !roleStr.includes('host') && !roleStr.includes('مجری') && !roleStr.includes('مقدّم') && !roleStr.includes('主持人');
    });
    if (!speakersList.length) speakersList = defaultTwoSpeakers;'''

    new_viewdetail_block = '''    const defaultTwoSpeakers = DEFAULT_SPEAKERS_BY_LANG[lang] || DEFAULT_SPEAKERS_BY_LANG.en;
    let speakersList = (Array.isArray(c.speakers) && c.speakers.length)
      ? c.speakers
      : ((Array.isArray(w.speakers) && w.speakers.length) ? w.speakers : defaultTwoSpeakers);
    speakersList = localizeSpeakers(speakersList, lang);
    if (!speakersList.length) speakersList = defaultTwoSpeakers;'''

    if old_viewdetail_block in content:
        content = content.replace(old_viewdetail_block, new_viewdetail_block)
        print("  Updated viewDetail speakers in main app.")
    else:
        # Check demo app version
        old_demo_vd = '''    const speakersList = (Array.isArray(c.speakers) && c.speakers.length) ? c.speakers : [['expert', I.user], ['host', I.mic]];'''
        if old_demo_vd in content:
            content = content.replace(old_demo_vd, new_viewdetail_block)
            print("  Updated viewDetail speakers in demo app.")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Done updating {filepath}.")

if __name__ == '__main__':
    update_webinars_app('assets/js/webinars-app.js')
    if os.path.exists('Sharif-Webinars-Demo_1/sharif-webinars-demo/assets/js/webinars-app.js'):
        update_webinars_app('Sharif-Webinars-Demo_1/sharif-webinars-demo/assets/js/webinars-app.js')

