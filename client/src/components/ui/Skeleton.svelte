<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		borderRadius?: string;
		animated?: boolean;
	}

	const { width, height, borderRadius = 'rounded', animated = true } = $props();

	// Use $derived for reactive computation (Svelte 5)
	const widthClass = $derived(width ? (width.includes('%') ? `w-[${width}]` : `w-full`) : 'w-full');
	const heightClass = $derived(height ? (height.includes('rem') || height.includes('px') ? '' : 'h-4') : 'h-4');
	const radiusClass = $derived(
		borderRadius === 'full' ? 'rounded-full' : borderRadius === 'none' ? '' : ` ${borderRadius}`
	);
	
	const customStyle = $derived(height && (height.includes('rem') || height.includes('px')) ? `height: ${height}` : '');
</script>

<div class="skeleton {widthClass} {heightClass}{radiusClass} {animated ? 'animate-pulse' : ''}" style={customStyle}></div>
