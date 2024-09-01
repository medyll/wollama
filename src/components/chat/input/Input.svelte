<script lang="ts">
    import { timeRetry } from '$lib/stores/timeRetry'; 

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
        onsubmit = (e: Event) => (requestStop = 'request_stop'),
    }: Props = $props();

    let element: HTMLTextAreaElement;

    $effect(() => {
        if (element) {
            element.parentNode.dataset.replicatedValue = value;
        }
    });
</script>

<!-- {value} -->
<div class="relative flex-align-middle">
    <div class="grower flex-1" data-replicated-value={value}>
        <textarea rows="3" class="textarea" bind:this={element} {disabled} {form} {placeholder} bind:value {onkeypress}></textarea>
    </div>
</div>

<style lang="scss">
 

    .grower {
        display: grid;

        &::after {
            content: attr(data-replicated-value);
            white-space: pre-wrap;
            visibility: hidden;
        }
        textarea.textarea {
            border: none;
            resize: none; 
            font: inherit;
            grid-area: 1 / 1 / 2 / 2;
            &:focus,
            &:active,
            &:focus-visible,
            &:hover {
                outline: none;
                border: none !important; 
                box-shadow: none !important;
            }
        }

        textarea.textarea,
        &::after { 
            font: inherit;
            grid-area: 1 / 1 / 2 / 2;
        }
    }
</style>
