const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedFiles = 0;

walkDir('src/app', function(filePath) {
    if (!filePath.endsWith('page.tsx')) return;
    
    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;

    content = content.replace(/(?<!md:|lg:|sm:|xl:)(grid-cols-[2-6])/g, 'grid-cols-1 md:$1');
    content = content.replace(/className="([^"]*?)\bp-8\b([^"]*?)"/g, 'className="$1p-4 md:p-8$2"');
    content = content.replace(/className="([^"]*?)\bp-24\b([^"]*?)"/g, 'className="$1p-8 md:p-24$2"');
    
    content = content.replace(/className="([^"]*?)\bflex\s+items-center\s+justify-between\b([^"]*?)"/g, 
        'className="$1flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0$2"');

    content = content.replace(/<table\b([^>]*)>/g, (match, p1) => {
        if (!p1.includes('min-w-')) {
            if (p1.includes('className="')) {
                return match.replace('className="', 'className="min-w-[600px] md:min-w-full ');
            } else {
                return `<table className="min-w-[600px] md:min-w-full" ${p1}>`;
            }
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        modifiedFiles++;
    }
});

console.log(`Globally patched ${modifiedFiles} files with basic responsive rules!`);
