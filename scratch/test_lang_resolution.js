// Test script for language resolution
const fs = require('fs');
const vm = require('vm');

function runTest(urlPath, initialLocalStorageLang) {
    const storage = {
        sharif_lang: initialLocalStorageLang,
        sharif_preferred_lang: initialLocalStorageLang
    };

    const mockDoc = {
        documentElement: {
            lang: 'en',
            dir: 'ltr',
            classList: {
                _classes: new Set(),
                add(c) { this._classes.add(c); },
                remove(c) { this._classes.delete(c); },
                contains(c) { return this._classes.has(c); }
            }
        },
        createElement: () => ({ setAttribute() {}, style: {}, classList: { add() {}, remove() {} } }),
        head: { appendChild() {} },
        body: { appendChild() {} },
        querySelectorAll: () => [],
        querySelector: () => null,
        getElementById: () => null,
        addEventListener: () => {},
        readyState: 'complete'
    };

    const mockWindow = {
        location: {
            pathname: urlPath,
            search: '',
            protocol: 'https:',
            origin: 'https://sharifgroup.ae',
            href: 'https://sharifgroup.ae' + urlPath
        },
        localStorage: {
            getItem(k) { return storage[k] || null; },
            setItem(k, v) { storage[k] = v; },
            removeItem(k) { delete storage[k]; }
        },
        document: mockDoc,
        self: {},
        top: {},
        URLSearchParams: URLSearchParams,
        fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
        setTimeout: (fn) => setTimeout(fn, 0),
        addEventListener: () => {}
    };
    mockWindow.self = mockWindow;
    mockWindow.top = mockWindow;
    mockWindow.window = mockWindow;

    const ctx = vm.createContext(mockWindow);

    // Read language-switcher.js code
    const switcherCode = fs.readFileSync('assets/js/language-switcher.js', 'utf8');
    vm.runInContext(switcherCode, ctx);

    const resolvedLang = ctx.window.getCurrentLanguage();

    // Read cms-live.js code
    const cmsLiveCode = fs.readFileSync('assets/js/cms-live.js', 'utf8');
    vm.runInContext(cmsLiveCode, ctx);

    return {
        resolvedLang,
        docLang: mockDoc.documentElement.lang,
        docDir: mockDoc.documentElement.dir,
        hasPending: mockDoc.documentElement.classList.contains('i18n-pending'),
        storageLang: storage.sharif_lang
    };
}

console.log('--- TEST 1: Root homepage "/" with poisoned localStorage = "zh" ---');
const r1 = runTest('/', 'zh');
console.log(r1);

console.log('\n--- TEST 2: Chinese folder "/zh/" with localStorage = "en" ---');
const r2 = runTest('/zh/', 'en');
console.log(r2);

console.log('\n--- TEST 3: Arabic folder "/ar/" with localStorage = "zh" ---');
const r3 = runTest('/ar/', 'zh');
console.log(r3);

console.log('\n--- TEST 4: Persian folder "/fa/" with localStorage = "en" ---');
const r4 = runTest('/fa/', 'en');
console.log(r4);

console.log('\n--- TEST 5: English subpage "/aboutus/" with localStorage = "zh" ---');
const r5 = runTest('/aboutus/', 'zh');
console.log(r5);
