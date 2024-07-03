<script lang="ts">
    import { idbqlState } from '$lib/db/dbSchema';

    let agentList = $derived(idbqlState.agent.getAll())
   
</script> 
{#each agentList as  agent}
<div title={agent.code}>{agent.id}</div>   
{/each}
