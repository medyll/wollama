<script lang="ts">
	interface SkillSuggestion {
		skill_id?: string;
		slug?: string;
		name: string;
		display_name?: string;
		description: string;
	}

	let { query = '', onSelect = () => {} } = $props<{
		query?: string;
		onSelect?: (skill: SkillSuggestion) => void;
	}>();
	let items = $state<SkillSuggestion[]>([]);

	const fetchSkills = async (q: string) => {
		try {
			const res = await fetch(`/api/skills?q=${encodeURIComponent(q)}`);
			items = await res.json();
		} catch {
			items = [];
		}
	};

	$effect(() => {
		if (query.startsWith('/')) {
			void fetchSkills(query.slice(1));
		} else {
			items = [];
		}
	});
</script>

<div class="skill-autocomplete">
	{#if items.length > 0}
		<ul class="skill-suggestions" aria-label="Skill suggestions">
			{#each items as item}
				<li>
					<button type="button" onclick={() => onSelect(item)}>
						{item.display_name || item.name} — {item.description}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	@layer components {
		.skill-suggestions {
			display: flex;
			flex-direction: column;
			gap: var(--gap-xs);
			margin: 0;
			padding: var(--pad-xs);
			list-style: none;
			background: var(--color-surface);
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-md);
			box-shadow: var(--shadow-sm);
		}

		.skill-suggestions button {
			width: 100%;
			padding: var(--pad-sm) var(--pad-md);
			border: 0;
			background: transparent;
			color: var(--color-text);
			text-align: start;
		}

		.skill-suggestions button:hover {
			background: var(--color-surface-raised);
		}
	}
</style>
