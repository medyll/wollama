<script lang="ts">
	import { chatParamsState } from '$lib/states/chat.svelte';
	import { Icon } from '@medyll/idae-slotui-svelte';

	function deleteImage(fileIdx: number) {
		chatParamsState.images = undefined;
	}
</script>

{#if chatParamsState.images}
	<div class="flex p-2">
		<div class="flex-align-middle gap-4 px-2">
			<div class="  text-center shadow-xl">
				<img
					src={chatParamsState.images.dataUri}
					title={chatParamsState.images.name}
					alt="list"
					style="height:100px"
					class="mx-auto rounded-md bg-cover"
				/>
				<button on:click={() => deleteImage('fileIdx')}>
					<Icon icon="mdi:close" style="font-size:1.6em" />
				</button>
			</div>
		</div>
	</div>
{/if}
