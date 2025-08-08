# User Guide

Complete guide for using the Dependency Health Checker CLI tool to maintain healthy, secure dependencies in your projects.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Understanding the Output](#understanding-the-output)
- [Command Line Options](#command-line-options)
- [Usage Scenarios](#usage-scenarios)
- [Configuration](#configuration)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## Installation

### Global Installation (Recommended)

```bash
npm install -g dependency-health-checker
```

After installation, the `depcheck` command will be available globally:

```bash
depcheck --version
```

### Local Project Installation

```bash
npm install --save-dev dependency-health-checker
```

Add to your `package.json` scripts:

```json
{
  "scripts": {
    "check-deps": "depcheck",
    "check-deps:json": "depcheck --json",
    "check-deps:fix": "depcheck --fix"
  }
}
```

### Using npx (No Installation)

```bash
npx dependency-health-checker
```

## Quick Start

### Basic Scan

Navigate to your project directory and run:

```bash
depcheck
```

This will:
1. Detect your project type (npm, Python, etc.)
2. Scan all dependencies
3. Check for outdated packages
4. Identify security vulnerabilities
5. Display a comprehensive report

### Example Output

```
Dependency Health Check Report
==============================
Project: my-awesome-app
Type: npm (package.json)
Scanned: 2024-01-15 10:30:45

📦 Total Dependencies: 45
   Production: 28
   Development: 17

⚠️  Outdated Packages: 12
   Major updates: 3
   Minor updates: 5
   Patch updates: 4

🔒 Security Issues: 2
   High: 1
   Moderate: 1
   Low: 0

Detailed Results:
-----------------

OUTDATED PACKAGES:

  express
    Current: 4.17.1
    Latest: 4.18.2
    Type: Minor update
    ✓ Safe to update

  lodash
    Current: 4.17.15
    Latest: 4.17.21
    Type: Patch update (Security fix)
    ⚠️  Contains known vulnerabilities
    ✓ Safe to update

  react
    Current: 16.14.0
    Latest: 18.2.0
    Type: Major update
    ⚠️  May contain breaking changes
    📖 View migration guide: https://react.dev/blog/2022/03/08/react-18-upgrade-guide

VULNERABILITIES:

  High Severity:
    Package: minimist@1.2.5
    Vulnerability: Prototype Pollution
    CVE: CVE-2021-44906
    Fixed in: >=1.2.6
    Action: Run 'depcheck --fix' to update

  Moderate Severity:
    Package: axios@0.21.1
    Vulnerability: Server-Side Request Forgery
    CVE: CVE-2021-3749
    Fixed in: >=0.21.2
    Action: Update to 0.21.4 or higher

RECOMMENDATIONS:
• Run 'depcheck --fix' to safely update 10 packages
• Manually review major updates before upgrading
• Consider updating security vulnerabilities immediately
```

## Understanding the Output

### Severity Levels

#### Package Updates
- **Patch**: Bug fixes only (1.0.0 → 1.0.1) - Usually safe
- **Minor**: New features, backward compatible (1.0.0 → 1.1.0) - Generally safe
- **Major**: Breaking changes (1.0.0 → 2.0.0) - Review carefully

#### Security Vulnerabilities
- **Critical**: Exploit available, high impact - Update immediately
- **High**: Serious vulnerability - Update as soon as possible
- **Moderate**: Limited impact - Plan to update
- **Low**: Minimal risk - Update when convenient

### Status Indicators

- ✅ **Green**: No issues found
- ⚠️ **Yellow**: Updates available or minor issues
- 🔴 **Red**: Security vulnerabilities or critical issues
- 📦 **Package**: Dependency information
- 🔒 **Lock**: Security-related information
- 📖 **Book**: Documentation available

## Command Line Options

### Display Options

```bash
# Default human-readable output
depcheck

# JSON output for automation
depcheck --json

# Minimal output (errors only)
depcheck --quiet

# Detailed verbose output
depcheck --verbose

# Save output to file
depcheck --output report.json
```

### Filtering Options

```bash
# Ignore specific packages
depcheck --ignore lodash,express

# Check only production dependencies
depcheck --production

# Check only development dependencies
depcheck --dev

# Limit dependency tree depth
depcheck --depth 2

# Check specific package manager
depcheck --manager npm  # or python, ruby, etc.
```

### Action Options

```bash
# Automatically fix safe updates
depcheck --fix

# Interactive mode (choose updates)
depcheck --interactive

# Dry run (show what would be updated)
depcheck --dry-run
```

### CI/CD Options

```bash
# Exit with code 1 if issues found
depcheck --fail-on-high

# Exit with code 1 on any outdated package
depcheck --fail-on-outdated

# Set custom threshold
depcheck --threshold moderate
```

## Usage Scenarios

### Daily Development

Check dependencies before starting work:

```bash
# Morning routine
git pull
npm install
depcheck
```

### Before Commits

Add to pre-commit hook:

```bash
# .husky/pre-commit
#!/bin/sh
depcheck --fail-on-high
```

### Weekly Maintenance

```bash
# Comprehensive check
depcheck --verbose

# Review and apply safe updates
depcheck --fix

# Check for major updates
depcheck --json | jq '.outdated[] | select(.updateType == "major")'
```

### Project Audit

```bash
# Full audit with report
depcheck --verbose --output audit-$(date +%Y%m%d).json

# Check against security policy
depcheck --policy .security-policy.json
```

### Automated Updates

```bash
# Update all patch versions
depcheck --fix --patch-only

# Update all minor versions
depcheck --fix --minor

# Update specific packages
depcheck --fix --only express,lodash
```

## Configuration

### Configuration File

Create `.depcheckrc.json` in your project root:

```json
{
  "ignore": ["package1", "package2"],
  "checkDevDependencies": true,
  "outputFormat": "json",
  "failOnSeverity": "high",
  "autoFix": {
    "enabled": false,
    "allowMajor": false,
    "allowMinor": true,
    "allowPatch": true
  },
  "registries": {
    "npm": "https://registry.npmjs.org",
    "python": "https://pypi.org/simple"
  },
  "proxy": "http://corporate-proxy:8080"
}
```

### Environment Variables

```bash
# Set custom registry
export DEPCHECK_NPM_REGISTRY=https://custom-registry.com

# Set proxy
export DEPCHECK_PROXY=http://proxy:8080

# Set output format
export DEPCHECK_OUTPUT=json

# Disable colors
export DEPCHECK_NO_COLOR=1
```

### Package.json Configuration

```json
{
  "depcheck": {
    "ignore": ["test-package"],
    "failOnSeverity": "moderate",
    "autoFix": true
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Dependency Check
on: [push, pull_request]

jobs:
  check-dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npx dependency-health-checker --fail-on-high
      - uses: actions/upload-artifact@v2
        if: failure()
        with:
          name: dependency-report
          path: dependency-report.json
```

### GitLab CI

```yaml
dependency-check:
  stage: test
  script:
    - npm ci
    - npx dependency-health-checker --fail-on-high --output report.json
  artifacts:
    when: always
    reports:
      dependency_scanning: report.json
```

### Jenkins

```groovy
pipeline {
  stages {
    stage('Dependency Check') {
      steps {
        sh 'npm ci'
        sh 'npx dependency-health-checker --fail-on-high'
      }
      post {
        always {
          archiveArtifacts artifacts: 'dependency-report.json', allowEmptyArchive: true
        }
      }
    }
  }
}
```

### CircleCI

```yaml
version: 2.1
jobs:
  dependency-check:
    docker:
      - image: cimg/node:16.0
    steps:
      - checkout
      - run: npm ci
      - run: npx dependency-health-checker --fail-on-high
      - store_artifacts:
          path: dependency-report.json
```

## Troubleshooting

### Common Issues

#### "Command not found" after installation

```bash
# Check if globally installed
npm list -g dependency-health-checker

# Reinstall globally
npm uninstall -g dependency-health-checker
npm install -g dependency-health-checker

# Or use npx
npx dependency-health-checker
```

#### "Cannot detect project type"

```bash
# Explicitly specify the manager
depcheck --manager npm

# Check for package.json
ls -la package.json
```

#### "Network timeout" errors

```bash
# Increase timeout
depcheck --timeout 60000

# Use proxy if behind firewall
depcheck --proxy http://proxy:8080

# Use offline mode (cached data only)
depcheck --offline
```

#### "Permission denied" errors

```bash
# Fix npm permissions
sudo npm install -g dependency-health-checker

# Or use npx (no permissions needed)
npx dependency-health-checker
```

### Debug Mode

```bash
# Enable debug output
DEBUG=depcheck:* depcheck

# Verbose logging
depcheck --verbose --log-level debug

# Save debug log
depcheck --verbose 2> debug.log
```

## FAQ

### Q: How often should I run dependency checks?

**A:** We recommend:
- Daily: Quick scan (`depcheck`)
- Weekly: Full scan with fixes (`depcheck --fix`)
- Before releases: Comprehensive audit (`depcheck --verbose`)
- In CI/CD: Every commit (`depcheck --fail-on-high`)

### Q: Is it safe to use --fix automatically?

**A:** The `--fix` flag only applies:
- Patch updates (bug fixes)
- Minor updates marked as safe
- Security fixes without breaking changes

Major updates always require manual review.

### Q: Can I use this with private registries?

**A:** Yes! Configure your registry:

```bash
# Via environment variable
export DEPCHECK_NPM_REGISTRY=https://private-registry.com

# Via config file
echo '{"registries":{"npm":"https://private-registry.com"}}' > .depcheckrc.json
```

### Q: How does it detect vulnerabilities?

**A:** The tool checks multiple sources:
- npm audit database
- GitHub Advisory Database
- CVE database
- Package manager security advisories

### Q: Can I exclude certain vulnerabilities?

**A:** Yes, create a `.depcheckignore` file:

```
# Ignore specific CVE
CVE-2021-12345

# Ignore package vulnerability
lodash:CVE-2021-*

# Ignore by severity
*.low
*.info
```

### Q: Does it support monorepos?

**A:** Yes! Run from the root to check all packages:

```bash
# Check all packages
depcheck --workspaces

# Check specific package
depcheck --workspace packages/app
```

### Q: Can I integrate with Slack/Teams?

**A:** Yes, using webhooks:

```bash
# Send results to Slack
depcheck --json | curl -X POST -H 'Content-type: application/json' \
  --data @- https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Q: Is there a GUI version?

**A:** Currently CLI-only, but you can:
- Use VS Code extension (coming soon)
- View JSON output in web tools
- Generate HTML reports

## Getting Help

- **Documentation**: [GitHub Wiki](https://github.com/Prawal-Sharma/DependencyHealthChecker/wiki)
- **Issues**: [GitHub Issues](https://github.com/Prawal-Sharma/DependencyHealthChecker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Prawal-Sharma/DependencyHealthChecker/discussions)
- **Updates**: Follow releases on [GitHub](https://github.com/Prawal-Sharma/DependencyHealthChecker/releases)

## Next Steps

1. [Set up CI/CD integration](DEPLOYMENT.md)
2. [Contribute to the project](../CONTRIBUTING.md)
3. [Read the API documentation](API.md)
4. [View example configurations](../examples/)