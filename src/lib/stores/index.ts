import { writable } from "svelte/store";


export const activeModels = writable<string[]>([]);