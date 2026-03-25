<script lang="ts" context="module">
  export const tag = 'SkillAutocomplete';
</script>

<script lang="ts">
  import { $state } from 'svelte-runes';
  import type { Skill } from '$lib/index';

  export let minChars: number = 3;
  export let debounceMs: number = 200;

  const state = $state({
    query: '',
    suggestions: [] as Skill[],
    selectedIndex: -1,
    loading: false
  });

  let debounceTimer: number | null = null;

  function fetchSuggestions(q: string) {
    if (q.length < minChars) {
      state.suggestions = [];
      state.selectedIndex = -1;
      return;
    }
    state.loading = true;
    fetch(`/api/skills?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data: Skill[]) => {
        state.suggestions = data;
        state.selectedIndex = data.length ? 0 : -1;
      })
      .catch(() => {
        state.suggestions = [];
        state.selectedIndex = -1;
      })
      .finally(() => (state.loading = false));
  }

  function onInput(e: InputEvent) {
    const v = (e.target as HTMLInputElement).value;
    state.query = v;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => fetchSuggestions(v), debounceMs);
  }

  function onKeydown(e: KeyboardEvent) {
    if (!state.suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      state.selectedIndex = Math.min(state.selectedIndex + 1, state.suggestions.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      state.selectedIndex = Math.max(state.selectedIndex - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(state.suggestions[state.selectedIndex]);
    }
  }

  function select(skill: Skill) {
    const ev = new CustomEvent('select', { detail: skill });
    dispatchEvent(ev as unknown as Event);
    // reset
    state.query = '';
    state.suggestions = [];
    state.selectedIndex = -1;
  }
</script>

<input
  type="text"
  placeholder="Type a command or skill..."
  value={state.query}
  on:input={onInput}
  on:keydown={onKeydown}
  aria-autocomplete="list"
  aria-controls="skill-list"
  aria-expanded={state.suggestions.length > 0}
  class="w-full p-2 border rounded"
/>

{#if state.suggestions.length}
  <ul id="skill-list" role="listbox" class="border rounded mt-1 bg-white">
    {#each state.suggestions as s, i}
      <li
        role="option"
        aria-selected={i === state.selectedIndex}
        class="p-2 hover:bg-gray-100 cursor-pointer {i === state.selectedIndex ? 'bg-gray-100' : ''}"
        on:click={() => select(s)}
      >
        <div class="font-medium">{s.display_name || s.name} <span class="text-xs text-gray-500">{s.command}</span></div>
        <div class="text-sm text-gray-600">{s.description}</div>
      </li>
    {/each}
  </ul>
{/if}
