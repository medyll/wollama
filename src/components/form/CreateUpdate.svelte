<!-- 
    Component to open a CreateUpdateShow window for a specific collection.
    Button validate and cancel is in the Window component.
    D:\boulot\python\wollama\src\components\form\CreateUpdate.svelte
 -->

<script lang="ts">
    import { IDbFields as DbFields } from '$lib/db/dbFields';
    import { schemeModel, idbqlState } from '$lib/db/dbSchema';
    import { IconButton } from '@medyll/slot-ui';
    import FieldInPlace from './FieldInPlace.svelte';
    import type { CreateUpdateProps } from './types';

    let { collection, data = {}, dataId, mode = 'show', withData, showFields, inPlaceEdit, displayMode = 'wrap' }: CreateUpdateProps = $props();
    let inputForm = `form-${String(collection)}`;
    let dbFields = new DbFields(schemeModel);
    let indexName = dbFields.getIndexName(collection);
    let formFields = showFields
        ? Object.fromEntries(Object.entries(dbFields.parseRawCollection(collection) ?? {}).filter(([key]) => showFields.includes(key)))
        : dbFields.parseRawCollection(collection) ?? {};

        $inspect(formFields)

    let qy: any = $derived(dataId && indexName ? idbqlState[collection].where({ [indexName]: { eq: dataId } }) : {});

    let formData = $state<Record<string, any>>({ ...data, ...withData, ...$state.snapshot(qy)[0] });

    let ds = Object.keys(data).length > 0 ? data : qy[0];

    export const submit = async (event: FormDataEvent) => {
        let datadb = $state.snapshot(formData);
        switch (mode) {
            case 'create':
                if (!dataId) {
                    console.log('create', { ...datadb, ...withData });
                    await idbqlState[collection].add({ ...datadb, ...withData });
                }
                break;
            case 'update':
                if (dataId) {
                    await idbqlState[collection].update(dataId, datadb);
                }
                break;
        }
    };
</script>

{#snippet control(value, inputMode)}
    {#if value.fieldType === 'boolean'}
        <input type="checkbox" form={inputForm} bind:checked={formData[value.fieldName]} name={value.field} />
    {:else if value.fieldType === 'id'}
        <input type="hidden" form={inputForm} name={value.field} value={value.fieldType} />
    {:else if value.fieldType?.startsWith('text')}
        {@render controlText(value, inputMode)}
    {:else if ['url', 'email', 'number', 'date', 'time', 'datetime'].includes(value.fieldType)}
        {@render input(value.fieldType, value, inputMode)}
    {:else if value.fieldType === 'phone'}
        {@render input('tel', value, inputMode)}
    {:else if value.fieldType === 'password'}
        {@render input('password', value, inputMode)}
    {:else}
        {@render input('text', value, inputMode)}
    {/if}
{/snippet}
{#snippet controlText(value, inputMode)}
    {@const variant = value.fieldType.split('text-')[1] ?? value.fieldType}
    {#if variant.trim() == 'text'}
        {@render input('text', value, inputMode)}
    {:else if variant.trim() == 'long'}
        <textarea
            style="width: 450px"
            bind:value={formData[value.fieldName]}
            form={inputForm}
            rows="3"
            name={value.fieldName}
            class="textfield h-24"
            placeholder={value.fieldName}>
            {formData[value.fieldName]}
        </textarea>
    {:else}
        {@render input('text', value, inputMode)}
    {/if}
{/snippet}
{#snippet input(tag: any, value, inputMode)}
    {#if inputMode === 'show'}
        {formData?.[value.fieldName]}
    {:else}
        <input
            class="textfield"
            required={value?.fieldArgs?.includes('required')}
            readonly={value?.fieldArgs?.includes('readonly')}
            form={inputForm}
            bind:value={formData[value.fieldName]}
            type={tag}
            name={value.fieldName}
            placeholder={formData?.[value?.fieldName] + ' ' + formData?.[value?.fieldType]}
            data-id={dataId}
            data-fieldName={value.fieldName}
            data-collection={collection} />
    {/if}
{/snippet}

<form
    id={inputForm}
    onsubmit={(event) => {
        event.preventDefault();
        // onSubmit(event);
    }}>
</form>

<div class="flex flex-col gap-2" style="max-width:750px">
    <div class="crud {displayMode}"> 
        {#each Object.entries(formFields) as [field, value]} 
            <div class="flex flex-col gap-2 p-2 flex-1" style="min-width:25%">
                <label class="w-20 border-b font-bold">{value.fieldName} {value.fieldType}</label>
                <div class="flex flex-align-middle">
                    <div class="flex-1">{@render control(value, mode)}</div>
                    {#if mode === 'show' && (inPlaceEdit === true || (Array.isArray(inPlaceEdit) && inPlaceEdit.includes(field)))}
                        <IconButton onclick={() => console.log('Edit in place for', field)} icon="mdi:pencil" />
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    .crud {
        &.wrap {
            display: flex;
            flex-wrap: wrap;
        }
        &.vertical {
            display: block;
            flex-wrap: nowrap;
        }
    }
</style>
