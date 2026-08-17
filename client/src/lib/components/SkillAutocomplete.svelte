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
	let showAutocomplete = $state(false);

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function onInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		query = value;

		if (value.length >= minChars) {
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				dispatch('input', value);
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
</script>

<skill-autocomplete>
	<input
		type="text"
		bind:value={query}
		oninput={onInput}
		onkeydown={onKeydown}
		class="w-full"
		placeholder="Type a skill (e.g., /translate)"
		role="combobox"
		aria-expanded={showAutocomplete}
		aria-controls="skill-autocomplete-list"
		aria-autocomplete="list"
	/>

	{#if showAutocomplete && suggestions.length > 0}
		<ul id="skill-autocomplete-list" class="skill-suggestions" role="listbox">
			{#each suggestions as item, index}
				<li role="option" aria-selected={index === selectedIndex} onmouseenter={() => (selectedIndex = index)}>
					<button
						type="button"
						class="skill-option"
						data-selected={index === selectedIndex ? 'true' : undefined}
						onclick={() => selectItem(item)}
					>
						<span class="font-medium">{item.command}</span>
						<span class="skill-description"> — {item.description}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</skill-autocomplete>

<style>
	@layer components {
		skill-autocomplete {
			position: relative;
			display: block;
		}

		.skill-suggestions {
			position: absolute;
			z-index: var(--z-dropdown);
			inset-inline: 0;
			top: 100%;
			max-height: 15rem;
			margin: var(--gap-xs) 0 0;
			padding: var(--pad-xs);
			overflow-y: auto;
			list-style: none;
			background: var(--color-surface);
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-md);
			box-shadow: var(--shadow-lg);
		}

		.skill-option {
			width: 100%;
			padding: var(--pad-sm) var(--pad-md);
			border: 0;
			background: transparent;
			color: var(--color-text);
			border-radius: var(--radius-sm);
			cursor: pointer;
			text-align: start;
		}

		.skill-option:hover,
		.skill-option[data-selected='true'] {
			background: var(--color-surface-raised);
		}

		.skill-description {
			color: var(--color-text-muted);
			font-size: var(--text-sm);
		}
	}
</style>
