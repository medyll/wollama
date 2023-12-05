import fs from 'fs';
import path from 'path';

/**
 * Collects documents from a directory based on the specified extensions.
 *
 * @param directory - The directory path or an array of directory paths to search for documents.
 * @param extensions - The file extensions to filter the documents. It can be a string or an array of strings.
 * @param fn - An optional callback function to be called for each collected document.
 * @returns A promise that resolves to an array of collected document paths.
 * @throws {Error} If the directory parameter is missing.
 */
export async function ingest(
	directory: string | string[],
	extensions?: string | string[],
	fn?: (filePath: string) => void
): Promise<string[]> {
	if (directory === null || directory === undefined) {
		throw new Error('Missing directory parameter');
	}

	const documents: string[] = [];

	async function traverseDirectory(dir: string) {
		const files = await fs.promises.readdir(dir);

		await Promise.all(
			files.map(async (file) => {
				const filePath = path.join(dir, file);
				const stats = await fs.promises.stat(filePath);

				if (stats.isDirectory()) {
					await traverseDirectory(filePath);
				} else {
					const fileExtension = path.extname(filePath).toLowerCase();
					if (extensions) {
						if (Array.isArray(extensions)) {
							if (extensions.includes(fileExtension)) {
								documents.push(filePath);
								if (fn) {
									fn(filePath);
								}
							}
						} else {
							if (fileExtension === extensions) {
								documents.push(filePath);
								if (fn) {
									fn(filePath);
								}
							}
						}
					} else {
						documents.push(filePath);
						if (fn) {
							fn(filePath);
						}
					}
				}
			})
		);
	}

	if (Array.isArray(directory)) {
		await Promise.all(
			directory.map(async (dir) => {
				await traverseDirectory(dir);
			})
		);
	} else {
		await traverseDirectory(directory);
	}

	return documents;
}


