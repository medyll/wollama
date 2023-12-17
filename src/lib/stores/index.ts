import { derived, writable } from 'svelte/store';

export const activeModels = writable<string[]>([]);
export const aiState = writable<'request_stop'|'running' | 'done'>('done')

 