# Deployment Guide

This guide covers how to deploy and integrate the Dependency Health Checker into various environments and CI/CD pipelines.

## Table of Contents

- [Local Development](#local-development)
- [CI/CD Integration](#cicd-integration)
  - [GitHub Actions](#github-actions)
  - [GitLab CI](#gitlab-ci)
  - [Jenkins](#jenkins)
  - [CircleCI](#circleci)
  - [Azure DevOps](#azure-devops)
- [Docker Deployment](#docker-deployment)
- [Cloud Platforms](#cloud-platforms)
- [Enterprise Deployment](#enterprise-deployment)
- [Best Practices](#best-practices)

## Local Development

### Installation for Development

```bash
# Clone the repository
git clone https://github.com/Prawal-Sharma/DependencyHealthChecker.git
cd DependencyHealthChecker

# Install dependencies
npm install

# Link for local testing
npm link

# Now 'depcheck' command is available globally
depcheck --help
```

### Development Workflow

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

## CI/CD Integration

### GitHub Actions

#### Basic Setup

Create `.github/workflows/dependency-check.yml`:

```yaml
name: Dependency Health Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 9 * * 1' # Weekly on Monday at 9 AM

jobs:
  check-dependencies:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run dependency check
        run: npx dependency-health-checker --fail-on-high
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: dependency-report
          path: dependency-report.json
```

#### Advanced Configuration

```yaml
name: Advanced Dependency Check

on:
  workflow_dispatch:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight

jobs:
  dependency-matrix:
    strategy:
      matrix:
        node-version: [14, 16, 18]
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check dependencies
        id: depcheck
        run: |
          npx dependency-health-checker --json --output report.json
          echo "::set-output name=report::$(cat report.json)"
      
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const report = JSON.parse('${{ steps.depcheck.outputs.report }}');
            const comment = `
            ## Dependency Health Check
            
            - **Outdated**: ${report.outdated.length}
            - **Vulnerabilities**: ${report.vulnerabilities.length}
            
            Run \`depcheck --fix\` to update safe dependencies.
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - security

variables:
  NODE_VERSION: "18"

dependency-check:
  stage: security
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npx dependency-health-checker --fail-on-high --output report.json
  artifacts:
    when: always
    reports:
      dependency_scanning: report.json
    paths:
      - report.json
    expire_in: 1 week
  only:
    - main
    - develop
    - merge_requests

scheduled-check:
  stage: security
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npx dependency-health-checker --json > report.json
    - |
      if [ $(cat report.json | jq '.vulnerabilities | length') -gt 0 ]; then
        echo "Vulnerabilities found, sending alert..."
        # Add alerting logic here
      fi
  only:
    - schedules
```

### Jenkins

#### Jenkinsfile

```groovy
pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS-18'
    }
    
    triggers {
        cron('H 9 * * 1-5') // Weekdays at 9 AM
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Dependency Check') {
            steps {
                script {
                    def result = sh(
                        script: 'npx dependency-health-checker --json',
                        returnStdout: true
                    ).trim()
                    
                    def report = readJSON text: result
                    
                    if (report.vulnerabilities.size() > 0) {
                        currentBuild.result = 'UNSTABLE'
                        
                        emailext (
                            subject: "Security Vulnerabilities Found",
                            body: "Found ${report.vulnerabilities.size()} vulnerabilities",
                            to: 'team@example.com'
                        )
                    }
                }
            }
            
            post {
                always {
                    archiveArtifacts artifacts: 'report.json', allowEmptyArchive: true
                    publishHTML([
                        reportDir: '.',
                        reportFiles: 'report.html',
                        reportName: 'Dependency Report'
                    ])
                }
            }
        }
    }
    
    post {
        failure {
            emailext (
                subject: "Dependency Check Failed",
                body: "The dependency check has failed. Please check the Jenkins logs.",
                to: 'team@example.com'
            )
        }
    }
}
```

### CircleCI

Create `.circleci/config.yml`:

```yaml
version: 2.1

orbs:
  node: circleci/node@5.0.2

jobs:
  dependency-check:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Run Dependency Check
          command: npx dependency-health-checker --fail-on-high --output report.json
      - store_artifacts:
          path: report.json
          destination: dependency-report
      - run:
          name: Parse Results
          command: |
            VULNS=$(cat report.json | jq '.vulnerabilities | length')
            if [ $VULNS -gt 0 ]; then
              echo "Found $VULNS vulnerabilities"
              exit 1
            fi

workflows:
  version: 2
  check-dependencies:
    jobs:
      - dependency-check:
          filters:
            branches:
              only:
                - main
                - develop
  
  nightly:
    triggers:
      - schedule:
          cron: "0 0 * * *"
          filters:
            branches:
              only:
                - main
    jobs:
      - dependency-check
```

### Azure DevOps

Create `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  NODE_VERSION: '18.x'

stages:
  - stage: SecurityCheck
    displayName: 'Security and Dependency Check'
    jobs:
      - job: DependencyCheck
        displayName: 'Check Dependencies'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(NODE_VERSION)
            displayName: 'Install Node.js'
          
          - script: npm ci
            displayName: 'Install dependencies'
          
          - script: |
              npx dependency-health-checker --json --output $(Build.ArtifactStagingDirectory)/report.json
            displayName: 'Run dependency check'
          
          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: '$(Build.ArtifactStagingDirectory)/report.json'
              artifactName: 'dependency-report'
            condition: always()
          
          - script: |
              VULNS=$(cat $(Build.ArtifactStagingDirectory)/report.json | jq '.vulnerabilities | length')
              if [ $VULNS -gt 0 ]; then
                echo "##vso[task.logissue type=error]Found $VULNS vulnerabilities"
                exit 1
              fi
            displayName: 'Check for vulnerabilities'
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install global dependencies
RUN npm install -g dependency-health-checker

# Set up non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

ENTRYPOINT ["depcheck"]
CMD ["--help"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  dependency-checker:
    build: .
    volumes:
      - ./:/workspace
    working_dir: /workspace
    command: ["--json", "--output", "/workspace/report.json"]
```

### Running with Docker

```bash
# Build the image
docker build -t dependency-checker .

# Run check on current directory
docker run -v $(pwd):/workspace -w /workspace dependency-checker

# Run with specific options
docker run -v $(pwd):/workspace -w /workspace dependency-checker --fail-on-high
```

## Cloud Platforms

### AWS Lambda

```javascript
// handler.js
const DependencyChecker = require('dependency-health-checker');

exports.handler = async (event) => {
  const checker = new DependencyChecker({
    quiet: true,
    json: true
  });
  
  try {
    await checker.detectProjectType();
    const dependencies = await checker.scanDependencies();
    const outdated = await checker.checkOutdated(dependencies);
    const vulnerabilities = await checker.checkVulnerabilities(dependencies);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        outdated: outdated.length,
        vulnerabilities: vulnerabilities.length,
        details: { outdated, vulnerabilities }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### Google Cloud Functions

```javascript
// index.js
const DependencyChecker = require('dependency-health-checker');

exports.checkDependencies = async (req, res) => {
  const checker = new DependencyChecker({
    quiet: true,
    json: true,
    ...req.body.options
  });
  
  try {
    await checker.detectProjectType();
    const report = await checker.generateReport();
    
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## Enterprise Deployment

### Private Registry Configuration

```bash
# Set npm registry
export DEPCHECK_NPM_REGISTRY=https://private-registry.company.com

# Or use .depcheckrc.json
{
  "registries": {
    "npm": "https://private-registry.company.com",
    "python": "https://pypi.company.com/simple"
  }
}
```

### Proxy Configuration

```bash
# HTTP proxy
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# Or in .depcheckrc.json
{
  "proxy": "http://proxy.company.com:8080"
}
```

### Integration with Security Tools

```javascript
// sonarqube-integration.js
const DependencyChecker = require('dependency-health-checker');
const SonarQubeScanner = require('sonarqube-scanner');

async function scanWithSonar() {
  const checker = new DependencyChecker({ json: true });
  const report = await checker.generateFullReport();
  
  // Convert to SonarQube format
  const sonarReport = {
    issues: report.vulnerabilities.map(v => ({
      engineId: 'dependency-checker',
      ruleId: v.cve || 'SECURITY_VULNERABILITY',
      severity: mapSeverity(v.severity),
      type: 'VULNERABILITY',
      primaryLocation: {
        message: v.title,
        filePath: 'package.json'
      }
    }))
  };
  
  // Send to SonarQube
  await SonarQubeScanner({
    serverUrl: 'https://sonar.company.com',
    token: process.env.SONAR_TOKEN,
    options: {
      'sonar.externalIssuesReportPaths': 'sonar-report.json'
    }
  });
}
```

## Best Practices

### 1. Regular Scanning

```yaml
# GitHub Actions - Daily scan
on:
  schedule:
    - cron: '0 9 * * *'
```

### 2. Fail Fast on Critical Issues

```bash
# Fail on high severity vulnerabilities
depcheck --fail-on-high

# Custom threshold
depcheck --threshold moderate
```

### 3. Automated Fixes

```yaml
# Auto-fix in CI
- name: Auto-fix dependencies
  run: |
    npx dependency-health-checker --fix
    git config user.name "Dependency Bot"
    git config user.email "bot@example.com"
    git add -A
    git commit -m "Auto-fix: Update safe dependencies"
    git push
```

### 4. Notifications

```javascript
// slack-notification.js
const { WebClient } = require('@slack/web-api');
const DependencyChecker = require('dependency-health-checker');

async function checkAndNotify() {
  const checker = new DependencyChecker({ quiet: true });
  const report = await checker.generateReport();
  
  if (report.vulnerabilities.length > 0) {
    const slack = new WebClient(process.env.SLACK_TOKEN);
    
    await slack.chat.postMessage({
      channel: '#security',
      text: `⚠️ Found ${report.vulnerabilities.length} vulnerabilities in dependencies`,
      attachments: [{
        color: 'danger',
        fields: report.vulnerabilities.map(v => ({
          title: v.package,
          value: `${v.severity}: ${v.title}`,
          short: true
        }))
      }]
    });
  }
}
```

### 5. Caching

```yaml
# GitHub Actions with caching
- name: Cache dependency check results
  uses: actions/cache@v3
  with:
    path: ~/.depcheck-cache
    key: ${{ runner.os }}-depcheck-${{ hashFiles('**/package-lock.json') }}
```

### 6. Monitoring

```javascript
// prometheus-metrics.js
const client = require('prom-client');
const DependencyChecker = require('dependency-health-checker');

const outdatedGauge = new client.Gauge({
  name: 'dependencies_outdated_total',
  help: 'Total number of outdated dependencies'
});

const vulnerabilityGauge = new client.Gauge({
  name: 'dependencies_vulnerabilities_total',
  help: 'Total number of dependency vulnerabilities',
  labelNames: ['severity']
});

async function updateMetrics() {
  const checker = new DependencyChecker({ quiet: true });
  const report = await checker.generateReport();
  
  outdatedGauge.set(report.outdated.length);
  
  ['critical', 'high', 'moderate', 'low'].forEach(severity => {
    const count = report.vulnerabilities.filter(v => v.severity === severity).length;
    vulnerabilityGauge.set({ severity }, count);
  });
}
```

## Troubleshooting

### Common Issues

1. **Rate Limiting**: Use caching and respect registry rate limits
2. **Network Issues**: Configure proper proxy settings
3. **Authentication**: Set up registry credentials properly
4. **Performance**: Use ignore lists for large dependencies

### Debug Mode

```bash
# Enable debug logging
DEBUG=depcheck:* depcheck

# Verbose output
depcheck --verbose
```

## Support

For deployment issues, please refer to:
- [GitHub Issues](https://github.com/Prawal-Sharma/DependencyHealthChecker/issues)
- [User Guide](USER_GUIDE.md)
- [API Documentation](API.md)