<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  interface Skill {
    name: string;
    display_name: string;
    description: string;
    command: string;
  }

  const { minChars = 3, debounceMs = 200, onSelect = () => {} } = $props();

  const dispatch = createEventDispatcher<{
    select: Skill;
    input: string;
  }>();

  let query = $state('');
  let suggestions = $state<Skill[]>([]);
  let selectedIndex = $state(-1);
  let loading = $state(false);
  let showAutocomplete = $state(false);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function onInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    query = value;

    if (value.length >= minChars) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loading = true;
        dispatch('input', value);
        loading = false;
        showAutocomplete = true;
      }, debounceMs);
    } else {
      suggestions = [];
      showAutocomplete = false;
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectItem(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      showAutocomplete = false;
    }
  }

  function selectItem(item: Skill) {
    query = item.display_name || item.name;
    showAutocomplete = false;
    dispatch('select', item);
    onSelect(item);
  }

  function updateSuggestions(items: Skill[]) {
    suggestions = items;
    selectedIndex = -1;
  }
</script>

<div class="relative">
  <input
    type="text"
    bind:value={query}
    oninput={onInput}
    onkeydown={onKeydown}
    class="input input-bordered w-full"
    placeholder="Type a skill (e.g., /translate)"
    role="combobox"
    aria-expanded={showAutocomplete}
    aria-controls="skill-autocomplete-list"
    aria-autocomplete="list"
  />

  {#if showAutocomplete && suggestions.length > 0}
    <ul
      id="skill-autocomplete-list"
      class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-base-300 bg-base-100 shadow-lg"
      role="listbox"
    >
      {#each suggestions as item, index}
        <li
          role="option"
          aria-selected={index === selectedIndex}
          class="cursor-pointer px-4 py-2 hover:bg-base-200 {index === selectedIndex ? 'bg-base-200' : ''}"
          onclick={() => selectItem(item)}
          onmouseenter={() => (selectedIndex = index)}
        >
          <span class="font-medium">{item.command}</span>
          <span class="text-base-content/70 text-sm"> — {item.description}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>
