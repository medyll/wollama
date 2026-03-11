/**
 * Ollama API Service
 * Handles communication with Ollama server
 */

export type ErrorType = 'invalid-url' | 'connection-refused' | 'timeout' | 'dns-failure' | 'server-error' | 'unknown';

export interface OllamaHealthCheckResult {
	success: boolean;
	error?: string;
	errorType?: ErrorType;
	suggestion?: string;
	statusCode?: number;
}

const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

// Error message mapping with user-friendly messages and suggestions
const ERROR_MESSAGES: Record<ErrorType, { message: string; suggestion: string }> = {
	'invalid-url': {
		message: 'Invalid URL format',
		suggestion: 'Use format like http://localhost:11434 or https://your-server:port'
	},
	'connection-refused': {
		message: 'Connection refused',
		suggestion: 'Make sure Ollama is running and reachable at the specified address'
	},
	timeout: {
		message: 'Connection timeout',
		suggestion: 'The server took too long to respond. Check if Ollama is running.'
	},
	'dns-failure': {
		message: 'DNS lookup failed',
		suggestion: 'Cannot find the server. Check the URL spelling and make sure the host is reachable.'
	},
	'server-error': {
		message: 'Server error',
		suggestion: 'Ollama server is responding with an error. Try restarting Ollama.'
	},
	unknown: {
		message: 'Connection error',
		suggestion: 'Unable to connect to the server. Check your network and server URL.'
	}
};

/**
 * Test connection to Ollama server by calling /api/tags endpoint
 * @param serverUrl - The Ollama server URL (e.g., "http://localhost:11434")
 * @returns Promise with success status, error message, error type and suggestion if failed
 */
export async function testOllamaConnection(serverUrl: string): Promise<OllamaHealthCheckResult> {
	// Normalize URL - remove trailing slash
	const normalizedUrl = serverUrl.replace(/\/$/, '');

	// Validate URL format
	try {
		new URL(normalizedUrl);
	} catch {
		const errorType: ErrorType = 'invalid-url';
		const errorMsg = ERROR_MESSAGES[errorType];
		return {
			success: false,
			errorType,
			error: errorMsg.message,
			suggestion: errorMsg.suggestion
		};
	}

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

		const response = await fetch(`${normalizedUrl}/api/tags`, {
			method: 'GET',
			signal: controller.signal,
			headers: {
				'Content-Type': 'application/json'
			}
		});

		clearTimeout(timeoutId);

		// Check if response status is OK
		if (!response.ok) {
			let errorType: ErrorType = 'server-error';
			if (response.status >= 500) {
				errorType = 'server-error';
			}
			const errorMsg = ERROR_MESSAGES[errorType];
			return {
				success: false,
				statusCode: response.status,
				errorType,
				error: errorMsg.message,
				suggestion: errorMsg.suggestion
			};
		}

		// Try to parse as JSON to ensure it's a valid Ollama response
		try {
			const data = await response.json();
			// Valid Ollama response should have a 'models' array or be an object
			if (data && typeof data === 'object') {
				return { success: true };
			}
		} catch {
			// If JSON parsing fails, still consider it a valid connection
			// (some Ollama versions might not return JSON)
			return { success: true };
		}

		return { success: true };
	} catch (error) {
		if (error instanceof Error) {
			// Handle different error types
			if (error.name === 'AbortError') {
				const errorType: ErrorType = 'timeout';
				const errorMsg = ERROR_MESSAGES[errorType];
				return {
					success: false,
					errorType,
					error: errorMsg.message,
					suggestion: errorMsg.suggestion
				};
			}

			// Check for DNS lookup failure
			if (
				error.message.includes('getaddrinfo') ||
				error.message.includes('ENOTFOUND') ||
				error.message.includes('ECONNREFUSED') ||
				error.message.includes('EHOSTUNREACH')
			) {
				let errorType: ErrorType;
				if (error.message.includes('ENOTFOUND')) {
					errorType = 'dns-failure';
				} else {
					errorType = 'connection-refused';
				}
				const errorMsg = ERROR_MESSAGES[errorType];
				return {
					success: false,
					errorType,
					error: errorMsg.message,
					suggestion: errorMsg.suggestion
				};
			}

			// Check for connection refused / failed to fetch
			if (
				error.message.includes('Failed to fetch') ||
				error.message.includes('fetch') ||
				error.message.includes('ECONNREFUSED')
			) {
				const errorType: ErrorType = 'connection-refused';
				const errorMsg = ERROR_MESSAGES[errorType];
				return {
					success: false,
					errorType,
					error: errorMsg.message,
					suggestion: errorMsg.suggestion
				};
			}

			// Default to unknown error
			const errorType: ErrorType = 'unknown';
			const errorMsg = ERROR_MESSAGES[errorType];
			return {
				success: false,
				errorType,
				error: errorMsg.message,
				suggestion: errorMsg.suggestion
			};
		}

		const errorType: ErrorType = 'unknown';
		const errorMsg = ERROR_MESSAGES[errorType];
		return {
			success: false,
			errorType,
			error: errorMsg.message,
			suggestion: errorMsg.suggestion
		};
	}
}

/**
 * Normalize and validate Ollama server URL
 * @param url - Raw URL input from user
 * @returns Normalized URL or null if invalid
 */
export function normalizeServerUrl(url: string): string | null {
	if (!url || typeof url !== 'string') {
		return null;
	}

	let normalized = url.trim();

	// Add http:// if no protocol specified
	if (!normalized.match(/^https?:\/\//)) {
		normalized = `http://${normalized}`;
	}

	// Validate URL format
	try {
		new URL(normalized);
		return normalized;
	} catch {
		return null;
	}
}
