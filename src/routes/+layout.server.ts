import { ApiCall } from '$lib/tools/apiCall';
import type { LayoutServerLoad } from './$types';

export const load = (async () => {
	const ollamaFetcher = new ApiCall();
	const models = await ollamaFetcher.listModels();
	return {models};
}) satisfies LayoutServerLoad;
