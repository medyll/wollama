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
		<ul class="menu bg-base-100 rounded-box shadow" aria-label="Skill suggestions">
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
