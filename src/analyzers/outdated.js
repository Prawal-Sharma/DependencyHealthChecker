const semver = require('semver');
const ora = require('ora');
const chalk = require('chalk');

async function check(dependencies, scanner, options) {
  const outdated = [];
  const total = dependencies.length;
  let current = 0;
  
  const spinner = !options.quiet && !options.json ? 
    ora(`Checking for updates (0/${total})`).start() : null;
  
  for (const dep of dependencies) {
    current++;
    if (spinner) {
      spinner.text = `Checking for updates (${current}/${total}): ${dep.name}`;
    }
    
    try {
      const latestVersion = await scanner.getLatestVersion(dep.name);
      const currentVersion = dep.installed || parseVersion(dep.version);
      
      if (currentVersion && latestVersion && currentVersion !== latestVersion) {
        const updateType = getUpdateType(currentVersion, latestVersion);
        const isSafe = updateType !== 'major';
        
        outdated.push({
          name: dep.name,
          current: currentVersion,
          wanted: dep.version,
          latest: latestVersion,
          type: dep.type,
          updateType,
          safe: isSafe,
          breaking: updateType === 'major'
        });
      }
    } catch (error) {
      if (options.verbose) {
        console.error(chalk.yellow(`\nWarning: Could not check ${dep.name}: ${error.message}`));
      }
    }
  }
  
  if (spinner) {
    spinner.succeed(`Checked ${total} dependencies for updates`);
  }
  
  return outdated;
}

function parseVersion(versionString) {
  if (!versionString) return null;
  
  const cleanVersion = versionString.replace(/^[\^~>=<]+/, '');
  
  return semver.valid(cleanVersion) ? cleanVersion : null;
}

function getUpdateType(current, latest) {
  try {
    if (!semver.valid(current) || !semver.valid(latest)) {
      return 'unknown';
    }
    
    const currentParsed = semver.parse(current);
    const latestParsed = semver.parse(latest);
    
    if (latestParsed.major > currentParsed.major) {
      return 'major';
    } else if (latestParsed.minor > currentParsed.minor) {
      return 'minor';
    } else if (latestParsed.patch > currentParsed.patch) {
      return 'patch';
    }
    
    return 'none';
  } catch (error) {
    return 'unknown';
  }
}

module.exports = {
  check
};