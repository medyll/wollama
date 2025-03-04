<script lang="ts">
    import { timeRetry } from '$lib/stores/timeRetry'; 

    interface ChatInputProps {
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
    }: ChatInputProps = $props();

    let element: HTMLTextAreaElement;

    $effect(() => {
        if (element) {
            element.parentNode.dataset.replicatedValue = value;
        }
    });
</script>

<!-- {value} -->
<div class="relative flex-1 flex-align-middle">
    <div class="grower flex-1" data-replicated-value={value}>
        <textarea rows="3" class=" textarea application-chet-textarea p-3" style="border:none" bind:this={element} {disabled} {form} {placeholder} bind:value {onkeypress}></textarea>
    </div>
</div>

<style lang="postcss">
    @reference "../../../styles/all.css";
    .grower {
        display: grid;

        &::after {
            content: attr(data-replicated-value);
            white-space: pre-wrap;
            visibility: hidden;
        }
        textarea.textarea {
            border: none!important;
            outline: none!important;
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
