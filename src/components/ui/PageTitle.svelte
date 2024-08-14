<script lang="ts">
    import { t } from "$lib/stores/i18n";
    import { Icon, type Props } from "@medyll/idae-slotui-svelte";

interface Props {
    title: string;
    addTitle?: string;
    icon: string;
}

    let {title,icon,addTitle}:Props = $props();

</script>
<div class="flex-align-middle justify-between px-5 py-4 gap-4">
    <div class=" "><Icon {icon}   class="md" /></div>
    <div class="flex-1 text-2xl font-medium self-center capitalize">{$t(`${title}`)} {addTitle}</div>
</div>