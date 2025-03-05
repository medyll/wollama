<script lang="ts">
	import { TextField } from '@medyll/idae-slotui-svelte';

	let showOpener: boolean = true;
</script>

{#if showOpener}
	<div class="ss">
		<div class="content-center items-center">
			<div><TextField value="value" /></div>
		</div>
	</div>
{/if}

<slot />

<style lang="postcss">
	@reference "../styles/references.css";
	.ss {
		position: fixed;
		border: 10px solid red;
		left: 0;
		z-index: 3000;
		height: 100%;
		width: 100%;
		align-content: center;
	}
</style>
