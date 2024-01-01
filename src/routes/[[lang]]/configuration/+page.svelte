<script lang="ts">
	import Options from '$components/settings/mdl/Options.svelte';
</script>

<absolute w-full h-full />
<fixed text-gray />
<absolute w-full h-full />
<flex gap-2 />
<flex-col gap-2 />

<flex-col:relative gap-2 pad-2>
	<expand>content</expand>
	<shrink>shrink !</shrink>
</flex-col:relative>

<grid gap-2 pad-2>
	<expand>content</expand>
	<shrink>shrink !</shrink>
</grid>

<Options />

<error />

<absolute  /> 


<flex-col />