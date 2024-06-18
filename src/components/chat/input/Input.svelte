<script lang="ts">
    import { timeRetry } from '$lib/stores/timeRetry';
    import Icon from '@iconify/svelte';


    interface Props {
        value: string;
        placeholder?: string;
        form?: string;
        disabled?: boolean;
        showCancel?: boolean;
        requestStop: string;
        onkeypress?: any;
        onsubmit?: any;
    }

    let {
        value = $bindable(),
        placeholder = '',
        form = '',
        disabled = $timeRetry.connectionStatus == 'error',
        showCancel = false,
        requestStop = $bindable(),
        onkeypress = (e: KeyboardEvent) => {},
        onsubmit = (e: Event) => (requestStop = 'request_stop')
    }: Props = $props();

    let element: HTMLTextAreaElement;
  
</script>

<div class="relative flex-align-middle">
    <div class="sides"><slot name="start" /></div>
    <div class="w-full grow-wrap" data-replicated-value={value}>
        <textarea bind:this={element} {disabled} {form} {placeholder} bind:value {onkeypress} rows="1" />
    </div>
    <div class="sides absolute h-full right-0">
        {#if showCancel}
            <button class="w-12" onclick={onsubmit} type="button" {disabled}>
                <Icon icon="mdi:stop" class="md" />
            </button>
        {:else}
            <slot name="end" />
        {/if}
    </div>
</div>

<style lang="postcss" global>
    /* textarea {
		@apply bg-white text-black;
		@apply w-full flex-1 block outline-none py-3 px-2 resize-none;
	} */
    .sides {
        @apply flex flex-row;
    }
    .grow-wrap {
        display: grid;
    }
    .grow-wrap::after {
        content: attr(data-replicated-value) ' ';
        white-space: pre-wrap;
        visibility: hidden;
    }
    .grow-wrap > textarea {
        resize: none;
        overflow: hidden;
    }
    .grow-wrap > textarea,
    .grow-wrap::after {
        /* Identical styling required!! */
        border: none;
        padding: 1rem;
        font: inherit;

        grid-area: 1 / 1 / 2 / 2;
    }
</style>
