import { ApiCall } from '$lib/tools/apiCall';
import type { LayoutServerLoad } from './$types';

export const load = (async () => {
	const ollamaFetcher = new ApiCall();
	let models = [];
	try {
		models = (await ollamaFetcher.listModels()) ?? [];
	} catch (e) {
		console.log(e);
	}
	return   { models };
}) satisfies LayoutServerLoad;
