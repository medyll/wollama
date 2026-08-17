<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { runStore } from '$lib/services/run.service.svelte.js';

	let { runId }: { runId: string } = $props();

	let run = $derived(runStore.runs[runId]);
	let events = $derived(runStore.events[runId] ?? []);

	onMount(() => {
		runStore.watch(runId);
	});

	// Note: intentionally not calling stopWatching() on destroy — a run this
	// component stops watching might still be watched by another mounted
	// RunTimeline for the same run_id (e.g. two open chat views), and the poller is
	// self-terminating once the run reaches a terminal status regardless.
	onDestroy(() => {});

	function handleCancel() {
		void runStore.cancel(runId);
	}

	function gapRange(payload: unknown): { from: unknown; to: unknown } {
		const p = (payload ?? {}) as { from_seq?: unknown; to_seq?: unknown };
		return { from: p.from_seq, to: p.to_seq };
	}
</script>

<run-timeline data-status={run?.status ?? 'unknown'}>
	<div class="flex items-start justify-between">
		<div>
			<div class="font-semibold">Run {runId}</div>
			{#if run}
				<div class="text-muted text-sm">{run.agent} &middot; {run.mode}</div>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<span class="text-muted text-sm" data-testid="run-status">{run?.status ?? 'loading…'}</span>
			{#if run && !['completed', 'failed', 'cancelled', 'interrupted', 'timed_out'].includes(run.status)}
				<button type="button" onclick={handleCancel} data-testid="run-cancel-button">Cancel</button>
			{/if}
		</div>
	</div>

	{#if run?.error}
		<p class="run-error">{run.error}</p>
	{/if}

	<ol class="run-events">
		{#each events as event (event.run_event_id)}
			<li data-event-type={event.type} class:run-gap-marker={event.type === 'run_gap'}>
				<span class="event-seq">#{event.seq}</span>
				<span class="event-type">{event.type}</span>
				{#if event.type === 'run_gap'}
					{@const gap = gapRange(event.payload)}
					<span class="run-gap-note">missing events {gap.from}–{gap.to}</span>
				{/if}
			</li>
		{/each}
	</ol>
</run-timeline>

<style>
	@layer components {
		run-timeline {
			display: block;
			padding: var(--pad-md);
			background: var(--color-surface);
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-md);
		}

		run-timeline[data-status='failed'],
		run-timeline[data-status='interrupted'] {
			border-color: var(--color-critical);
		}

		run-timeline[data-status='completed'] {
			border-color: var(--color-success);
		}

		.run-error {
			color: var(--color-critical);
			font-size: var(--text-sm);
		}

		.run-events {
			list-style: none;
			margin: var(--pad-sm, 0.5rem) 0 0;
			padding: 0;
			display: flex;
			flex-direction: column;
			gap: var(--pad-xs, 0.25rem);
			font-size: var(--text-xs);
		}

		.event-seq {
			color: var(--color-text-muted);
			margin-right: var(--pad-xs, 0.25rem);
		}

		.run-gap-marker {
			color: var(--color-warning);
		}

		.run-gap-note {
			margin-left: var(--pad-xs, 0.25rem);
			font-style: italic;
		}
	}
</style>
