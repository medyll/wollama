<script lang="ts">
	import { notifierState } from '$lib/stores/notifications';
	import { Icon } from '@medyll/idae-slotui-svelte';
</script>

<div class="gauge tr fixed z-50 flex w-96 flex-col gap-2 p-4">
	{#each Object.values($notifierState) as notification, idx}
		<div class="line-gap-2 {notification.status} theme-bg theme-border w-full rounded-md p-1 shadow-xs">
			<div class="">
				<Icon icon="mdi:information-outline" style="font-size:1.6em" />
			</div>
			<div class="flex-1">
				<div class="notification__message">{notification.message}</div>
				<div class="soft-title">{notification.status}</div>
			</div>
			<div class="notification__close">
				<button class="aspect-square" on:click={() => notifierState.delete(notification.id)}>
					<Icon icon="mdi:close" style="font-size:1.6em" />
				</button>
			</div>
		</div>
	{/each}
</div>

<style lang="postcss">
	@reference "../../styles/references.css";
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
