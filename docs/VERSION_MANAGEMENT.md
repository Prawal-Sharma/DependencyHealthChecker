# Version Management Guide

This guide provides comprehensive instructions for managing versions, creating releases, and maintaining semantic versioning for the Dependency Health Checker.

## Table of Contents

- [Semantic Versioning](#semantic-versioning)
- [Version Bump Workflow](#version-bump-workflow)
- [Release Types](#release-types)
- [Step-by-Step Release Process](#step-by-step-release-process)
- [Automated Versioning](#automated-versioning)
- [Rollback Procedures](#rollback-procedures)
- [Best Practices](#best-practices)

## Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/) (SemVer):

```
MAJOR.MINOR.PATCH
```

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

### Pre-release Versions

```
1.0.0-alpha.1  # Alpha release
1.0.0-beta.1   # Beta release
1.0.0-rc.1     # Release candidate
```

## Version Bump Workflow

### 1. Ensure Clean Working Directory

```bash
# Check status
git status

# Stash or commit any changes
git add .
git commit -m "Your commit message"

# Pull latest changes
git pull origin main
```

### 2. Run Tests

```bash
# Run full test suite
npm test

# Run with coverage
npm run test:coverage

# Verify CLI works
npm link
depcheck --version
npm unlink
```

### 3. Update CHANGELOG.md

```markdown
## [1.0.1] - 2024-01-15

### Fixed
- Fixed vulnerability detection for scoped packages
- Improved error handling for network timeouts

### Changed
- Updated error messages for clarity
```

### 4. Bump Version

```bash
# Automatic version bump (recommended)
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0

# Manual version setting
npm version 1.2.3

# Pre-release versions
npm version prerelease --preid=beta  # 1.0.0 → 1.0.1-beta.0
npm version prerelease               # 1.0.1-beta.0 → 1.0.1-beta.1
```

### 5. Publish to NPM

```bash
# Publish stable release
npm publish

# Publish pre-release
npm publish --tag beta
npm publish --tag alpha
npm publish --tag next
```

### 6. Push to GitHub

```bash
# Push commits and tags
git push origin main --tags

# Or separately
git push origin main
git push origin v1.0.1
```

## Release Types

### Patch Release (Bug Fixes)

**When to use:**
- Bug fixes
- Security patches
- Documentation updates
- Performance improvements (non-breaking)

**Example workflow:**

```bash
# 1. Make fixes
git add .
git commit -m "Fix: resolve issue with Python scanner"

# 2. Update changelog
echo "## [1.0.1] - $(date +%Y-%m-%d)

### Fixed
- Resolved Python scanner compatibility issue
" >> CHANGELOG.md

git add CHANGELOG.md
git commit -m "Update CHANGELOG for v1.0.1"

# 3. Bump version
npm version patch -m "Release v%s - Bug fixes"

# 4. Publish
npm publish

# 5. Push
git push origin main --tags
```

### Minor Release (New Features)

**When to use:**
- New features
- New commands or options
- Support for new ecosystems
- Non-breaking API changes

**Example workflow:**

```bash
# 1. Merge feature branch
git checkout main
git merge feature/ruby-support

# 2. Update changelog
cat >> CHANGELOG.md << EOF
## [1.1.0] - $(date +%Y-%m-%d)

### Added
- Support for Ruby Gemfile scanning
- New --format option for custom output
- Progress bar for long operations

### Changed
- Improved performance for large projects
EOF

git add CHANGELOG.md
git commit -m "Update CHANGELOG for v1.1.0"

# 3. Bump version
npm version minor -m "Release v%s - Ruby support and new features"

# 4. Publish
npm publish

# 5. Push and create release
git push origin main --tags
```

### Major Release (Breaking Changes)

**When to use:**
- Breaking API changes
- Removing features
- Major architecture changes
- Incompatible configuration changes

**Example workflow:**

```bash
# 1. Prepare major version
git checkout -b release/v2.0.0

# 2. Update changelog with migration guide
cat >> CHANGELOG.md << EOF
## [2.0.0] - $(date +%Y-%m-%d)

### BREAKING CHANGES
- Changed CLI command from 'depcheck' to 'healthcheck'
- Removed support for Node.js < 16
- New configuration file format

### Migration Guide
1. Update command in scripts: depcheck → healthcheck
2. Update Node.js to version 16 or higher
3. Convert .depcheckrc to new format (see docs)

### Added
- Plugin system for custom scanners
- Web dashboard interface
EOF

# 3. Update README with breaking changes notice
# 4. Bump major version
npm version major -m "Release v%s - Major update with breaking changes"

# 5. Publish
npm publish

# 6. Push and create detailed release notes
git push origin main --tags
```

## Step-by-Step Release Process

### Complete Release Checklist

```bash
#!/bin/bash
# release.sh - Complete release script

# 1. Preparation
echo "📋 Pre-release checks..."
git checkout main
git pull origin main
npm test
npm run lint

# 2. Get version type
echo "What type of release? (patch/minor/major)"
read VERSION_TYPE

# 3. Get release description
echo "Brief description of changes:"
read DESCRIPTION

# 4. Update CHANGELOG
echo "Updating CHANGELOG..."
# (Add your changelog update here)

# 5. Commit changelog
git add CHANGELOG.md
git commit -m "Update CHANGELOG for release"

# 6. Bump version
echo "Bumping version..."
npm version $VERSION_TYPE -m "Release v%s - $DESCRIPTION"

# 7. Publish to NPM
echo "Publishing to NPM..."
npm publish

# 8. Push to GitHub
echo "Pushing to GitHub..."
git push origin main --tags

# 9. Create GitHub release
echo "✅ Done! Now create GitHub release at:"
echo "https://github.com/Prawal-Sharma/DependencyHealthChecker/releases/new"
```

### Quick Release Commands

```bash
# Patch release (bug fix)
npm version patch && npm publish && git push origin main --tags

# Minor release (new feature)
npm version minor && npm publish && git push origin main --tags

# Major release (breaking change)
npm version major && npm publish && git push origin main --tags

# Pre-release
npm version prerelease --preid=beta && npm publish --tag beta && git push origin main --tags
```

## Automated Versioning

### GitHub Actions Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version type (patch/minor/major)'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Configure Git
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Bump version
        run: npm version ${{ github.event.inputs.version }}
      
      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Push changes
        run: git push origin main --tags
      
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ steps.version.outputs.new_version }}
          release_name: Release v${{ steps.version.outputs.new_version }}
          draft: false
          prerelease: false
```

## Rollback Procedures

### NPM Rollback

```bash
# Unpublish a specific version (within 72 hours)
npm unpublish @prawals/dependency-health-checker@1.0.1

# Deprecate a version (recommended over unpublish)
npm deprecate @prawals/dependency-health-checker@1.0.1 "Critical bug, please use 1.0.2"

# Point latest tag to previous version
npm dist-tag add @prawals/dependency-health-checker@1.0.0 latest
```

### Git Rollback

```bash
# Delete local tag
git tag -d v1.0.1

# Delete remote tag
git push origin :refs/tags/v1.0.1

# Revert commits
git revert HEAD
git push origin main
```

## Best Practices

### 1. Version Planning

- **Plan releases**: Group related changes
- **Regular cadence**: Weekly patches, monthly minors
- **Communicate**: Announce major versions in advance

### 2. Commit Messages

Use conventional commits for automatic changelog generation:

```bash
feat: add Ruby support
fix: resolve timeout issue
docs: update API documentation
chore: update dependencies
BREAKING CHANGE: remove deprecated API
```

### 3. Testing Releases

```bash
# Test package before publishing
npm pack
npm install -g ./prawals-dependency-health-checker-*.tgz
depcheck --version

# Test in different environments
docker run -it node:14 npm install -g @prawals/dependency-health-checker
docker run -it node:16 npm install -g @prawals/dependency-health-checker
docker run -it node:18 npm install -g @prawals/dependency-health-checker
```

### 4. Release Notes Template

```markdown
## What's Changed

### ✨ New Features
- Feature 1 by @contributor in #PR

### 🐛 Bug Fixes
- Fix 1 by @contributor in #PR

### 📚 Documentation
- Doc update by @contributor in #PR

### 🔧 Maintenance
- Dependency updates

### ⚠️ Breaking Changes (if major version)
- Change description
- Migration instructions

**Full Changelog**: https://github.com/Prawal-Sharma/DependencyHealthChecker/compare/v1.0.0...v1.1.0
```

### 5. Version Branches

```bash
# Create release branch for major versions
git checkout -b release/v2.0.0

# Create hotfix branch for urgent patches
git checkout -b hotfix/v1.0.1

# Merge back to main
git checkout main
git merge release/v2.0.0
```

### 6. Pre-release Testing

```bash
# Publish beta for testing
npm version 2.0.0-beta.1
npm publish --tag beta

# Users test beta
npm install -g @prawals/dependency-health-checker@beta

# Iterate on feedback
npm version 2.0.0-beta.2
npm publish --tag beta

# Final release
npm version 2.0.0
npm publish
```

## Version History Tracking

### View Version History

```bash
# NPM versions
npm view @prawals/dependency-health-checker versions --json

# Git tags
git tag -l

# Detailed tag info
git show v1.0.0
```

### Generate Changelog Automatically

```bash
# Install changelog generator
npm install -g conventional-changelog-cli

# Generate changelog
conventional-changelog -p angular -i CHANGELOG.md -s
```

## Troubleshooting

### Common Issues

1. **"Cannot publish over existing version"**
   - You must bump the version before publishing
   - Check current version: `npm view @prawals/dependency-health-checker version`

2. **"Tag already exists"**
   - Delete the tag: `git tag -d v1.0.1`
   - Push deletion: `git push origin :refs/tags/v1.0.1`

3. **"Working directory not clean"**
   - Commit or stash changes before version bump
   - `git stash` then `git stash pop` after

4. **"Permission denied"**
   - Ensure you're logged in: `npm whoami`
   - Check ownership: `npm owner ls @prawals/dependency-health-checker`

---

Last Updated: 2024-01-08
Current Version: 1.0.0