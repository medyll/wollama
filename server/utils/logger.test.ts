import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
	const consoleLogSpy = vi.spyOn(console, 'log');
	const consoleWarnSpy = vi.spyOn(console, 'warn');
	const consoleErrorSpy = vi.spyOn(console, 'error');

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should log info messages', () => {
		logger.info('TestContext', 'Info message');
		expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
		expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[TestContext]'));
		expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'));
	});

	it('should log warn messages', () => {
		logger.warn('TestContext', 'Warn message');
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[TestContext]'));
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Warn message'));
	});

	it('should log error messages', () => {
		logger.error('TestContext', 'Error message');
		expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
		expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[TestContext]'));
		expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error message'));
	});

	it('should log success messages', () => {
		logger.success('TestContext', 'Success message');
		expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[SUCCESS]'));
		expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[TestContext]'));
		expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Success message'));
	});
});
