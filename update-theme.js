const fs = require('fs');
let css = fs.readFileSync('frontend/src/app/globals.css', 'utf-8');

// Replace light mode sidebar variables
css = css.replace(/--sidebar-background:.*?;/, '--sidebar-background: #0F172A;');
css = css.replace(/--sidebar-foreground:.*?;/, '--sidebar-foreground: #94A3B8;');
css = css.replace(/--sidebar-primary:.*?;/, '--sidebar-primary: #3B82F6;');
css = css.replace(/--sidebar-primary-foreground:.*?;/, '--sidebar-primary-foreground: #FFFFFF;');
css = css.replace(/--sidebar-accent:.*?;/, '--sidebar-accent: #1E293B;');
css = css.replace(/--sidebar-accent-foreground:.*?;/, '--sidebar-accent-foreground: #F8FAFC;');
css = css.replace(/--sidebar-border:.*?;/, '--sidebar-border: #1E293B;');
css = css.replace(/--sidebar-ring:.*?;/, '--sidebar-ring: #3B82F6;');

fs.writeFileSync('frontend/src/app/globals.css', css);
