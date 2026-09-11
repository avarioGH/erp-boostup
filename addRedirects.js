const fs = require('fs');
let content = fs.readFileSync('frontend/next.config.ts', 'utf8');

const additionalRedirects = `
      {
        source: '/reports/pos',
        destination: '/pos/reports',
        permanent: true,
      },
      {
        source: '/reports/ai-summary',
        destination: '/ai/reports',
        permanent: true,
      },
`;

content = content.replace('    return [', '    return [' + additionalRedirects);
fs.writeFileSync('frontend/next.config.ts', content);
console.log('Added redirects to next.config.ts');
