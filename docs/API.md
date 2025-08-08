# API Documentation

The Dependency Health Checker can be used programmatically as a Node.js module, allowing integration into custom workflows and applications.

## Installation

```javascript
npm install dependency-health-checker
```

## Basic Usage

```javascript
const DependencyChecker = require('dependency-health-checker');

async function checkDependencies() {
  const checker = new DependencyChecker({
    quiet: true,
    json: true
  });

  await checker.detectProjectType();
  const dependencies = await checker.scanDependencies();
  const outdated = await checker.checkOutdated(dependencies);
  const vulnerabilities = await checker.checkVulnerabilities(dependencies);

  return {
    dependencies,
    outdated,
    vulnerabilities
  };
}
```

## Core Classes

### DependencyChecker

The main class that orchestrates dependency scanning and analysis.

#### Constructor

```javascript
new DependencyChecker(options)
```

**Options:**
- `quiet` (boolean): Suppress console output
- `json` (boolean): Format output as JSON
- `ignore` (string): Comma-separated list of packages to ignore
- `production` (boolean): Check only production dependencies
- `dev` (boolean): Check only development dependencies
- `depth` (number): Dependency tree depth to check
- `threshold` (string): Vulnerability severity threshold

#### Methods

##### detectProjectType()

Detects the project type by looking for package manifest files.

```javascript
await checker.detectProjectType();
// Sets checker.projectInfo with project details
```

##### scanDependencies()

Scans and returns all project dependencies.

```javascript
const dependencies = await checker.scanDependencies();
// Returns: Array<Dependency>
```

##### checkOutdated(dependencies)

Checks for outdated packages.

```javascript
const outdated = await checker.checkOutdated(dependencies);
// Returns: Array<OutdatedPackage>
```

##### checkVulnerabilities(dependencies)

Checks for security vulnerabilities.

```javascript
const vulnerabilities = await checker.checkVulnerabilities(dependencies);
// Returns: Array<Vulnerability>
```

##### applyFixes(outdated)

Applies safe updates to package manifest files.

```javascript
await checker.applyFixes(outdated);
// Updates package.json or requirements.txt
```

## Scanners

### NpmScanner

Scanner for Node.js projects using package.json.

```javascript
const NpmScanner = require('dependency-health-checker/src/scanners/npm');

const scanner = new NpmScanner(options);
```

#### Methods

##### getProjectInfo(projectPath)

```javascript
const info = await scanner.getProjectInfo('/path/to/project');
// Returns: { name, version, description }
```

##### scan(projectPath)

```javascript
const deps = await scanner.scan('/path/to/project');
// Returns: Array<{ name, version, type, installed }>
```

##### getLatestVersion(packageName)

```javascript
const version = await scanner.getLatestVersion('express');
// Returns: '4.18.2'
```

##### getVulnerabilities(dependencies)

```javascript
const vulns = await scanner.getVulnerabilities(dependencies);
// Returns: Array<Vulnerability>
```

### PythonScanner

Scanner for Python projects using requirements.txt.

```javascript
const PythonScanner = require('dependency-health-checker/src/scanners/python');

const scanner = new PythonScanner(options);
```

Similar API to NpmScanner.

## Analyzers

### Outdated Analyzer

```javascript
const { check } = require('dependency-health-checker/src/analyzers/outdated');

const outdated = await check(dependencies, scanner, options);
```

### Vulnerability Analyzer

```javascript
const { check } = require('dependency-health-checker/src/analyzers/vulnerability');

const vulnerabilities = await check(dependencies, scanner, options);
```

## Formatters

### Text Formatter

```javascript
const { format } = require('dependency-health-checker/src/formatters/text');

format(report, options);
// Outputs human-readable text to console
```

### JSON Formatter

```javascript
const { format } = require('dependency-health-checker/src/formatters/json');

const jsonOutput = format(report, options);
// Returns: JSON object
```

### CI Formatter

```javascript
const { format } = require('dependency-health-checker/src/formatters/ci');

const exitCode = format(report, options);
// Returns: 0 or 1, outputs CI-friendly messages
```

## Data Types

### Dependency

```typescript
interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development';
  installed?: string;
}
```

### OutdatedPackage

