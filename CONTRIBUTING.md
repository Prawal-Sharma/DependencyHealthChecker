# Contributing to Dependency Health Checker

Thank you for your interest in contributing to Dependency Health Checker! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful and professional in all interactions.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment
4. Create a branch for your changes
5. Make your changes
6. Test thoroughly
7. Submit a pull request

## Development Setup

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- Git

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/DependencyHealthChecker.git
cd DependencyHealthChecker

# Add upstream remote
git remote add upstream https://github.com/Prawal-Sharma/DependencyHealthChecker.git

# Install dependencies
npm install

# Run tests to verify setup
npm test
```

### Development Commands

```bash
# Run the CLI locally
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Build for production
npm run build
```

## Project Structure

```
DependencyHealthChecker/
├── src/
│   ├── cli.js              # Main CLI entry point
│   ├── scanners/           # Package ecosystem scanners
│   │   ├── npm.js          # NPM scanner
│   │   └── python.js       # Python scanner
│   ├── analyzers/          # Analysis modules
│   │   ├── outdated.js     # Version checking
│   │   └── vulnerability.js # Security checking
│   ├── formatters/         # Output formatters
│   │   ├── text.js         # Human-readable format
│   │   ├── json.js         # JSON format
│   │   └── ci.js           # CI-friendly format
│   └── utils/              # Utility functions
├── test/                   # Test files
├── docs/                   # Documentation
└── examples/               # Example projects for testing
```

## Making Changes

### Adding a New Scanner

To add support for a new package ecosystem:

1. Create a new file in `src/scanners/` (e.g., `ruby.js`)
2. Implement the scanner interface:

```javascript
class RubyScanner {
  constructor(options) {
    this.options = options;
  }

  async canScan(directory) {
    // Check if Gemfile exists
  }

  async scan(directory) {
    // Parse Gemfile and return dependencies
  }

  async getLatestVersions(dependencies) {
    // Query registry for latest versions
  }
}

module.exports = RubyScanner;
```

3. Register the scanner in `src/scanners/index.js`
4. Add tests in `test/scanners/ruby.test.js`
5. Update documentation

### Adding a New Feature

1. Discuss the feature in an issue first
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Implement the feature with tests
4. Update relevant documentation
5. Submit a pull request

## Testing

### Writing Tests

- Place unit tests next to the code they test
- Use descriptive test names
- Test edge cases and error conditions
- Aim for >80% code coverage

### Test Structure

```javascript
describe('ModuleName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = {...};
      
      // Act
      const result = methodName(input);
      
      // Assert
      expect(result).toBe(expected);
    });

    it('should handle error cases', () => {
      // Test error handling
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- npm.test.js

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Submitting Changes

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Code follows style guidelines (`npm run lint`)
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### Creating a Pull Request

1. Push your branch to your fork
2. Open a pull request against the main branch
3. Fill out the PR template completely
4. Link related issues
5. Wait for review

## Coding Standards

### JavaScript Style

- Use ES6+ features
- Prefer async/await over callbacks
- Use meaningful variable names
- Add JSDoc comments for public methods
- Keep functions small and focused

### File Organization

- One class/module per file
- Group related functionality
- Export at the bottom of the file
- Use index.js for directory exports

### Error Handling

```javascript
// Good
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new CustomError('User-friendly message', { cause: error });
}

// Bad
try {
  return await riskyOperation();
} catch (e) {
  console.log(e);
  throw e;
}
```

## Commit Messages

Follow the Conventional Commits specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

### Examples

```
feat(scanner): add support for Ruby Gemfile parsing

- Implement Gemfile parser
- Add RubyGems API integration
- Support version constraints

Closes #123
```

```
fix(npm): handle scoped packages correctly

Scoped packages were not being parsed correctly
when checking for updates.
```

## Pull Request Process

### PR Requirements

1. **Title**: Clear and descriptive
2. **Description**: Explain what and why
3. **Tests**: All new code must have tests
4. **Documentation**: Update if needed
5. **Screenshots**: For UI changes
6. **Breaking Changes**: Clearly marked

### Review Process

1. Automated checks run (tests, linting)
2. Code review by maintainers
3. Address feedback
4. Approval from at least one maintainer
5. Merge to main branch

### After Merge

- Delete your feature branch
- Pull the latest main branch
- Update your fork

## Getting Help

- **Questions**: Open a [Discussion](https://github.com/Prawal-Sharma/DependencyHealthChecker/discussions)
- **Bugs**: Open an [Issue](https://github.com/Prawal-Sharma/DependencyHealthChecker/issues)
- **Security**: Email security concerns privately

## Recognition

Contributors are recognized in:
- The project README
- Release notes
- GitHub contributors page

Thank you for contributing to make dependency management better for everyone!