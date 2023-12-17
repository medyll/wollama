import { writable } from 'svelte/store';

export const activeModels = writable<string[]>([]);
export const aiState = writable<'running' | 'done'>('done')

