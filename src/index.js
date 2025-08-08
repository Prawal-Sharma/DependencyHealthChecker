const path = require('path');
const fs = require('fs').promises;

class DependencyChecker {
  constructor(options = {}) {
    this.options = options;
    this.cwd = process.cwd();
    this.projectInfo = {};
    this.scanner = null;
  }

  async detectProjectType() {
    const scanners = [
      { name: 'npm', file: 'package.json', Scanner: require('./scanners/npm') },
      { name: 'python', file: 'requirements.txt', Scanner: require('./scanners/python') }
    ];

    for (const { name, file, Scanner } of scanners) {
      try {
        await fs.access(path.join(this.cwd, file));
        this.projectInfo.type = name;
        this.projectInfo.file = file;
        this.scanner = new Scanner(this.options);
        
        const projectData = await this.scanner.getProjectInfo(this.cwd);
        this.projectInfo = { ...this.projectInfo, ...projectData };
        
        return;
      } catch (error) {
        continue;
      }
    }

    throw new Error('Could not detect project type. No package.json or requirements.txt found.');
  }

  async scanDependencies() {
    if (!this.scanner) {
      throw new Error('Project type not detected. Run detectProjectType() first.');
    }

    return await this.scanner.scan(this.cwd);
  }

  async checkOutdated(dependencies) {
    if (!this.scanner) {
      throw new Error('Project type not detected. Run detectProjectType() first.');
    }

    const analyzer = require('./analyzers/outdated');
    return await analyzer.check(dependencies, this.scanner, this.options);
  }

  async checkVulnerabilities(dependencies) {
    if (!this.scanner) {
      throw new Error('Project type not detected. Run detectProjectType() first.');
    }

    const analyzer = require('./analyzers/vulnerability');
    return await analyzer.check(dependencies, this.scanner, this.options);
  }

  async applyFixes(outdated) {
    if (!this.scanner) {
      throw new Error('Project type not detected. Run detectProjectType() first.');
    }

    const safeUpdates = outdated.filter(pkg => pkg.safe && !pkg.breaking);
    
    if (safeUpdates.length === 0) {
      console.log('No safe updates to apply.');
      return;
    }

    return await this.scanner.applyUpdates(safeUpdates, this.cwd);
  }
}

module.exports = DependencyChecker;