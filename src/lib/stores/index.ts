import { derived, writable } from 'svelte/store';

export const activeModels = writable<string[]>([]);
export const aiState = writable<'request_stop' | 'running' | 'done'>('done');

export const pullModelState = writable<{
	status?: string;
	completed?: number;
	total?: number;
	error?: string;
	digest?: string;
}>({});
