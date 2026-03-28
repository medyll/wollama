<script lang="ts">
	let { width, height, borderRadius = 'rounded', animated = true } = $props();

	const widthClass = width ? (width.includes('%') ? `w-[${width}]` : `w-[${width}px]`) : 'w-full';
	const heightClass = height ? (height.includes('%') ? `h-[${height}]` : `h-[${height}px]`) : 'h-4';
	const radiusClass =
		borderRadius === 'full' ? 'rounded-full' : borderRadius === 'none' ? '' : ` ${borderRadius}`;
</script>

<div class="skeleton {widthClass} {heightClass}{radiusClass} {animated ? 'animate-pulse' : ''}" />
