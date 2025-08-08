const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class PythonScanner {
  constructor(options = {}) {
    this.options = options;
    this.pypiUrl = 'https://pypi.org/pypi';
  }

  async getProjectInfo(projectPath) {
    return {
      name: path.basename(projectPath),
      version: '0.0.0',
      description: 'Python project'
    };
  }

  async scan(projectPath) {
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    const content = await fs.readFile(requirementsPath, 'utf8');
    
    const dependencies = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const dependency = this.parseDependency(trimmed);
      if (dependency && !this.shouldIgnore(dependency.name)) {
        dependencies.push({
          ...dependency,
          type: 'production'
        });
      }
    }
    
    return dependencies;
  }

  parseDependency(line) {
    const operators = ['>=', '<=', '==', '!=', '~=', '>', '<'];
    
    for (const op of operators) {
      if (line.includes(op)) {
        const [name, version] = line.split(op);
        return {
          name: name.trim(),
          version: `${op}${version.trim()}`,
          specifiedVersion: version.trim()
        };
      }
    }
    
    return {
      name: line.trim(),
      version: '*',
      specifiedVersion: null
    };
  }

  async getLatestVersion(packageName) {
    try {
      const response = await axios.get(`${this.pypiUrl}/${packageName}/json`, {
        timeout: 5000
      });
      return response.data.info.version;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error(`Package ${packageName} not found in PyPI`);
      }
      throw error;
    }
  }

  async getPackageInfo(packageName) {
    try {
      const response = await axios.get(`${this.pypiUrl}/${packageName}/json`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getVulnerabilities(dependencies) {
    const vulnerabilities = [];
    
    for (const dep of dependencies) {
      try {
        const response = await axios.get(
          `https://pyup.io/api/v1/safety/${dep.name}`,
          { timeout: 5000 }
        );
        
        if (response.data && response.data.vulnerabilities) {
          response.data.vulnerabilities.forEach(vuln => {
            vulnerabilities.push({
              package: dep.name,
              severity: this.mapSeverity(vuln.severity),
              title: vuln.advisory,
              cve: vuln.cve,
              affectedVersions: vuln.specs,
              fixedIn: vuln.fixed_in
            });
          });
        }
      } catch (error) {
        continue;
      }
    }
    
    return vulnerabilities;
  }

  mapSeverity(severity) {
    const severityMap = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'moderate',
      'moderate': 'moderate',
      'low': 'low'
    };
    
    return severityMap[severity.toLowerCase()] || 'moderate';
  }

  async applyUpdates(updates, projectPath) {
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    const content = await fs.readFile(requirementsPath, 'utf8');
    const lines = content.split('\n');
    
    const updatedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      
      const dependency = this.parseDependency(trimmed);
      if (!dependency) return line;
      
      const update = updates.find(u => u.name === dependency.name);
      if (!update) return line;
      
      const operator = this.extractOperator(dependency.version) || '==';
      return `${dependency.name}${operator}${update.latest}`;
    });
    
    await fs.writeFile(requirementsPath, updatedLines.join('\n'));
    
    console.log(`Updated ${updates.length} packages in requirements.txt`);
    console.log('Run "pip install -r requirements.txt" to install the updated versions');
    
    return true;
  }

  extractOperator(versionString) {
    const operators = ['>=', '<=', '==', '!=', '~=', '>', '<'];
    for (const op of operators) {
      if (versionString.startsWith(op)) {
        return op;
      }
    }
    return null;
  }

  shouldIgnore(packageName) {
    if (!this.options.ignore) return false;
    
    const ignoreList = this.options.ignore.split(',').map(p => p.trim());
    return ignoreList.includes(packageName);
  }
}

module.exports = PythonScanner;