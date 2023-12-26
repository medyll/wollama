<script lang="ts">
	import { prompter } from '$lib/stores/prompter';
	import Icon from '@iconify/svelte';

	function deleteImage(fileIdx: number) {
		$prompter.images = undefined
	}
</script>

{#if $prompter?.images }
	<div class="flex justify-center p-2">
		<div class="flex-align-middle px-2 gap-4">
				<div class="  shadow-xl text-center">
					<img
						src={$prompter?.images.dataUri}
						title={$prompter?.images.name}
						alt="list"
						style="height:100px"
						class="bg-cover rounded-md mx-auto"
					/>
					<button on:click={() => deleteImage('fileIdx')}>
						<Icon icon="mdi:close" style="font-size:1.6em" />
					</button>
				</div>
		</div>
	</div>
{/if}
