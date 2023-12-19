<script lang="ts">
	import { prompter } from '$lib/stores/prompter';
	import Icon from '@iconify/svelte';

	function deleteImage(fileIdx: number) {
		$prompter.images = $prompter.images.splice(fileIdx, 1);
	}
</script>

{#if $prompter?.images?.length > 0}
	<div class="flex justify-center p-2">
		<div class="flex-align-middle px-2 gap-4">
			{#each $prompter.images ?? [] as file, fileIdx}
				<div class="  shadow-xl text-center">
					<img
						src={file.header + ',' + file.base64}
						title={file.name}
						alt="list"
						style="height:100px"
						class="bg-cover rounded-md mx-auto"
					/>
					<button on:click={() => deleteImage(fileIdx)}>
						<Icon icon="mdi:close" style="font-size:1.6em" />
					</button>
				</div>
			{/each}
		</div>
	</div>
{/if}
