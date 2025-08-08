# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-08

### Added
- Initial release of Dependency Health Checker
- Support for NPM (package.json) dependency scanning
- Support for Python (requirements.txt) dependency scanning
- Outdated package detection with semver comparison
- Security vulnerability checking via npm audit
- Multiple output formats: text, JSON, and CI-friendly
- Command-line interface with comprehensive options
- `--fix` flag for automatic safe updates
- `--ignore` flag to exclude specific packages
- `--fail-on-high` flag for CI/CD integration
- Comprehensive documentation and testing
- MIT License

### Features
- Local-first approach - no cloud dependencies
- Zero configuration required
- Cross-platform support (Windows, macOS, Linux)
- Colored terminal output for better readability
- Progress indicators during scanning
- Detailed vulnerability information with CVE links
- Smart update suggestions based on semantic versioning
- Support for production-only or dev-only dependency checks

### Documentation
- Comprehensive README with examples
- Detailed User Guide
- API documentation for programmatic usage
- Testing guide for contributors
- Deployment guide for CI/CD integration
- Contributing guidelines

### Security
- No data sent to external services
- All checks performed locally
- Support for private registries
- Proxy configuration support

## [Unreleased]

### Planned Features
- Support for Ruby (Gemfile)
- Support for Java (pom.xml)
- Support for Go (go.mod)
- License checking for dependencies
- Performance impact analysis
- Custom security policies
- Web dashboard (optional, local)
- IDE integrations (VS Code, IntelliJ)
- Dependency graph visualization
- Historical tracking of dependency health
- Integration with more vulnerability databases
- Automated pull request creation for updates
- Docker image vulnerability scanning
- Support for monorepos
- Configurable update strategies
- Dependency size analysis
- Breaking change detection
- Migration guides for major updates

### Planned Improvements
- Performance optimizations for large projects
- Better caching mechanisms
- Parallel scanning for multiple projects
- Enhanced error messages and debugging
- Internationalization (i18n) support
- Plugin system for extensibility
- GraphQL API support
- Real-time monitoring mode
- Dependency update scheduling
- Integration with package managers (Yarn, pnpm)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.