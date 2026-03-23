<!-- Minimal SkillAutocomplete.svelte (Svelte 5 runes-style placeholder) -->
<script lang="ts">
	// This is a minimal placeholder component.
	// Replace with Svelte 5 runes-style implementation as needed.
	export let query: string = '';
	export let onSelect: (skill: any) => void = () => {};

	let items: any[] = [];

	const fetchSkills = async (q: string) => {
		try {
			const res = await fetch(`/api/skills?q=${encodeURIComponent(q)}`);
			items = await res.json();
		} catch (e) {
			items = [];
		}
	};

	$: if (query && query.startsWith('/')) {
		fetchSkills(query.slice(1));
	} else {
		items = [];
	}
</script>

<div class="skill-autocomplete">
	{#if items.length > 0}
		<ul>
			{#each items as item}
				<li on:click={() => onSelect(item)}>{item.display_name || item.name} — {item.description}</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.skill-autocomplete ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.skill-autocomplete li {
		padding: 8px;
		cursor: pointer;
	}
	.skill-autocomplete li:hover {
		background: #f3f4f6;
	}
</style>
