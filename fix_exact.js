const fs = require('fs');

function replaceFileStr(path, search, replace) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.split(search).join(replace);
    fs.writeFileSync(path, content, 'utf8');
  }
}

replaceFileStr('frontend/src/app/crm/customers/[id]/page.tsx', 'api.get(/crm/customers/\\/360);', "api.get('/crm/customers/' + params.id + '/360');");
replaceFileStr('frontend/src/app/manufacturing/quality/page.tsx', '{c.work_order && \\ / \\}', "{c.work_order && ' / '}");
replaceFileStr('frontend/src/app/manufacturing/quality/page.tsx', 'className={\\px-2 py-1 rounded text-xs font-semibold \\}', "className='px-2 py-1 rounded text-xs font-semibold'");

console.log('Fixed exactly');
