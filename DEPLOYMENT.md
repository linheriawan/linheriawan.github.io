# GitHub Pages Deployment Guide

This repository uses **GitHub Actions** for automated deployment to GitHub Pages.

## How It Works

1. **Source Code**: Your Svelte app lives in `svelte-app/`
2. **Automatic Build**: When you push to `main` branch, GitHub Actions automatically:
   - Installs dependencies
   - Builds the SvelteKit app
   - Deploys to GitHub Pages
3. **Live Site**: Your site is available at `https://linheriawan.github.io`

## Repository Structure

```
linheriawan.github.io/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated deployment workflow
├── old_site/                   # Original site (archived)
├── svelte-app/                 # Your Svelte source code
│   ├── src/                    # Svelte components & routes
│   ├── static/                 # Static assets
│   ├── package.json
│   └── svelte.config.js        # Build configuration
├── .gitignore                  # Prevents committing build files
└── DEPLOYMENT.md              # This file
```

**Note**: The `svelte-app/build/` directory is NOT committed to git. GitHub Actions builds it fresh on every deployment.

## Local Development

```bash
cd svelte-app
npm install              # Install dependencies
npm run dev             # Start dev server at http://localhost:5173
npm run build           # Test production build locally
npm run preview         # Preview production build
```

## Deployment Steps

### First-Time Setup on GitHub

1. **Push your code** to GitHub:
   ```bash
   git add .
   git commit -m "Setup automated GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages** in repository settings:
   - Go to: `Settings` → `Pages`
   - Under **Source**, select: `GitHub Actions`
   - Save

3. **Wait for deployment**:
   - Go to `Actions` tab
   - Watch the "Deploy to GitHub Pages" workflow
   - Once complete, your site is live!

### Regular Updates

Just push your changes:

```bash
cd svelte-app
# Make your changes...
git add .
git commit -m "Update site content"
git push
```

GitHub Actions will automatically rebuild and deploy your site within 2-3 minutes.

## Monitoring Deployments

- **View workflows**: `Actions` tab on GitHub
- **Check deployment status**: Look for green checkmark ✓
- **View logs**: Click on any workflow run to see detailed logs
- **Troubleshooting**: If deployment fails, check the workflow logs for errors

## Configuration Files

### `.github/workflows/deploy.yml`
- Defines the automated build and deployment process
- Triggers on push to `main` branch
- Uses Node.js 20 and official GitHub Actions

### `svelte-app/svelte.config.js`
- Configures `adapter-static` for static site generation
- Sets `paths.base: ''` for user/org GitHub Pages
- Outputs to `build/` directory

### `.gitignore`
- Prevents committing `build/` and `node_modules/`
- Keeps repository clean and focused on source code

## Troubleshooting

### Deployment fails
- Check `Actions` tab for error messages
- Ensure `package.json` and `package-lock.json` are committed
- Verify all dependencies are in `package.json`

### 404 errors after deployment
- Ensure GitHub Pages source is set to "GitHub Actions"
- Check that `paths.base` in `svelte.config.js` is empty string

### Assets not loading
- Use relative paths in your code
- Place static files in `svelte-app/static/`
- SvelteKit automatically handles asset paths

## Rollback

To rollback to a previous version:

```bash
git revert HEAD              # Revert last commit
git push                     # Triggers new deployment
```

Or deploy a specific commit:

```bash
git checkout <commit-hash>
git push --force origin main  # Use with caution!
```

## Additional Resources

- [SvelteKit Static Adapter](https://kit.svelte.dev/docs/adapter-static)
- [GitHub Pages Documentation](https://docs.github.com/pages)
- [GitHub Actions Documentation](https://docs.github.com/actions)
