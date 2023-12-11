<script lang="ts">

export let title: string | undefined= undefined; 
export let vertical: boolean = false;

</script>

{#if $$slots.input && !title }
    <div class="w-full font-semibold py-2 text-sm">		
        {title}
    </div>
{/if}
<div class="{vertical? 'flex-v': 'flex-align-middle'} gap-2 ">
	<div class="flex-1 font-semibold py-2 text-sm">		
        <slot name="input">{title}</slot>
	</div>
	<div class="{vertical? 'px-2':''}">
		<slot></slot>
	</div>
</div>