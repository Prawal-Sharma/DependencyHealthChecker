function format(report, options) {
  const output = {
    project: report.project,
    timestamp: report.timestamp,
    summary: {
      total: report.dependencies.length,
      production: report.dependencies.filter(d => d.type === 'production').length,
      development: report.dependencies.filter(d => d.type === 'development').length,
      outdated: report.outdated.length,
      vulnerabilities: report.vulnerabilities.length
    },
    dependencies: report.dependencies,
    outdated: report.outdated.map(pkg => ({
      name: pkg.name,
      current: pkg.current,
      wanted: pkg.wanted,
      latest: pkg.latest,
      type: pkg.type,
      updateType: pkg.updateType,
      safe: pkg.safe,
      breaking: pkg.breaking
    })),
    vulnerabilities: report.vulnerabilities.map(vuln => ({
      package: vuln.package,
      severity: vuln.severity,
      title: vuln.title,
      cve: vuln.cve,
      url: vuln.url,
      range: vuln.range,
      fixAvailable: vuln.fixAvailable
    })),
    recommendations: generateRecommendations(report)
  };

  return output;
}

function generateRecommendations(report) {
  const recommendations = [];
  
  const safeUpdates = report.outdated.filter(o => o.safe).length;
  if (safeUpdates > 0) {
    recommendations.push({
      type: 'update',
      priority: 'medium',
      message: `${safeUpdates} packages can be safely updated`,
      action: 'depcheck --fix'
    });
  }
  
  const majorUpdates = report.outdated.filter(o => o.updateType === 'major').length;
  if (majorUpdates > 0) {
    recommendations.push({
      type: 'review',
      priority: 'low',
      message: `${majorUpdates} major version updates available`,
      action: 'Review breaking changes before updating'
    });
  }
  
  const criticalVulns = report.vulnerabilities.filter(v => v.severity === 'critical').length;
  if (criticalVulns > 0) {
    recommendations.push({
      type: 'security',
      priority: 'critical',
      message: `${criticalVulns} critical vulnerabilities found`,
      action: 'Update affected packages immediately'
    });
  }
  
  const highVulns = report.vulnerabilities.filter(v => v.severity === 'high').length;
  if (highVulns > 0) {
    recommendations.push({
      type: 'security',
      priority: 'high',
      message: `${highVulns} high severity vulnerabilities found`,
      action: 'Update affected packages as soon as possible'
    });
  }
  
  return recommendations;
}

module.exports = {
  format
};