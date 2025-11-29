<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/state';

	let { data }: PageData = $props();
	$inspect(page);
</script>
