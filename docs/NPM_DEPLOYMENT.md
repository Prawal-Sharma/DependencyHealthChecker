# NPM Deployment Guide

This guide provides step-by-step instructions for publishing the Dependency Health Checker to NPM and creating releases.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Publishing Checklist](#pre-publishing-checklist)
- [First-Time Setup](#first-time-setup)
- [Publishing Process](#publishing-process)
- [Post-Publishing Steps](#post-publishing-steps)
- [Version Management](#version-management)
- [Troubleshooting](#troubleshooting)
- [Automated Deployment](#automated-deployment)

## Prerequisites

### Required Accounts
1. **NPM Account**: Create at https://www.npmjs.com/signup
2. **GitHub Account**: With repository access
3. **Two-Factor Authentication**: Recommended for NPM account

### Local Setup
```bash
# Verify Node.js and NPM installation
node --version  # Should be >= 14.0.0
npm --version   # Should be >= 6.0.0

# Login to NPM
npm login
# Enter username, password, and email
# If 2FA is enabled, enter OTP code

# Verify login
npm whoami
```

## Pre-Publishing Checklist

### 1. Code Quality Checks
```bash
# Run all tests
npm test

# Check test coverage
npm run test:coverage

# Run linter
npm run lint

# Test the CLI locally
npm link
depcheck --help
depcheck --version

# Unlink after testing
npm unlink
```

### 2. Dependency Audit
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities if any
npm audit fix

# Update dependencies
npm update

# Check outdated packages
npm outdated
```

### 3. Documentation Review
- [ ] README.md is up to date
- [ ] CHANGELOG.md reflects current version
- [ ] API documentation is accurate
- [ ] All examples work correctly
- [ ] License file is present

### 4. Package.json Validation
```bash
# Validate package.json
npm ls

# Check what will be published
npm pack --dry-run

# Review the file list
npm pack --dry-run 2>&1 | grep -E "^npm notice"
```

## First-Time Setup

### 1. Create .npmignore
```bash
# Files to exclude from NPM package
echo "# Test files
test/
*.test.js

# Documentation
docs/
*.md
!README.md
!LICENSE

# Development files
.github/
.vscode/
.idea/
*.log
.DS_Store

# Source control
.git/
.gitignore

# Build artifacts
coverage/
.nyc_output/

# Config files
.eslintrc*
.prettierrc*
jest.config.js

# Examples
examples/
" > .npmignore
```

### 2. Verify Package Metadata
```json
// Ensure package.json has these required fields:
{
  "name": "dependency-health-checker",  // Must be unique on NPM
  "version": "1.0.0",                   // Follow semver
  "description": "...",                 // Clear description
  "main": "src/index.js",               // Entry point
  "bin": {                              // CLI executable
    "depcheck": "./bin/depcheck"
  },
  "keywords": [...],                    // Searchable terms
  "author": "Your Name",                // Author info
  "license": "MIT",                     // License type
  "repository": {                       // GitHub repo
    "type": "git",
    "url": "git+https://github.com/..."
  },
  "bugs": {                             // Issue tracker
    "url": "https://github.com/.../issues"
  },
  "homepage": "https://github.com/...", // Project homepage
  "engines": {                          // Node version requirement
    "node": ">=14.0.0"
  }
}
```

### 3. Test Package Installation
```bash
# Create a test package
npm pack

# This creates dependency-health-checker-1.0.0.tgz
# Test installing it globally
npm install -g ./dependency-health-checker-1.0.0.tgz

# Test the installed package
depcheck --version

# Uninstall test package
npm uninstall -g dependency-health-checker

# Clean up
rm dependency-health-checker-*.tgz
```

## Publishing Process

### Step 1: Final Verification
```bash
# Ensure you're on the main branch
git checkout main

# Pull latest changes
git pull origin main

# Verify clean working directory
git status
# Should show: "nothing to commit, working tree clean"

# Run final test
npm test
```

### Step 2: Version Bump
```bash
# For first release (1.0.0)
# Version is already set in package.json

# For future releases, use npm version
# Patch release (1.0.0 → 1.0.1)
npm version patch

# Minor release (1.0.0 → 1.1.0)
npm version minor

# Major release (1.0.0 → 2.0.0)
npm version major

# This automatically:
# - Updates package.json version
# - Creates a git commit
# - Creates a git tag
```

### Step 3: Publish to NPM
```bash
# Dry run to see what will be published
npm publish --dry-run

# Check the output carefully
# Ensure no sensitive files are included

# Publish to NPM (public package)
npm publish --access public

# If you have 2FA enabled, enter your OTP when prompted
```

### Step 4: Verify Publication
```bash
# Check on NPM
npm view dependency-health-checker

# Visit NPM page
# https://www.npmjs.com/package/dependency-health-checker

# Test installation from NPM
npm install -g dependency-health-checker

# Verify it works
depcheck --version
```

## Post-Publishing Steps

### 1. Push Git Tags
```bash
# Push the version tag to GitHub
git push origin main --tags

# Or push specific tag
git push origin v1.0.0
```

### 2. Create GitHub Release
```bash
# Using GitHub CLI (gh)
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Release" \
  --notes-file CHANGELOG.md \
  --target main

# Or manually:
# 1. Go to https://github.com/Prawal-Sharma/DependencyHealthChecker/releases
# 2. Click "Create a new release"
# 3. Choose tag: v1.0.0
# 4. Release title: "v1.0.0 - Initial Release"
# 5. Copy release notes from CHANGELOG.md
# 6. Click "Publish release"
```

### 3. Update README Badge
```markdown
<!-- Add to README.md after the title -->
[![npm version](https://badge.fury.io/js/dependency-health-checker.svg)](https://www.npmjs.com/package/dependency-health-checker)
[![npm downloads](https://img.shields.io/npm/dm/dependency-health-checker.svg)](https://www.npmjs.com/package/dependency-health-checker)
```

### 4. Announce Release
- Tweet about the release (optional)
- Post in relevant forums/communities
- Update project website if applicable

## Version Management

### Semantic Versioning Rules
```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes (backward compatible)
```

### Version Workflow
```bash
# 1. Make changes
git add .
git commit -m "Fix: resolve vulnerability scanning issue"

# 2. Update CHANGELOG.md
echo "## [1.0.1] - $(date +%Y-%m-%d)
### Fixed
- Resolved vulnerability scanning issue" >> CHANGELOG.md

# 3. Commit changelog
git add CHANGELOG.md
git commit -m "Update CHANGELOG for v1.0.1"

# 4. Bump version
npm version patch

# 5. Publish
npm publish

# 6. Push to GitHub
git push origin main --tags
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "You do not have permission to publish"
```bash
# Check if package name is taken
npm view dependency-health-checker

# If taken, update package.json with a scoped name
"name": "@yourusername/dependency-health-checker"

# Publish scoped package publicly
npm publish --access public
```

#### 2. "npm ERR! 402 Payment Required"
```bash
# For scoped packages, specify public access
npm publish --access public
```

#### 3. "npm ERR! code E403"
```bash
# Verify you're logged in
npm whoami

# Re-login if needed
npm logout
npm login
```

#### 4. "Package name too similar to existing package"
```bash
# NPM prevents typosquatting
# Choose a more distinct name in package.json
"name": "depcheck-health-analyzer"
```

#### 5. Two-Factor Authentication Issues
```bash
# If 2FA is required but not set up:
# 1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
# 2. Enable 2FA
# 3. Use authenticator app for OTP

# Publishing with 2FA
npm publish --otp=YOUR_6_DIGIT_CODE
```

## Automated Deployment

### GitHub Actions for NPM Publishing

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      
      - run: npm test
      
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

### Setting up NPM Token
```bash
# 1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
# 2. Click "Generate New Token"
# 3. Choose "Automation" token type
# 4. Copy the token

# 5. Add to GitHub repository secrets:
#    - Go to repository Settings → Secrets → Actions
#    - Click "New repository secret"
#    - Name: NPM_TOKEN
#    - Value: [paste your token]
```

## Release Schedule

### Recommended Release Cadence
- **Patch releases**: As needed for bug fixes
- **Minor releases**: Monthly for new features
- **Major releases**: Quarterly or annually

### Pre-release Versions
```bash
# Beta release
npm version 1.1.0-beta.0
npm publish --tag beta

# Users install beta with:
npm install dependency-health-checker@beta

# RC (Release Candidate)
npm version 1.1.0-rc.0
npm publish --tag rc
```

## Maintenance Tasks

### Weekly
- Review and respond to issues
- Check for security vulnerabilities
- Review pull requests

### Monthly
- Update dependencies
- Plan feature releases
- Review download statistics

### Quarterly
- Major version planning
- Performance review
- Documentation updates

## NPM Package Statistics

### View Package Stats
```bash
# Command line stats
npm view dependency-health-checker

# Detailed stats at:
# https://www.npmjs.com/package/dependency-health-checker

# Download statistics:
# https://npm-stat.com/charts.html?package=dependency-health-checker
```

## Support Resources

- NPM Documentation: https://docs.npmjs.com/
- NPM Support: https://www.npmjs.com/support
- Semantic Versioning: https://semver.org/
- GitHub Releases: https://docs.github.com/en/repositories/releasing-projects-on-github

---

Last Updated: 2024-01-08
Version: 1.0.0