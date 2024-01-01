<script lang="ts">
	import { notifierState } from '$lib/stores/notifications';
	import Icon from '@iconify/svelte';
</script>

<div class="gauge tr fixed flex flex-col gap-2 w-96 p-4 z-50">
	{#each Object.values($notifierState) as notification, idx}
		<div class="{notification.status} w-full flex-align-middle gap-2 theme-bg rounded-md p-1 theme-border shadow-sm">
			<div class="">
				<Icon icon="mdi:information-outline" style="font-size:1.6em" />
			</div>
			<div class="flex-1">
				<div class="notification__message">{notification.message}</div>
				<div class="soft-title">{notification.status}</div>
			</div>
			<div class="notification__close">
				<button class="iconButton" on:click={() => notifierState.delete(notification.id)}>
					<Icon icon="mdi:close" style="font-size:1.6em" />
				</button>
			</div>
		</div>
	{/each}
</div>

<style>
	.gauge {
		left: 50%;
		transform: translate(-50%, 0);
	}
	.success {
		@apply bg-green-200 text-green-700;
	}
	.error {
		@apply bg-red-200 text-red-700;
	}
	.info {
		@apply bg-blue-200 text-blue-700;
	}
	.warning {
		@apply bg-yellow-200 text-yellow-700;
	}
</style>
