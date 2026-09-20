import { writable } from 'svelte/store';

interface Hook {
	id: string;
	name: string;
	enabled: boolean;
	events?: any[];
}

/** All hooks known to the settings UI. */
export const hooks = writable<Hook[]>([]);
/** The hook currently open in the detail pane, or `null` when none is. */
export const selectedHook = writable<Hook | null>(null);
/** Free-text filter applied to the hook list. */
export const filter = writable('');

/** Opens the hook with this id in the detail pane. Clears the selection if no such hook exists. */
export function select(id: string) {
	hooks.update((hs) => {
		const h = hs.find((x: Hook) => x.id === id);
		selectedHook.set(h || null);
		return hs;
	});
}

/** Flips the enabled flag of one hook in the local store. Does not persist. */
export function toggleEnabled(id: string) {
	hooks.update((hs) => {
		return hs.map((h: Hook) => (h.id === id ? { ...h, enabled: !h.enabled } : h));
	});
}

/** Appends an event to the hook it refers to (`event.id`). Ignored if that hook is not loaded. */
export function addEvent(event: any) {
	hooks.update((hs) => {
		const existing = hs.find((h: Hook) => h.id === event.id);
		if (existing) {
			existing.events = existing.events || [];
			existing.events.push(event);
			return [...hs];
		}
		return hs;
	});
}
