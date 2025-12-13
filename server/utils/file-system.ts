import fs from 'fs';
import path from 'path';

export class FileSystemUtils {
	static generateTree(dir: string, depth: number = 2, currentDepth: number = 0): string {
		if (currentDepth > depth) return '';

		let output = '';
		try {
			const files = fs.readdirSync(dir);
			for (const file of files) {
				// Basic ignore list
				if (file.startsWith('.') || file === 'node_modules' || file === 'dist' || file === 'build' || file === 'target')
					continue;

				const filePath = path.join(dir, file);
				const stats = fs.statSync(filePath);
				const indent = '  '.repeat(currentDepth);

				if (stats.isDirectory()) {
					output += `${indent}📁 ${file}/\n`;
					output += this.generateTree(filePath, depth, currentDepth + 1);
				} else {
					output += `${indent}📄 ${file}\n`;
				}
			}
		} catch (e) {
			return '';
		}
		return output;
	}
}
