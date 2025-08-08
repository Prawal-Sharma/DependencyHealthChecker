# Dependency Health Checker

[![npm version](https://badge.fury.io/js/@prawals%2Fdependency-health-checker.svg)](https://www.npmjs.com/package/@prawals/dependency-health-checker)
[![npm downloads](https://img.shields.io/npm/dm/@prawals/dependency-health-checker.svg)](https://www.npmjs.com/package/@prawals/dependency-health-checker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org)

A lightweight, local-first CLI tool for monitoring the health of your project dependencies. Detect outdated packages, identify vulnerabilities, and get actionable upgrade suggestions without relying on cloud services or CI pipelines.

## Features

- **Multi-Ecosystem Support**: Works with npm (package.json) and Python (requirements.txt)
- **Vulnerability Detection**: Identifies known CVEs and security issues in dependencies
- **Smart Upgrade Paths**: Suggests safe version upgrades based on semantic versioning
- **Multiple Output Formats**: Human-readable text, JSON, and CI-friendly outputs
- **Zero Configuration**: Works out of the box with sensible defaults
- **Privacy-First**: All checks run locally, no data sent to external services
- **CI/CD Ready**: Integrate seamlessly into your build pipeline

## Quick Start

### Installation

```bash
npm install -g @prawals/dependency-health-checker
```

Or run directly with npx:

```bash
npx @prawals/dependency-health-checker
```

### Basic Usage

```bash
# Scan current directory
depcheck

# Output as JSON
depcheck --json

# Auto-fix safe updates
depcheck --fix

# Fail CI on high vulnerabilities
depcheck --fail-on-high
```

## Example Output

```
Dependency Health Check Report
==============================

📦 Scanned: 42 dependencies
⚠️  Outdated: 8 packages
🔒 Vulnerabilities: 2 high, 3 moderate

Outdated Packages:
  express: 4.17.1 → 4.18.2 (minor update available)
  lodash: 4.17.19 → 4.17.21 (patch update - security fix)
  
High Vulnerabilities:
  minimist@1.2.5: Prototype Pollution (CVE-2021-44906)
    → Upgrade to 1.2.6 or higher
  
Run 'depcheck --fix' to safely update compatible versions
```

## Command Line Options

| Option | Description |
|--------|-------------|
| `--json` | Output results as JSON |
| `--fix` | Automatically update safe dependencies |
| `--fail-on-high` | Exit with code 1 if high vulnerabilities found |
| `--ignore <packages>` | Comma-separated list of packages to ignore |
| `--depth <level>` | Check dependency tree depth (default: all) |
| `--output <file>` | Save report to file |
| `--quiet` | Suppress non-critical output |
| `--verbose` | Show detailed information |

## Documentation

- [User Guide](docs/USER_GUIDE.md) - Detailed usage instructions and examples
- [Testing Guide](docs/TESTING.md) - How to test the tool and contribute tests
- [API Documentation](docs/API.md) - Programmatic usage and extension
- [Deployment Guide](docs/DEPLOYMENT.md) - CI/CD integration and deployment
- [Contributing](CONTRIBUTING.md) - How to contribute to the project

## Requirements

- Node.js >= 14.0.0
- npm or yarn
- Internet connection (for checking latest versions and vulnerabilities)

## How It Works

1. **Scanning**: Detects and parses dependency files in your project
2. **Analysis**: Compares installed versions with latest available versions
3. **Security Check**: Cross-references dependencies with vulnerability databases
4. **Reporting**: Generates actionable reports with upgrade recommendations

## Supported Ecosystems

- ✅ **Node.js** - package.json, package-lock.json
- ✅ **Python** - requirements.txt, Pipfile
- 🚧 **Ruby** - Gemfile (coming soon)
- 🚧 **Java** - pom.xml (coming soon)
- 🚧 **Go** - go.mod (coming soon)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Setting up the development environment
- Running tests
- Submitting pull requests
- Reporting issues

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Comparison with Other Tools

| Feature | Dependency Health Checker | Dependabot | Snyk | npm audit |
|---------|--------------------------|------------|------|-----------|
| Local-first | ✅ | ❌ | ❌ | ✅ |
| No account required | ✅ | ❌ | ❌ | ✅ |
| Multi-ecosystem | ✅ | ✅ | ✅ | ❌ |
| Automatic fixes | ✅ | ✅ | ✅ | ✅ |
| CI/CD integration | ✅ | ✅ | ✅ | ✅ |
| Open source | ✅ | ❌ | ❌ | ✅ |

## Roadmap

- [ ] Support for more package managers (Ruby, Java, Go)
- [ ] Dependency license checking
- [ ] Performance impact analysis
- [ ] Custom security policies
- [ ] IDE integrations
- [ ] Web dashboard (optional, local)

## Support

- **Issues**: [GitHub Issues](https://github.com/Prawal-Sharma/DependencyHealthChecker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Prawal-Sharma/DependencyHealthChecker/discussions)
- **Security**: Report security vulnerabilities via [GitHub Security](https://github.com/Prawal-Sharma/DependencyHealthChecker/security)

---

Built with ❤️ for developers who care about dependency health and security.