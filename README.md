# Vizhin GTM Technology Solutions

This is the official repository for the Vizhin LLC GTM Technology Solutions website.

## Features
- **Modern Responsive Design**: Beautiful display typography using Inter and modern visual elements.
- **Dynamic Routing & Navigation**: Smooth navigation between sections.
- **Robust Layout**: Tailored specifically for secured GTM leadership and white-labeled tech solutions.

## Automated Deployment (GitHub Actions)
Whenever changes are pushed to the `main` branch, a GitHub Action will automatically:
1. Install project dependencies.
2. Compile/build the production-ready React + Vite assets into the `dist/` directory.
3. Securely deploy those compiled files via FTP directly to your Hostinger server.

### Required Secrets
To make the automated deployment work, ensure you have configured the following **Repository Secrets** in your GitHub repository settings under **Settings > Secrets and variables > Actions**:

1. `FTP_SERVER` - Set to `194.195.84.83` (IP address only, no `ftp://` prefix).
2. `FTP_USERNAME` - Set to `u824818154`.
3. `FTP_PASSWORD` - Set to your Hostinger FTP password.
