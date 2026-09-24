const fs = require('fs');
let css = fs.readFileSync('frontend/src/app/globals.css', 'utf-8');

// Update sidebar variables for Dark Navy theme
css = css.replace(/--sidebar-background:.*?;/g, '--sidebar-background: #0F172A;');
css = css.replace(/--sidebar-foreground:.*?;/g, '--sidebar-foreground: #E2E8F0;');
css = css.replace(/--sidebar-primary:.*?;/g, '--sidebar-primary: #2563EB;');
css = css.replace(/--sidebar-primary-foreground:.*?;/g, '--sidebar-primary-foreground: #FFFFFF;');
css = css.replace(/--sidebar-accent:.*?;/g, '--sidebar-accent: #1E293B;');
css = css.replace(/--sidebar-accent-foreground:.*?;/g, '--sidebar-accent-foreground: #F8FAFC;');
css = css.replace(/--sidebar-border:.*?;/g, '--sidebar-border: #1E293B;');
css = css.replace(/--sidebar-ring:.*?;/g, '--sidebar-ring: #2563EB;');

fs.writeFileSync('frontend/src/app/globals.css', css);
console.log('CSS updated');
