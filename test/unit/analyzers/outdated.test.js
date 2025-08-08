const { check } = require('../../../src/analyzers/outdated');

describe('Outdated Analyzer', () => {
  let mockScanner;
  
  beforeEach(() => {
    mockScanner = {
      getLatestVersion: jest.fn()
    };
  });

  describe('check', () => {
    it('should identify outdated packages', async () => {
      const dependencies = [
        { name: 'express', version: '^4.17.1', installed: '4.17.1', type: 'production' },
        { name: 'lodash', version: '~4.17.15', installed: '4.17.15', type: 'production' }
      ];

      mockScanner.getLatestVersion
        .mockResolvedValueOnce('4.18.2')
        .mockResolvedValueOnce('4.17.21');

      const result = await check(dependencies, mockScanner, { quiet: true, json: true });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: 'express',
        current: '4.17.1',
        latest: '4.18.2',
        updateType: 'minor',
        safe: true,
        breaking: false
      });
      expect(result[1]).toMatchObject({
        name: 'lodash',
        current: '4.17.15',
        latest: '4.17.21',
        updateType: 'patch',
        safe: true,
        breaking: false
      });
    });

    it('should handle up-to-date packages', async () => {
      const dependencies = [
        { name: 'express', version: '^4.18.2', installed: '4.18.2', type: 'production' }
      ];

      mockScanner.getLatestVersion.mockResolvedValue('4.18.2');

      const result = await check(dependencies, mockScanner, { quiet: true, json: true });

      expect(result).toHaveLength(0);
    });

    it('should identify major updates as breaking', async () => {
      const dependencies = [
        { name: 'chalk', version: '^4.1.2', installed: '4.1.2', type: 'production' }
      ];

      mockScanner.getLatestVersion.mockResolvedValue('5.0.0');

      const result = await check(dependencies, mockScanner, { quiet: true, json: true });

      expect(result[0]).toMatchObject({
        name: 'chalk',
        current: '4.1.2',
        latest: '5.0.0',
        updateType: 'major',
        safe: false,
        breaking: true
      });
    });

    it('should handle missing installed versions', async () => {
      const dependencies = [
        { name: 'express', version: '^4.17.1', installed: null, type: 'production' }
      ];

      mockScanner.getLatestVersion.mockResolvedValue('4.18.2');

      const result = await check(dependencies, mockScanner, { quiet: true, json: true });

      expect(result[0]).toMatchObject({
        name: 'express',
        current: '4.17.1',
        latest: '4.18.2'
      });
    });

    it('should handle errors gracefully', async () => {
      const dependencies = [
        { name: 'express', version: '^4.17.1', installed: '4.17.1', type: 'production' },
        { name: 'invalid-package', version: '1.0.0', installed: '1.0.0', type: 'production' }
      ];

      mockScanner.getLatestVersion
        .mockResolvedValueOnce('4.18.2')
        .mockRejectedValueOnce(new Error('Package not found'));

      const result = await check(dependencies, mockScanner, { quiet: true, json: true });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('express');
    });
  });
});