import fs from 'fs';
import path from 'path';

const routes = ['ORG', 'org', 'ORGdemo', 'orgdemo', 'ORG/Setup', 'org/setup', 'login', 'request', 'portal'];
const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  routes.forEach(route => {
    const routeDir = path.join(distDir, route);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtml, 'utf8');
    console.log(`✓ Created static SPA fallback: dist/${route}/index.html`);
  });

  // Create .htaccess for /org/
  const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /org/
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /org/index.html [L]
</IfModule>
`;
  fs.writeFileSync(path.join(distDir, '.htaccess'), htaccessContent, 'utf8');
  console.log('✓ Created dist/.htaccess (RewriteBase /org/)');

  // Also write .htaccess inside dist/ORG/
  const htaccessOrgUpper = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /ORG/
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /ORG/index.html [L]
</IfModule>
`;
  fs.writeFileSync(path.join(distDir, 'ORG', '.htaccess'), htaccessOrgUpper, 'utf8');
  fs.writeFileSync(path.join(distDir, 'org', '.htaccess'), htaccessContent, 'utf8');

  // Ensure assets exist at dist/org/assets and dist/ORG/assets for absolute fail-safety
  const assetsSrc = path.join(distDir, 'assets');
  if (fs.existsSync(assetsSrc)) {
    const copyDir = (src, dest) => {
      fs.mkdirSync(dest, { recursive: true });
      for (const item of fs.readdirSync(src)) {
        const s = path.join(src, item);
        const d = path.join(dest, item);
        if (fs.statSync(s).isDirectory()) {
          copyDir(s, d);
        } else {
          fs.copyFileSync(s, d);
        }
      }
    };
    copyDir(assetsSrc, path.join(distDir, 'org', 'assets'));
    copyDir(assetsSrc, path.join(distDir, 'ORG', 'assets'));
    console.log('✓ Mirrored assets into dist/org/assets and dist/ORG/assets');
  }
} else {
  console.error('Error: dist/index.html does not exist.');
}
