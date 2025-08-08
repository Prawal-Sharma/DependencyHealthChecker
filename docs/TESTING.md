# Testing Guide

This guide covers everything you need to know about testing the Dependency Health Checker, both as a developer contributing to the project and as a user validating the tool works correctly in your environment.

## Table of Contents

- [For Developers](#for-developers)
  - [Test Architecture](#test-architecture)
  - [Running Tests](#running-tests)
  - [Writing Tests](#writing-tests)
  - [Test Coverage](#test-coverage)
  - [Continuous Integration](#continuous-integration)
- [For Users](#for-users)
  - [Testing Installation](#testing-installation)
  - [Validation Tests](#validation-tests)
  - [Integration Testing](#integration-testing)
- [Test Fixtures](#test-fixtures)
- [Troubleshooting](#troubleshooting)

## For Developers

### Test Architecture

The project uses Jest as the testing framework with the following structure:

```
test/
├── unit/               # Unit tests for individual modules
│   ├── scanners/       # Scanner tests
│   ├── analyzers/      # Analyzer tests
│   ├── formatters/     # Formatter tests
│   └── utils/          # Utility tests
├── integration/        # Integration tests
├── e2e/               # End-to-end tests
├── fixtures/          # Test data and mock projects
└── helpers/           # Test utilities and mocks
```

### Running Tests

#### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only e2e tests
npm run test:e2e
```

#### Running Specific Tests

```bash
# Run tests matching a pattern
npm test -- --testNamePattern="npm scanner"

# Run tests in a specific file
npm test -- src/scanners/npm.test.js

# Run tests with verbose output
npm test -- --verbose

# Debug tests
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

### Writing Tests

#### Unit Test Example

```javascript
// test/unit/scanners/npm.test.js
const NpmScanner = require('../../../src/scanners/npm');
const fs = require('fs').promises;

jest.mock('fs').promises;

describe('NpmScanner', () => {
  let scanner;

  beforeEach(() => {
    scanner = new NpmScanner();
    jest.clearAllMocks();
  });

  describe('canScan', () => {
    it('should return true when package.json exists', async () => {
      fs.access.mockResolvedValue();
      
      const result = await scanner.canScan('/path/to/project');
      
      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith('/path/to/project/package.json');
    });

    it('should return false when package.json does not exist', async () => {
      fs.access.mockRejectedValue(new Error('File not found'));
      
      const result = await scanner.canScan('/path/to/project');
      
      expect(result).toBe(false);
    });
  });

  describe('scan', () => {
    it('should parse dependencies correctly', async () => {
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1',
          'lodash': '~4.17.0'
        },
        devDependencies: {
          'jest': '^27.0.0'
        }
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await scanner.scan('/path/to/project');

      expect(result).toEqual({
        dependencies: [
          { name: 'express', version: '^4.17.1', type: 'production' },
          { name: 'lodash', version: '~4.17.0', type: 'production' },
          { name: 'jest', version: '^27.0.0', type: 'development' }
        ]
      });
    });
  });
});
```

#### Integration Test Example

```javascript
// test/integration/cli.test.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

describe('CLI Integration', () => {
  const cliPath = path.join(__dirname, '../../bin/depcheck');
  const fixturesPath = path.join(__dirname, '../fixtures');

  it('should scan npm project and output results', async () => {
    const projectPath = path.join(fixturesPath, 'npm-project');
    
    const output = execSync(`node ${cliPath}`, {
      cwd: projectPath,
      encoding: 'utf8'
    });

    expect(output).toContain('Dependency Health Check Report');
    expect(output).toContain('Scanned:');
    expect(output).toContain('Outdated:');
  });

  it('should output JSON when --json flag is used', async () => {
    const projectPath = path.join(fixturesPath, 'npm-project');
    
    const output = execSync(`node ${cliPath} --json`, {
      cwd: projectPath,
      encoding: 'utf8'
    });

    const json = JSON.parse(output);
    expect(json).toHaveProperty('dependencies');
    expect(json).toHaveProperty('vulnerabilities');
    expect(json).toHaveProperty('outdated');
  });

  it('should exit with code 1 when high vulnerabilities found with --fail-on-high', async () => {
    const projectPath = path.join(fixturesPath, 'vulnerable-project');
    
    expect(() => {
      execSync(`node ${cliPath} --fail-on-high`, {
        cwd: projectPath,
        encoding: 'utf8'
      });
    }).toThrow();
  });
});
```

#### E2E Test Example

```javascript
// test/e2e/full-scan.test.js
describe('End-to-End Scanning', () => {
  it('should perform complete scan workflow', async () => {
    // 1. Create temporary project
    const tempDir = await createTempProject({
      'package.json': JSON.stringify({
        name: 'test-project',
        dependencies: {
          'express': '4.17.1',
          'lodash': '4.17.19'
        }
      })
    });

    // 2. Run scan
    const result = await runDepCheck(tempDir);

    // 3. Verify results
    expect(result.outdated).toContainEqual(
      expect.objectContaining({
        name: 'lodash',
        current: '4.17.19',
        latest: expect.stringMatching(/4\.17\.\d+/)
      })
    );

    // 4. Run with --fix
    await runDepCheck(tempDir, ['--fix']);

    // 5. Verify package.json was updated
    const updatedPackageJson = JSON.parse(
      await fs.readFile(path.join(tempDir, 'package.json'), 'utf8')
    );
    expect(updatedPackageJson.dependencies.lodash).not.toBe('4.17.19');

    // Cleanup
    await fs.rmdir(tempDir, { recursive: true });
  });
});
```

### Test Coverage

#### Coverage Requirements

- Minimum overall coverage: 80%
- Minimum branch coverage: 75%
- Minimum function coverage: 80%
- Critical paths must have 100% coverage

#### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/lcov-report/index.html

# Check coverage thresholds
npm run test:coverage -- --coverageThreshold='{"global":{"branches":75,"functions":80,"lines":80,"statements":80}}'
```

#### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html']
};
```

### Continuous Integration

Tests run automatically on:
- Every pull request
- Every push to main branch
- Nightly scheduled runs

#### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v2
```

## For Users

### Testing Installation

#### Global Installation Test

```bash
# Install globally
npm install -g dependency-health-checker

# Verify installation
depcheck --version

# Test in a sample project
mkdir test-project
cd test-project
npm init -y
npm install express lodash
depcheck
```

#### Local Installation Test

```bash
# In your project directory
npm install --save-dev dependency-health-checker

# Add to package.json scripts
{
  "scripts": {
    "check-deps": "depcheck"
  }
}

# Run via npm
npm run check-deps
```

### Validation Tests

#### Basic Functionality Test

```bash
# Create a test project
mkdir dep-check-test
cd dep-check-test

# Create package.json with known outdated dependency
cat > package.json << EOF
{
  "name": "test",
  "dependencies": {
    "lodash": "4.17.15"
  }
}
EOF

# Install dependencies
npm install

# Run checker - should detect outdated lodash
depcheck

# Expected output should show:
# - lodash is outdated
# - Current version: 4.17.15
# - Latest version: 4.17.21 (or higher)
```

#### Vulnerability Detection Test

```bash
# Create project with known vulnerability
cat > package.json << EOF
{
  "name": "vuln-test",
  "dependencies": {
    "minimist": "1.2.5"
  }
}
EOF

npm install
depcheck

# Should detect and report vulnerability in minimist
```

### Integration Testing

#### CI/CD Integration Test

```bash
# In your project with CI/CD
# Add to your CI configuration:

# GitHub Actions
- name: Check Dependencies
  run: |
    npx dependency-health-checker --fail-on-high

# GitLab CI
dependency-check:
  script:
    - npx dependency-health-checker --fail-on-high

# Jenkins
sh 'npx dependency-health-checker --fail-on-high'
```

#### Pre-commit Hook Test

```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npx dependency-health-checker --fail-on-high"

# Test by committing
git add .
git commit -m "test commit"
# Should run dependency check before commit
```

## Test Fixtures

### Creating Test Fixtures

```bash
# Create a new test fixture
mkdir test/fixtures/my-test-case
cd test/fixtures/my-test-case

# Add package.json with specific versions
cat > package.json << EOF
{
  "name": "my-test-case",
  "dependencies": {
    "express": "4.17.1",
    "lodash": "4.17.15",
    "minimist": "1.2.5"
  }
}
EOF

# Lock dependencies
npm install
```

### Using Test Fixtures

```javascript
const fixture = require('./fixtures/my-test-case/package.json');
const scanner = new NpmScanner();
const result = await scanner.scan('./test/fixtures/my-test-case');
```

## Troubleshooting

### Common Test Issues

#### Tests Failing Locally but Passing in CI

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests with clean environment
npm test -- --clearCache
```

#### Timeout Issues

```javascript
// Increase timeout for slow tests
jest.setTimeout(10000); // 10 seconds

// Or per test
it('should handle large projects', async () => {
  // test code
}, 15000);
```

#### Mock Issues

```javascript
// Always clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Reset modules if needed
beforeEach(() => {
  jest.resetModules();
});
```

### Debugging Tests

```bash
# Run tests with Node debugger
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Use VS Code debugger
# Add to launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

### Performance Testing

```bash
# Measure test performance
npm test -- --logHeapUsage

# Profile slow tests
npm test -- --detectOpenHandles

# Find slow tests
npm test -- --verbose --expand
```

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Use Descriptive Names**: Test names should clearly state what they test
3. **Test One Thing**: Each test should verify a single behavior
4. **Mock External Dependencies**: Don't make real network calls in tests
5. **Clean Up**: Always clean up temporary files and resources
6. **Test Edge Cases**: Include tests for error conditions and edge cases
7. **Keep Tests Fast**: Unit tests should run in milliseconds
8. **Document Complex Tests**: Add comments explaining complex test scenarios

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Project Issues](https://github.com/Prawal-Sharma/DependencyHealthChecker/issues)