const fs = require('fs');
const path = require('path');

const replacement = `<script>
    (function() {
        try {
            var p = (window.location && window.location.pathname) ? window.location.pathname : '';
            var segs = p.split('/').filter(Boolean);
            var first = segs.length > 0 ? segs[0].toLowerCase() : '';
            if (first === 'ar' || first === 'fa') {
                document.documentElement.dir = 'rtl';
                document.documentElement.lang = first;
            } else if (first === 'zh') {
                document.documentElement.dir = 'ltr';
                document.documentElement.lang = 'zh';
            } else {
                document.documentElement.dir = 'ltr';
                document.documentElement.lang = 'en';
                document.documentElement.classList.remove('i18n-pending');
            }
        } catch(e) {}
    })();
</script>`;

const regex = /<script>\s*\(function\s*\(\)\s*\{\s*try\s*\{\s*var\s+l\s*=\s*localStorage\.getItem\('sharif_lang'\)[\s\S]*?<\/script>/;

function processDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
        const fullPath = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            // Skip dedicated language folders and non-website dirs
            if (['ar', 'fa', 'zh', 'admin', 'assets', 'scratch', 'node_modules', '.git'].includes(ent.name)) {
                continue;
            }
            processDir(fullPath);
        } else if (ent.isFile() && ent.name.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (regex.test(content)) {
                content = content.replace(regex, replacement);
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated: ' + fullPath);
            }
        }
    }
}

// Process root index.html and all English directories
processDir('.');
console.log('Finished updating English HTML files.');
