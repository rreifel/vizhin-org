import * as ftp from 'basic-ftp';
import path from 'path';
import fs from 'fs';

async function deploy() {
  const server = process.env.FTP_SERVER;
  const username = process.env.FTP_USERNAME;
  const password = process.env.FTP_PASSWORD;
  const port = parseInt(process.env.FTP_PORT || '21', 10);

  if (!server || !username || !password) {
    console.error('Missing FTP credentials in environment variables.');
    process.exit(1);
  }

  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log(`Connecting to FTP server: ${server}:${port} as ${username}...`);
    await client.access({
      host: server,
      user: username,
      password: password,
      port: port,
      secure: 'explicit',
      secureOptions: {
        rejectUnauthorized: false
      }
    });

    console.log('Successfully connected to FTP server!');
    const initialPwd = await client.pwd();
    console.log('Initial working directory:', initialPwd);

    const rootList = await client.list();
    console.log('Directory contents at initial PWD:', rootList.map(f => f.name));

    // Determine the path to public_html
    let publicHtmlPath = '';
    const names = rootList.map(f => f.name.toLowerCase());

    if (names.includes('domains')) {
      publicHtmlPath = 'domains/vizhin.co/public_html';
    } else if (names.includes('public_html')) {
      publicHtmlPath = 'public_html';
    } else if (names.includes('vizhin.co')) {
      publicHtmlPath = 'vizhin.co/public_html';
    } else {
      // Check if we are already in public_html or in org
      console.log('Assuming current directory is public_html or destination root.');
      publicHtmlPath = '.';
    }

    console.log(`Target public_html directory path resolved to: "${publicHtmlPath}"`);

    const distDir = path.resolve('dist');
    if (!fs.existsSync(distDir)) {
      throw new Error('dist/ directory does not exist! Run "npm run build" first.');
    }

    if (publicHtmlPath !== '.') {
      console.log(`Navigating to ${publicHtmlPath}...`);
      await client.cd(publicHtmlPath);
      console.log('Current directory is now:', await client.pwd());
    }

    const currentFiles = await client.list();
    console.log('Files in target web directory:', currentFiles.map(f => f.name));

    // Upload to lowercase /org/
    console.log('\n--- UPLOADING TO /org/ ---');
    await client.ensureDir('org');
    console.log('Current directory for /org/:', await client.pwd());
    await client.uploadFromDir(distDir);
    console.log('✓ Successfully uploaded build files to /org/');

    // Upload to uppercase /ORG/
    console.log('\n--- UPLOADING TO /ORG/ ---');
    await client.cd('..');
    await client.ensureDir('ORG');
    console.log('Current directory for /ORG/:', await client.pwd());
    await client.uploadFromDir(distDir);
    console.log('✓ Successfully uploaded build files to /ORG/');

    console.log('\n=== DEPLOYMENT COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('FTP Deployment failed with error:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
