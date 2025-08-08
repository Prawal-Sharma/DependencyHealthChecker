const chalk = require('chalk');
const { table } = require('table');

function format(report, options) {
  console.log('\n' + chalk.bold.cyan('Dependency Health Check Report'));
  console.log('='.repeat(50));
  
  printProjectInfo(report.project);
  printSummary(report);
  
  if (report.outdated.length > 0) {
    printOutdated(report.outdated, options);
  }
  
  if (report.vulnerabilities.length > 0) {
    printVulnerabilities(report.vulnerabilities, options);
  }
  
  printRecommendations(report);
}

function printProjectInfo(projectInfo) {
  console.log(chalk.gray('Project:'), projectInfo.name || 'Unknown');
  console.log(chalk.gray('Type:'), `${projectInfo.type} (${projectInfo.file})`);
  console.log(chalk.gray('Scanned:'), new Date().toLocaleString());
  console.log();
}

function printSummary(report) {
  const totalDeps = report.dependencies.length;
  const prodDeps = report.dependencies.filter(d => d.type === 'production').length;
  const devDeps = report.dependencies.filter(d => d.type === 'development').length;
  const outdatedCount = report.outdated.length;
  const vulnCount = report.vulnerabilities.length;
  
  console.log(`📦 ${chalk.bold('Total Dependencies:')} ${totalDeps}`);
  console.log(`   Production: ${prodDeps}`);
  console.log(`   Development: ${devDeps}`);
  console.log();
  
  if (outdatedCount > 0) {
    const majorCount = report.outdated.filter(o => o.updateType === 'major').length;
    const minorCount = report.outdated.filter(o => o.updateType === 'minor').length;
    const patchCount = report.outdated.filter(o => o.updateType === 'patch').length;
    
    console.log(`⚠️  ${chalk.yellow('Outdated Packages:')} ${outdatedCount}`);
    if (majorCount > 0) console.log(`   Major updates: ${majorCount}`);
    if (minorCount > 0) console.log(`   Minor updates: ${minorCount}`);
    if (patchCount > 0) console.log(`   Patch updates: ${patchCount}`);
    console.log();
  } else {
    console.log(`✅ ${chalk.green('All packages are up to date!')}`);
    console.log();
  }
  
  if (vulnCount > 0) {
    const criticalCount = report.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = report.vulnerabilities.filter(v => v.severity === 'high').length;
    const moderateCount = report.vulnerabilities.filter(v => v.severity === 'moderate').length;
    const lowCount = report.vulnerabilities.filter(v => v.severity === 'low').length;
    
    console.log(`🔒 ${chalk.red('Security Issues:')} ${vulnCount}`);
    if (criticalCount > 0) console.log(`   ${chalk.red('Critical:')} ${criticalCount}`);
    if (highCount > 0) console.log(`   ${chalk.red('High:')} ${highCount}`);
    if (moderateCount > 0) console.log(`   ${chalk.yellow('Moderate:')} ${moderateCount}`);
    if (lowCount > 0) console.log(`   ${chalk.gray('Low:')} ${lowCount}`);
    console.log();
  } else {
    console.log(`✅ ${chalk.green('No security vulnerabilities found!')}`);
    console.log();
  }
}

function printOutdated(outdated, options) {
  console.log(chalk.bold.yellow('\nOUTDATED PACKAGES:'));
  console.log('-'.repeat(50));
  
  const tableData = [
    ['Package', 'Current', 'Latest', 'Type', 'Update Type', 'Safe?']
  ];
  
  for (const pkg of outdated) {
    const safe = pkg.safe ? chalk.green('✓') : chalk.red('✗');
    const updateType = colorizeUpdateType(pkg.updateType);
    
    tableData.push([
      pkg.name,
      pkg.current,
      pkg.latest,
      pkg.type,
      updateType,
      safe
    ]);
  }
  
  const config = {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼'
    }
  };
  
  console.log(table(tableData, config));
}

function printVulnerabilities(vulnerabilities, options) {
  console.log(chalk.bold.red('\nVULNERABILITIES:'));
  console.log('-'.repeat(50));
  
  const grouped = {};
  for (const vuln of vulnerabilities) {
    if (!grouped[vuln.severity]) {
      grouped[vuln.severity] = [];
    }
    grouped[vuln.severity].push(vuln);
  }
  
  const severityOrder = ['critical', 'high', 'moderate', 'low'];
  
  for (const severity of severityOrder) {
    if (!grouped[severity]) continue;
    
    console.log(`\n${colorizeSeverity(severity)} Severity:`);
    
    for (const vuln of grouped[severity]) {
      console.log(`  Package: ${chalk.bold(vuln.package)}`);
      if (vuln.title) console.log(`    Vulnerability: ${vuln.title}`);
      if (vuln.cve) console.log(`    CVE: ${vuln.cve}`);
      if (vuln.url) console.log(`    More info: ${chalk.cyan(vuln.url)}`);
      if (vuln.fixAvailable) {
        console.log(`    ${chalk.green('Fix available')}`);
      }
      console.log();
    }
  }
}

function printRecommendations(report) {
  const recommendations = [];
  
  const safeUpdates = report.outdated.filter(o => o.safe).length;
  if (safeUpdates > 0) {
    recommendations.push(`Run 'depcheck --fix' to safely update ${safeUpdates} packages`);
  }
  
  const majorUpdates = report.outdated.filter(o => o.updateType === 'major').length;
  if (majorUpdates > 0) {
    recommendations.push('Manually review major updates before upgrading');
  }
  
  const highVulns = report.vulnerabilities.filter(v => 
    v.severity === 'high' || v.severity === 'critical'
  ).length;
  if (highVulns > 0) {
    recommendations.push('Consider updating packages with high/critical vulnerabilities immediately');
  }
  
  if (recommendations.length > 0) {
    console.log(chalk.bold.cyan('\nRECOMMENDATIONS:'));
    recommendations.forEach(rec => {
      console.log(`• ${rec}`);
    });
  }
}

function colorizeUpdateType(type) {
  switch (type) {
    case 'major':
      return chalk.red(type);
    case 'minor':
      return chalk.yellow(type);
    case 'patch':
      return chalk.green(type);
    default:
      return type;
  }
}

function colorizeSeverity(severity) {
  switch (severity) {
    case 'critical':
      return chalk.bgRed.white(' CRITICAL ');
    case 'high':
      return chalk.red('HIGH');
    case 'moderate':
      return chalk.yellow('MODERATE');
    case 'low':
      return chalk.gray('LOW');
    default:
      return severity.toUpperCase();
  }
}

module.exports = {
  format
};