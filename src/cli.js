#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const packageJson = require('../package.json');
const DependencyChecker = require('./index');

program
  .name('depcheck')
  .description('Check the health of your project dependencies')
  .version(packageJson.version)
  .option('-j, --json', 'Output results as JSON')
  .option('-f, --fix', 'Automatically fix safe updates')
  .option('-i, --ignore <packages>', 'Comma-separated list of packages to ignore')
  .option('-d, --depth <level>', 'Check dependency tree depth', parseInt)
  .option('-o, --output <file>', 'Save report to file')
  .option('-q, --quiet', 'Suppress non-critical output')
  .option('-v, --verbose', 'Show detailed information')
  .option('--fail-on-high', 'Exit with code 1 if high vulnerabilities found')
  .option('--fail-on-outdated', 'Exit with code 1 on any outdated package')
  .option('--production', 'Check only production dependencies')
  .option('--dev', 'Check only development dependencies')
  .option('--dry-run', 'Show what would be updated without making changes')
  .option('--interactive', 'Interactive mode for choosing updates')
  .option('--threshold <severity>', 'Set vulnerability threshold (low, moderate, high, critical)')
  .parse(process.argv);

const options = program.opts();

async function run() {
  const spinner = !options.quiet && !options.json ? ora('Initializing dependency health check...').start() : null;
  
  try {
    const checker = new DependencyChecker(options);
    
    if (spinner) spinner.text = 'Detecting project type...';
    await checker.detectProjectType();
    
    if (spinner) spinner.text = 'Scanning dependencies...';
    const dependencies = await checker.scanDependencies();
    
    if (spinner) spinner.text = 'Checking for outdated packages...';
    const outdated = await checker.checkOutdated(dependencies);
    
    if (spinner) spinner.text = 'Checking for vulnerabilities...';
    const vulnerabilities = await checker.checkVulnerabilities(dependencies);
    
    if (spinner) {
      spinner.succeed('Dependency health check complete');
    }
    
    const report = {
      project: checker.projectInfo,
      dependencies,
      outdated,
      vulnerabilities,
      timestamp: new Date().toISOString()
    };
    
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      const formatter = require('./formatters/text');
      formatter.format(report, options);
    }
    
    if (options.output) {
      const fs = require('fs').promises;
      await fs.writeFile(options.output, JSON.stringify(report, null, 2));
      if (!options.quiet) {
        console.log(chalk.green(`\n✔ Report saved to ${options.output}`));
      }
    }
    
    if (options.fix && !options.dryRun) {
      if (!options.quiet) {
        console.log(chalk.yellow('\n🔧 Applying safe updates...'));
      }
      await checker.applyFixes(outdated);
    }
    
    const exitCode = determineExitCode(report, options);
    process.exit(exitCode);
    
  } catch (error) {
    if (spinner) spinner.fail('Dependency health check failed');
    console.error(chalk.red(`\n✖ Error: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function determineExitCode(report, options) {
  if (options.failOnHigh) {
    const hasHighVulnerability = report.vulnerabilities.some(v => 
      v.severity === 'high' || v.severity === 'critical'
    );
    if (hasHighVulnerability) return 1;
  }
  
  if (options.failOnOutdated && report.outdated.length > 0) {
    return 1;
  }
  
  if (options.threshold) {
    const severityLevels = ['low', 'moderate', 'high', 'critical'];
    const thresholdIndex = severityLevels.indexOf(options.threshold);
    const hasViolation = report.vulnerabilities.some(v => {
      const vulnIndex = severityLevels.indexOf(v.severity);
      return vulnIndex >= thresholdIndex;
    });
    if (hasViolation) return 1;
  }
  
  return 0;
}

run();