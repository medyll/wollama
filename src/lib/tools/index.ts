import { ingest as ingest } from "$lib/tools/ingest";

const directory = process.argv[2];
const extensions = process.argv[3];

ingest(directory, extensions, (filePath) => {
	console.log(`Function executed on document: ${filePath}`);
})
	.then((documents) => {
		// console.log(documents);
	})
	.catch((error) => {
		console.error(error);
	});