```typescript
interface OutdatedPackage {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  type: 'production' | 'development';
  updateType: 'major' | 'minor' | 'patch' | 'unknown';
  safe: boolean;
  breaking: boolean;
}
```

### Vulnerability

```typescript
interface Vulnerability {
  package: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  title?: string;
  cve?: string;
  url?: string;
  range?: string;
  fixAvailable?: boolean;
}
```

### Report

```typescript
interface Report {
  project: ProjectInfo;
  dependencies: Dependency[];
  outdated: OutdatedPackage[];
  vulnerabilities: Vulnerability[];
  timestamp: string;
}
```

## Advanced Usage

### Custom Scanner

Create a custom scanner for a new package manager:

```javascript
class CustomScanner {
  constructor(options) {
    this.options = options;
  }

  async getProjectInfo(projectPath) {
    // Return project information
  }

  async scan(projectPath) {
    // Return array of dependencies
  }

  async getLatestVersion(packageName) {
    // Return latest version from registry
  }

  async getVulnerabilities(dependencies) {
    // Return array of vulnerabilities
  }

  async applyUpdates(updates, projectPath) {
    // Apply updates to manifest file
  }
}
```

### Custom Formatter

Create a custom output formatter:

```javascript
function customFormat(report, options) {
  // Process report data
  // Output in desired format
  
  return formattedOutput;
}

module.exports = { format: customFormat };
```

### Programmatic CLI Usage

```javascript
const { execSync } = require('child_process');

// Run CLI programmatically
const result = execSync('npx dependency-health-checker --json', {
  encoding: 'utf8'
});

const report = JSON.parse(result);
```

### Integration Examples

#### Express Middleware

```javascript
const express = require('express');
const DependencyChecker = require('dependency-health-checker');

const app = express();

app.get('/health/dependencies', async (req, res) => {
  const checker = new DependencyChecker({ quiet: true });
  
  try {
    await checker.detectProjectType();
    const dependencies = await checker.scanDependencies();
    const outdated = await checker.checkOutdated(dependencies);
    const vulnerabilities = await checker.checkVulnerabilities(dependencies);
    
    res.json({
      status: vulnerabilities.length === 0 ? 'healthy' : 'unhealthy',
      outdated: outdated.length,
      vulnerabilities: vulnerabilities.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### GitHub Action

```javascript
const core = require('@actions/core');
const DependencyChecker = require('dependency-health-checker');

async function run() {
  try {
    const checker = new DependencyChecker({
      threshold: core.getInput('threshold')
    });
    
    await checker.detectProjectType();
    const dependencies = await checker.scanDependencies();
    const vulnerabilities = await checker.checkVulnerabilities(dependencies);
    
    if (vulnerabilities.length > 0) {
      core.setFailed(`Found ${vulnerabilities.length} vulnerabilities`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```

#### Scheduled Task

```javascript
const cron = require('node-cron');
const DependencyChecker = require('dependency-health-checker');
const nodemailer = require('nodemailer');

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  const checker = new DependencyChecker({ quiet: true });
  
  await checker.detectProjectType();
  const dependencies = await checker.scanDependencies();
  const outdated = await checker.checkOutdated(dependencies);
  const vulnerabilities = await checker.checkVulnerabilities(dependencies);
  
  if (vulnerabilities.length > 0) {
    // Send email alert
    await sendAlert({
      subject: 'Security Vulnerabilities Detected',
      body: `Found ${vulnerabilities.length} vulnerabilities in dependencies`
    });
  }
});
```

## Error Handling

All methods may throw errors that should be handled:

```javascript
try {
  const checker = new DependencyChecker();
  await checker.detectProjectType();
} catch (error) {
  if (error.message.includes('Could not detect project type')) {
    console.error('No package.json or requirements.txt found');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Performance Considerations

- Use `ignore` option to skip checking large or irrelevant packages
- Set appropriate `timeout` values for network requests
- Consider caching results for frequent checks
- Use `depth` option to limit dependency tree traversal

## Contributing

To add support for a new package manager:

1. Create a new scanner in `src/scanners/`
2. Implement the scanner interface
3. Register it in `src/index.js`
4. Add tests in `test/unit/scanners/`
5. Update documentation

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.