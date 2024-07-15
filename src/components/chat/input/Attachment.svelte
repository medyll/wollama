<script lang="ts">
    import type { MessageImageType } from '$types/db';
    import Icon from '@iconify/svelte';
    import { Button } from '@medyll/slot-ui';

    interface Props {
        disabled?: boolean;
        form?: string;
        imageFile: MessageImageType | undefined;
    }

    let { disabled = false, form = '', imageFile = $bindable(), ...rest }: Props = $props();

    let fileinput: HTMLInputElement;

    const onFileSelected = (e: any) => {
        let image = e.target.files[0];
        let reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = (e) => {
            if (e?.target?.result) {
                imageFile = {
                    base64: e?.target?.result?.toString().split(',')[1],
                    dataUri: e?.target?.result?.toString(),
                    header: e?.target?.result?.toString().split(',')[0],
                    name: image.name,
                    type: 'image',
                };
            }
        };
    };
</script>

<Button
    onclick={() => {
        fileinput.click();
    }}
    tall="tiny"
    type="button"
    form="prompt-form"
    class="mx-auto"
    width="auto"
    icon="heroicons:paper-clip-solid"
    variant="naked"
	value="Attach"
    {disabled}
    {...rest}>
</Button>

<input type="file" {form} accept=".jpg, .jpeg, .png" hidden onchange={(e) => onFileSelected(e)} bind:this={fileinput} />
