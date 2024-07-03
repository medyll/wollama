<script lang="ts">
    import { IDbFields as DbFields } from '$lib/db/dbFields';
    import { idbQuery, ideo } from '$lib/db/dbQuery';
    import { schemeModel, idbqlState } from '$lib/db/dbSchema';
    import type { TplCollectionName } from '@medyll/idbql';

    interface Props {
        mode: 'create' | 'update' | 'show';
        collection: TplCollectionName;
        data?: Record<string, any>;
        dataId?: any;
        /** fields to show */
        dataFields?: Record<string, any>;
    }
    let { collection, data = {}, dataId, mode }: Props = $props();
    let inputForm = `form-${String(collection)}`;
    let dbFields = new DbFields(schemeModel);
    let formFields = dbFields.parseRawCollection(collection) ?? {};
    let indexName = dbFields.getIndexName(collection);
 

    let qy: any = $derived((dataId && indexName) ? idbqlState[collection].where({ [indexName]: { eq: dataId } }) : {});

    let formData = $state<Record<string, any>>(data);

    if ((mode = 'show')) {
    } else {
    }

    let ds = Object.keys(data).length > 0 ? data : qy[0];

    let onSubmit = async (event: FormDataEvent) => {
        let data = $state.snapshot(formData);
        console.log('formData', formData);
        switch (mode) {
            case 'create':
                if (!dataId) {
                    console.log('create', data);
                    await idbqlState[collection].add(data);
                }
                break;
            case 'update':
                if (dataId) {
                    await idbqlState[collection].update(dataId, data);
                }
                break;
        }
    };
    $inspect(indexName, dataId,qy,ds);
</script>

{#snippet control(value)}
    {#if value.fieldType === 'boolean'}
        <input type="checkbox" form={inputForm} bind:checked={formData[value.fieldName]} name={value.field} />
    {:else if value.fieldType === 'id'}
        <input type="hidden" form={inputForm} name={value.field} value={value.fieldType} />
    {:else if value.fieldType?.startsWith('text')}
        {@render controlText(value)}
    {:else if ['url', 'email', 'number', 'date', 'time', 'datetime'].includes(value.fieldType)}
        {@render input(value.fieldType, value)}
    {:else if value.fieldType === 'phone'}
        {@render input('tel', value)}
    {:else if value.fieldType === 'password'}
        {@render input('password', value)}
    {:else}
        {@render input('text', value)}
    {/if}
{/snippet}
{#snippet controlText(value)}
    {@const variant = value.fieldType.split('text-')[1] ?? value.fieldType}
    {#if variant.trim() == 'text'}
        {@render input('text', value)}
    {:else if variant.trim() == 'long'}
        <textarea
            style="width: 450px"
            bind:value={formData[value.fieldName]}
            form={inputForm}
            rows="3"
            name={value.fieldName}
            class="rounded-md h-24"
            placeholder={value.fieldName}>
            {value.fieldType}
        </textarea>
    {:else}
        {@render input('text', value)}
    {/if}
{/snippet}
{#snippet input(tag: any, value)}
    {#if mode === 'show'}
        {ds?.[value.fieldName]}
    {:else}
        <input
            required={value?.fieldArgs?.includes('required')}
            readonly={value?.fieldArgs?.includes('readonly')}
            form={inputForm}
            bind:value={ds[value.fieldName]}
            type={tag}
            name={value.fieldName}
            placeholder={ds?.[value.fieldName]} />
    {/if}
{/snippet}

<form
    id={inputForm}
    onsubmit={(event) => {
        event.preventDefault();
        // onSubmit(event);
    }}>
</form>

<div class="flex flex-col gap-2" style="width:750px">
    <div style="display:flex" class="  flex-wrap">
        {#each Object.entries(formFields) as [field, value]}
            {@const placeholder = value.fieldType}
            <div class="flex flex-col gap-2 p-2 flex-1" style="min-width:25%">
                <label class="w-20 border-b">{value.fieldName}</label>
                <div>{@render control(value)}</div>
            </div>
        {/each}
    </div>
    <input type="submit" form={inputForm} value="submit" />
</div>
