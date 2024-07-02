<script lang="ts">
    import { Button } from '@medyll/slot-ui';
import type { LayoutData } from './$types';
    
    export let data: LayoutData;
</script>
<div>
<Button width="auto" icon="ep:files" value="ui.explore"   />
</div>
<slot />