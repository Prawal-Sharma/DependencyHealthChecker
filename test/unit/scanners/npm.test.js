const NpmScanner = require('../../../src/scanners/npm');
const fs = require('fs').promises;
const path = require('path');

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    access: jest.fn(),
    writeFile: jest.fn()
  }
}));

jest.mock('axios');
const axios = require('axios');

describe('NpmScanner', () => {
  let scanner;

  beforeEach(() => {
    scanner = new NpmScanner();
    jest.clearAllMocks();
  });

  describe('getProjectInfo', () => {
    it('should extract project info from package.json', async () => {
      const mockPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project description'
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await scanner.getProjectInfo('/test/path');

      expect(fs.readFile).toHaveBeenCalledWith(
        path.join('/test/path', 'package.json'),
        'utf8'
      );
      expect(result).toEqual({
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project description'
      });
    });

    it('should handle missing fields in package.json', async () => {
      const mockPackageJson = {};

      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await scanner.getProjectInfo('/test/path');

      expect(result).toEqual({
        name: 'unnamed-project',
        version: '0.0.0',
        description: ''
      });
    });
  });

  describe('scan', () => {
    it('should scan production dependencies', async () => {
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1',
          'lodash': '~4.17.15'
        },
        devDependencies: {
          'jest': '^27.0.0'
        }
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await scanner.scan('/test/path');

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        name: 'express',
        version: '^4.17.1',
        type: 'production'
      });
      expect(result[1]).toMatchObject({
        name: 'lodash',
        version: '~4.17.15',
        type: 'production'
      });
      expect(result[2]).toMatchObject({
        name: 'jest',
        version: '^27.0.0',
        type: 'development'
      });
    });

    it('should respect production-only flag', async () => {
      scanner = new NpmScanner({ production: true });
      
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1'
        },
        devDependencies: {
          'jest': '^27.0.0'
        }
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await scanner.scan('/test/path');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('express');
    });

    it('should respect dev-only flag', async () => {
      scanner = new NpmScanner({ dev: true });
      
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1'
        },
        devDependencies: {
          'jest': '^27.0.0'
        }
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await scanner.scan('/test/path');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('jest');
    });

    it('should handle ignore list', async () => {
      scanner = new NpmScanner({ ignore: 'lodash,express' });
      
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1',
          'lodash': '~4.17.15',
          'axios': '^0.21.1'
        }
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await scanner.scan('/test/path');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('axios');
    });
  });

  describe('getLatestVersion', () => {
    it('should fetch latest version from registry', async () => {
      axios.get.mockResolvedValue({
        data: { version: '4.18.2' }
      });

      const result = await scanner.getLatestVersion('express');

      expect(axios.get).toHaveBeenCalledWith(
        'https://registry.npmjs.org/express/latest',
        { timeout: 5000 }
      );
      expect(result).toBe('4.18.2');
    });

    it('should handle package not found', async () => {
      axios.get.mockRejectedValue({
        response: { status: 404 }
      });

      await expect(scanner.getLatestVersion('non-existent')).rejects.toThrow(
        'Package non-existent not found in registry'
      );
    });
  });

  describe('getVersionPrefix', () => {
    it('should extract version prefix correctly', () => {
      expect(scanner.getVersionPrefix('^1.0.0')).toBe('^');
      expect(scanner.getVersionPrefix('~1.0.0')).toBe('~');
      expect(scanner.getVersionPrefix('>=1.0.0')).toBe('>=');
      expect(scanner.getVersionPrefix('1.0.0')).toBe('');
    });
  });

  describe('applyUpdates', () => {
    it('should update package.json with new versions', async () => {
      const mockPackageJson = {
        dependencies: {
          'express': '^4.17.1',
          'lodash': '~4.17.15'
        }
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

      const updates = [
        { name: 'express', latest: '4.18.2', type: 'production' },
        { name: 'lodash', latest: '4.17.21', type: 'production' }
      ];

      await scanner.applyUpdates(updates, '/test/path');

      const writeCall = fs.writeFile.mock.calls[0];
      const writtenContent = JSON.parse(writeCall[1]);

      expect(writtenContent.dependencies.express).toBe('^4.18.2');
      expect(writtenContent.dependencies.lodash).toBe('~4.17.21');
    });
  });
});