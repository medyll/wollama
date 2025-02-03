<script lang="ts">
    import { chatParamsState } from '$lib/states/chat.svelte'; 
	import {Icon} from '@medyll/idae-slotui-svelte';

	function deleteImage(fileIdx: number) {
		chatParamsState.images = undefined;
	}
</script>

{#if chatParamsState.images}
	<div class="flex   p-2">
		<div class="flex-align-middle px-2 gap-4">
			<div class="  shadow-xl text-center">
				<img src={chatParamsState.images.dataUri} title={chatParamsState.images.name} alt="list" style="height:100px" class="bg-cover rounded-md mx-auto" />
				<button on:click={() => deleteImage('fileIdx')}>
					<Icon icon="mdi:close" style="font-size:1.6em" />
				</button>
			</div>
		</div>
	</div>
{/if}
