<!-- path: D:\boulot\python\wollama\src\components\form\CollectionFieldValue .svelte -->
<!-- Component: CollectionFieldValue.svelte (ancien nom CollectionFieldInput.svelte) -->
<script lang="ts">
    import { IDbCollectionFieldForge } from '$lib/db/dbFields';
    import type { TplCollectionName } from '@medyll/idae-idbql';
    import { IconButton } from '@medyll/idae-slotui-svelte';
    import CollectionFieldGuess from './CollectionFieldGuess.svelte';
    type LabelPosition = 'before' | 'above' | 'after' | 'below' | boolean;

    let {
        collection,
        collectionId,
        fieldName,
        data = $bindable(),
        mode,
        editInPlace = false,
        inputForm,
        showLabel = true,
        showAiGuess = false,
    } = $props<{
        collection: TplCollectionName;
        collectionId?: any;
        fieldName: string;
        data: Record<string, any>;
        mode: 'show' | 'create' | 'update';
        editInPlace?: boolean;
        inputForm: string;
        showLabel?: LabelPosition;
        showAiGuess?: boolean;
    }>();

    data = data ? data : {};

    const fieldForge = $derived(new IDbCollectionFieldForge(collection, fieldName, data));

    $effect(() => {
        collectionId;
        if (editInPlace && mode === 'show') {
            console.log('Edit in place activated for', fieldName);
        }
    });

    const isPrivate = $derived(fieldForge.fieldArgs?.includes('private'));

    let forgeArgs = {
        required: fieldForge.fieldArgs?.includes('required'),
        readonly: fieldForge.fieldArgs?.includes('readonly'),
    };

    let finalArgs = {
        id: fieldName,
        name: fieldName,
        form: inputForm,
        placeholder: `${fieldName} ${fieldForge.htmlInputType}`,
        ...forgeArgs,
        ...fieldForge.inputDataSet,
    };

    function getLabelPosition(position: LabelPosition): string {
        if (position === true) return 'above';
        if (position === false) return '';
        return position;
    }

    const labelPosition = $derived(getLabelPosition(showLabel));

    function handleGuess(fieldName: string, value: string) {
        data[fieldName] = value;
    }

    function iterateArray(data: any[]): any[] {
        return fieldForge.iterateArrayField(fieldForge.collection, fieldForge.fieldName, data);
    }

    function iterateObject(data: Record<string, any>): Record<string, any> {
        return dbFields.iterateObjectField(fieldForge.collection, fieldForge.fieldName, data);
    }
</script>

{#if !isPrivate}
    {#if fieldForge.fieldType !== 'id' && (labelPosition === 'before' || labelPosition === 'above')}
        <label form={inputForm} for={fieldName} class="field-label {labelPosition}">{fieldName}</label>
    {/if}

    <div class="flex field-input">
        {#if mode === 'show'}
            <div class="flex gap-2 w-48">
                <div class="flex-1">{fieldForge.format}</div>
                <IconButton width="tiny" onclick={() => console.log('Edit in place for', fieldName)} icon="mdi:pencil" />
            </div>
        {:else if fieldForge.fieldType === 'id'}
            {#if mode !== 'create'}
                <input type="hidden" bind:value={data[fieldName]} {...finalArgs} />
            {/if}
        {:else if fieldForge.fieldType === 'boolean'}
            <input type="checkbox" bind:checked={data[fieldName]} {...finalArgs} />
        {:else if fieldForge.fieldType?.startsWith('text-long') || fieldForge.fieldType?.includes('area')}
            <textarea style="width:100%;max-width:100%;" bind:value={data[fieldName]} rows="3" class="textfield h-24" {...finalArgs}
                >{data[fieldName]}</textarea>
        {:else if fieldForge.fieldType === 'text'}
            <input style="width: 100%" class="textfield" bind:value={data[fieldName]} type={fieldForge.htmlInputType} {...finalArgs} />
        {:else}
            <input style="width: 100%" class="textfield" bind:value={data[fieldName]} type={fieldForge.htmlInputType} {...finalArgs} />
        {/if}
        <!-- <div><CollectionFieldGuess {collection} {collectionId} fieldNames={fieldName} formData={data} onGuess={handleGuess} /></div> -->
    </div>

    {#if labelPosition === 'after' || labelPosition === 'below'}
        <label form={inputForm} for={fieldName} class="field-label {labelPosition}">{fieldName}</label>
    {/if}
{/if}

<style>
    .field-label {
        padding: 0.5rem;
        display: block;
        font-weight: bold;
    }
    .field-label.before,
    .field-label.after {
        display: block;
        margin-right: 0.5em;
    }
    .field-label.above {
        margin-bottom: 0.25em;
    }
    .field-label.below {
        margin-top: 0.25em;
    }
    .field-input {
    }
</style>
