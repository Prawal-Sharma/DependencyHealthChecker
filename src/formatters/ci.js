const chalk = require('chalk');

function format(report, options) {
  const hasIssues = report.outdated.length > 0 || report.vulnerabilities.length > 0;
  
  console.log('::group::Dependency Health Check Results');
  
  printSummary(report);
  
  if (report.vulnerabilities.length > 0) {
    printVulnerabilities(report.vulnerabilities);
  }
  
  if (report.outdated.length > 0) {
    printOutdated(report.outdated);
  }
  
  console.log('::endgroup::');
  
  if (hasIssues) {
    printAnnotations(report);
  }
  
  return hasIssues ? 1 : 0;
}

function printSummary(report) {
  const totalDeps = report.dependencies.length;
  const outdatedCount = report.outdated.length;
  const vulnCount = report.vulnerabilities.length;
  
  console.log(`Total Dependencies: ${totalDeps}`);
  console.log(`Outdated Packages: ${outdatedCount}`);
  console.log(`Security Vulnerabilities: ${vulnCount}`);
  console.log();
}

function printVulnerabilities(vulnerabilities) {
  const critical = vulnerabilities.filter(v => v.severity === 'critical');
  const high = vulnerabilities.filter(v => v.severity === 'high');
  const moderate = vulnerabilities.filter(v => v.severity === 'moderate');
  const low = vulnerabilities.filter(v => v.severity === 'low');
  
  if (critical.length > 0) {
    console.log(`::error::Found ${critical.length} CRITICAL vulnerabilities`);
    critical.forEach(v => {
      console.log(`::error file=package.json::${v.package}: ${v.title || 'Critical vulnerability'}`);
    });
  }
  
  if (high.length > 0) {
    console.log(`::error::Found ${high.length} HIGH severity vulnerabilities`);
    high.forEach(v => {
      console.log(`::error file=package.json::${v.package}: ${v.title || 'High severity vulnerability'}`);
    });
  }
  
  if (moderate.length > 0) {
    console.log(`::warning::Found ${moderate.length} MODERATE severity vulnerabilities`);
    moderate.forEach(v => {
      console.log(`::warning file=package.json::${v.package}: ${v.title || 'Moderate vulnerability'}`);
    });
  }
  
  if (low.length > 0) {
    console.log(`::notice::Found ${low.length} LOW severity vulnerabilities`);
  }
}

function printOutdated(outdated) {
  const major = outdated.filter(o => o.updateType === 'major');
  const minor = outdated.filter(o => o.updateType === 'minor');
  const patch = outdated.filter(o => o.updateType === 'patch');
  
  if (major.length > 0) {
    console.log(`::warning::${major.length} packages have major updates available`);
    major.forEach(pkg => {
      console.log(`::warning file=package.json::${pkg.name}: ${pkg.current} → ${pkg.latest} (major)`);
    });
  }
  
  if (minor.length > 0) {
    console.log(`::notice::${minor.length} packages have minor updates available`);
  }
  
  if (patch.length > 0) {
    console.log(`::notice::${patch.length} packages have patch updates available`);
  }
}

function printAnnotations(report) {
  if (process.env.GITHUB_ACTIONS) {
    const outputFile = process.env.GITHUB_STEP_SUMMARY;
    if (outputFile) {
      const fs = require('fs');
      const summary = generateMarkdownSummary(report);
      fs.appendFileSync(outputFile, summary);
    }
  }
}

function generateMarkdownSummary(report) {
  let markdown = '## Dependency Health Check\n\n';
  
  markdown += '### Summary\n';
  markdown += `- **Total Dependencies:** ${report.dependencies.length}\n`;
  markdown += `- **Outdated:** ${report.outdated.length}\n`;
  markdown += `- **Vulnerabilities:** ${report.vulnerabilities.length}\n\n`;
  
  if (report.vulnerabilities.length > 0) {
    markdown += '### Security Vulnerabilities\n\n';
    markdown += '| Package | Severity | Description |\n';
    markdown += '|---------|----------|-------------|\n';
    
    report.vulnerabilities.forEach(v => {
      markdown += `| ${v.package} | ${v.severity.toUpperCase()} | ${v.title || 'N/A'} |\n`;
    });
    markdown += '\n';
  }
  
  if (report.outdated.length > 0) {
    markdown += '### Outdated Packages\n\n';
    markdown += '| Package | Current | Latest | Type |\n';
    markdown += '|---------|---------|--------|------|\n';
    
    report.outdated.slice(0, 10).forEach(pkg => {
      markdown += `| ${pkg.name} | ${pkg.current} | ${pkg.latest} | ${pkg.updateType} |\n`;
    });
    
    if (report.outdated.length > 10) {
      markdown += `\n*... and ${report.outdated.length - 10} more*\n`;
    }
  }
  
  return markdown;
}

module.exports = {
  format
};