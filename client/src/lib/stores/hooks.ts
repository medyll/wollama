import { writable } from 'svelte/store';

export const hooks = writable([]);
export const selectedHook = writable(null);
export const filter = writable('');

export function select(id: string) {
  hooks.update(hs => {
    const h = hs.find(x => x.id === id);
    selectedHook.set(h || null);
    return hs;
  });
}

export function toggleEnabled(id: string) {
  hooks.update(hs => {
    return hs.map(h => h.id === id ? { ...h, enabled: !h.enabled } : h);
  });
}

export function addEvent(event) {
  hooks.update(hs => {
    const existing = hs.find(h => h.id === event.id);
    if (existing) {
      existing.events = existing.events || [];
      existing.events.push(event);
      return [...hs];
    }
    return [...hs, { ...event, events: [event], enabled: true }];
  });
}
