<script lang="ts">
    import { chatParams } from '$lib/states/chat.svelte'; 
	import {Icon} from '@medyll/idae-slotui-svelte';

	function deleteImage(fileIdx: number) {
		chatParams.images = undefined;
	}
</script>

{#if chatParams.images}
	<div class="flex   p-2">
		<div class="flex-align-middle px-2 gap-4">
			<div class="  shadow-xl text-center">
				<img src={chatParams.images.dataUri} title={chatParams.images.name} alt="list" style="height:100px" class="bg-cover rounded-md mx-auto" />
				<button on:click={() => deleteImage('fileIdx')}>
					<Icon icon="mdi:close" style="font-size:1.6em" />
				</button>
			</div>
		</div>
	</div>
{/if}
