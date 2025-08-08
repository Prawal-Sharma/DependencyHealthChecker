const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class NpmScanner {
  constructor(options = {}) {
    this.options = options;
    this.registryUrl = options.registry || 'https://registry.npmjs.org';
  }

  async getProjectInfo(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(content);

    return {
      name: packageJson.name || 'unnamed-project',
      version: packageJson.version || '0.0.0',
      description: packageJson.description || ''
    };
  }

  async scan(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(content);

    const dependencies = [];

    if (packageJson.dependencies && !this.options.dev) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        if (this.shouldIgnore(name)) continue;
        dependencies.push({
          name,
          version,
          type: 'production',
          installed: await this.getInstalledVersion(projectPath, name)
        });
      }
    }

    if (packageJson.devDependencies && !this.options.production) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        if (this.shouldIgnore(name)) continue;
        dependencies.push({
          name,
          version,
          type: 'development',
          installed: await this.getInstalledVersion(projectPath, name)
        });
      }
    }

    return dependencies;
  }

  async getInstalledVersion(projectPath, packageName) {
    try {
      const packageJsonPath = path.join(projectPath, 'node_modules', packageName, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      return packageJson.version;
    } catch (error) {
      return null;
    }
  }

  async getLatestVersion(packageName) {
    try {
      const response = await axios.get(`${this.registryUrl}/${packageName}/latest`, {
        timeout: 5000
      });
      return response.data.version;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error(`Package ${packageName} not found in registry`);
      }
      throw error;
    }
  }

  async getPackageInfo(packageName) {
    try {
      const response = await axios.get(`${this.registryUrl}/${packageName}`, {
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
    try {
      const { stdout } = await execAsync('npm audit --json', {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10
      });
      
      const auditData = JSON.parse(stdout);
      return this.parseAuditResults(auditData);
    } catch (error) {
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          return this.parseAuditResults(auditData);
        } catch (parseError) {
          return [];
        }
      }
      return [];
    }
  }

  parseAuditResults(auditData) {
    const vulnerabilities = [];
    
    if (auditData.vulnerabilities) {
      for (const [packageName, vulnInfo] of Object.entries(auditData.vulnerabilities)) {
        if (vulnInfo.via && Array.isArray(vulnInfo.via)) {
          vulnInfo.via.forEach(via => {
            if (typeof via === 'object' && via.title) {
              vulnerabilities.push({
                package: packageName,
                severity: vulnInfo.severity,
                title: via.title,
                url: via.url,
                range: vulnInfo.range,
                fixAvailable: vulnInfo.fixAvailable
              });
            }
          });
        }
      }
    }
    
    return vulnerabilities;
  }

  async applyUpdates(updates, projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(content);

    for (const update of updates) {
      const targetSection = update.type === 'production' ? 'dependencies' : 'devDependencies';
      
      if (packageJson[targetSection] && packageJson[targetSection][update.name]) {
        const versionPrefix = this.getVersionPrefix(packageJson[targetSection][update.name]);
        packageJson[targetSection][update.name] = `${versionPrefix}${update.latest}`;
      }
    }

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log(`Updated ${updates.length} packages in package.json`);
    console.log('Run "npm install" to install the updated versions');
    
    return true;
  }

  getVersionPrefix(versionString) {
    if (versionString.startsWith('^')) return '^';
    if (versionString.startsWith('~')) return '~';
    if (versionString.startsWith('>=')) return '>=';
    if (versionString.startsWith('>')) return '>';
    if (versionString.startsWith('<=')) return '<=';
    if (versionString.startsWith('<')) return '<';
    return '';
  }

  shouldIgnore(packageName) {
    if (!this.options.ignore) return false;
    
    const ignoreList = this.options.ignore.split(',').map(p => p.trim());
    return ignoreList.includes(packageName);
  }
}

module.exports = NpmScanner;