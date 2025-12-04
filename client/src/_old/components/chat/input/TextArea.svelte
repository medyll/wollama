<script lang="ts">
	import { timeRetry } from '$lib/stores/timeRetry';

	interface ChatInputProps {
		value:        string;
		placeholder?: string;
		form?:        string;
		disabled?:    boolean;
		showCancel?:  boolean;
		requestStop:  string;
		onkeypress?:  any;
		onsubmit?:    any;
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
	}: ChatInputProps = $props();

	let element: HTMLTextAreaElement;

	$effect(() => {
		if (element) {
			element.parentNode.dataset.replicatedValue = value;
		}
	});
</script>

<!-- {value} -->
<div class="flex-align-middle relative flex-1">
	<div class="grower flex-1" data-replicated-value={value}>
		<textarea
			bind:this={element}
			bind:value
			class=" textarea p-3"
			{disabled}
			{form}
			{onkeypress}
			{placeholder}
			rows="3"
			style="border:none"
		></textarea>
	</div>
</div>

<style lang="postcss">
	@reference "../../../styles/references.css";
	.grower {
		display: grid;

		&::after {
			content: attr(data-replicated-value);
			visibility: hidden;
			white-space: pre-wrap;
		}

		textarea.textarea {
			border: none !important;
			font: inherit;
			grid-area: 1 / 1 / 2 / 2;
			outline: none !important;
			resize: none;

			&:focus,
			&:active,
			&:focus-visible,
			&:hover {
				border: none !important;
				box-shadow: none !important;
				outline: none;
			}
		}

		textarea.textarea,
		&::after {
			font: inherit;
			grid-area: 1 / 1 / 2 / 2;
		}
	}
</style>
