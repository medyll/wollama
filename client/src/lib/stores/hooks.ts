import { writable } from 'svelte/store';

interface Hook {
	id: string;
	name: string;
	enabled: boolean;
	events?: any[];
}

export const hooks = writable<Hook[]>([]);
export const selectedHook = writable<Hook | null>(null);

export function select(id: string) {
	hooks.update(hs => {
		const h = hs.find((x: Hook) => x.id === id);
		selectedHook.set(h || null);
		return hs;
	});
}

export function toggleEnabled(id: string) {
	hooks.update(hs => {
		return hs.map((h: Hook) => h.id === id ? { ...h, enabled: !h.enabled } : h);
	});
}

export function addEvent(event: any) {
	hooks.update(hs => {
		const existing = hs.find((h: Hook) => h.id === event.id);
		if (existing) {
			existing.events = existing.events || [];
			existing.events.push(event);
			return [...hs];
		}
		return hs;
	});
}
