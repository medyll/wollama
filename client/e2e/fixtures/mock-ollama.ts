/**
 * Mock Ollama Server for E2E Testing
 * 
 * Provides deterministic responses for:
 * - Health checks (GET /api/tags)
 * - Chat completions (POST /api/chat)
 * 
 * Usage:
 *   const mockServer = new MockOllamaServer(port);
 *   await mockServer.start();
 *   // Run tests...
 *   await mockServer.stop();
 */

import http from 'http';

export class MockOllamaServer {
	private server: http.Server | null = null;
	private port: number;

	constructor(port: number = 11434) {
		this.port = port;
	}

	async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.server = http.createServer((req, res) => {
				// Enable CORS
				res.setHeader('Access-Control-Allow-Origin', '*');
				res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
				res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

				if (req.method === 'OPTIONS') {
					res.writeHead(200);
					res.end();
					return;
				}

				// Health check endpoint
				if (req.method === 'GET' && req.url === '/api/tags') {
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(
						JSON.stringify({
							models: [
								{
									name: 'mistral:latest',
									modified_at: new Date().toISOString(),
									size: 4000000000,
									digest: 'sha256:abc123'
								},
								{
									name: 'neural-chat:latest',
									modified_at: new Date().toISOString(),
									size: 3000000000,
									digest: 'sha256:def456'
								}
							]
						})
					);
					return;
				}

				// Chat completions endpoint (streaming)
				if (req.method === 'POST' && req.url === '/api/chat') {
					let body = '';

					req.on('data', (chunk) => {
						body += chunk.toString();
					});

					req.on('end', () => {
						try {
							const request = JSON.parse(body);

							// Deterministic response based on input
							const responseText =
								request.messages?.[request.messages.length - 1]?.content === 'test'
									? 'This is a test response from the mock Ollama server.'
									: 'This is a mock response from Ollama. It always returns the same message for non-test inputs.';

							// Stream response in chunks (simulating streaming)
							res.writeHead(200, {
								'Content-Type': 'application/json',
								'Transfer-Encoding': 'chunked'
							});

							const words = responseText.split(' ');
							let index = 0;

							const sendChunk = () => {
								if (index < words.length) {
									const chunk = {
										model: 'mistral:latest',
										created_at: new Date().toISOString(),
										message: {
											role: 'assistant',
											content: words[index] + ' '
										},
										done: false
									};

									res.write(JSON.stringify(chunk) + '\n');
									index++;

									// Simulate streaming delay
									setTimeout(sendChunk, 50);
								} else {
									// Send final chunk
									const finalChunk = {
										model: 'mistral:latest',
										created_at: new Date().toISOString(),
										message: {
											role: 'assistant',
											content: ''
										},
										done: true,
										total_duration: 1000000000,
										load_duration: 100000000,
										prompt_eval_count: 10,
										prompt_eval_duration: 200000000,
										eval_count: words.length,
										eval_duration: 700000000
									};

									res.write(JSON.stringify(finalChunk) + '\n');
									res.end();
								}
							};

							sendChunk();
						} catch (error) {
							res.writeHead(400, { 'Content-Type': 'application/json' });
							res.end(JSON.stringify({ error: 'Invalid request' }));
						}
					});

					return;
				}

				// 404 for unknown endpoints
				res.writeHead(404, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Not found' }));
			});

			this.server.listen(this.port, () => {
				console.log(`Mock Ollama server listening on port ${this.port}`);
				resolve();
			});

			this.server.on('error', (error) => {
				console.error('Mock server error:', error);
				reject(error);
			});
		});
	}

	async stop(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.server) {
				this.server.close((error) => {
					if (error) {
						reject(error);
					} else {
						console.log('Mock Ollama server stopped');
						resolve();
					}
				});
			} else {
				resolve();
			}
		});
	}
}
