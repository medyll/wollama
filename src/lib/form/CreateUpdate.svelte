<script lang="ts">
    import { dbFields } from '$lib/db/dbFields';
    import { idbQuery, ideo } from '$lib/db/dbQuery';
    import { schemeModel, idbqlState } from '$lib/db/dbSchema';
    import type { IdbqModelCollectionName } from '@medyll/idbql';

    interface Props {
        mode: 'create' | 'update' | 'show';
        collection: IdbqModelCollectionName;
        data?: Record<string, any>;
        dataId?: any;
        /** fields to show */
        dataFields?: Record<string, any>;
    }
    let { collection, data = {}, dataId, mode }: Props = $props();
    let inputForm = `form-${String(collection)}`;
    let test = new dbFields(schemeModel);
    let formFields = test.parseRawCollection(collection) ?? {};

    let formData = $state<Record<string, any>>(data);

    let qy = idbqlState[collection as string].get(dataId)

    let onSubmit = async (event: FormDataEvent) => {
        let data = $state.snapshot(formData);
        console.log('formData', formData);
        switch (mode) {
            case 'create':
                if (!dataId) {
                    console.log('create', data);
                    await idbqlState[collection as string].add(data);
                }
                break;
            case 'update':
                if (dataId) {
                    await idbqlState[collection as string].update(dataId, data);
                }
                break;
        }
    };
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
    {#if mode === 'show'}s
    {formData[value.fieldName]}
    {:else  }
        <input
            required={value?.fieldArgs?.includes('required')}
            readonly={value?.fieldArgs?.includes('readonly')}
            form={inputForm}
            bind:value={formData[value.fieldName]}
            type={tag}
            name={value.fieldName}
            placeholder={value.fieldName} />
    {/if}
{/snippet}

<form
    id={inputForm}
    onsubmit={(event) => {
        event.preventDefault();
        onSubmit(event);
    }}>
</form>

<div class="flex flex-col gap-2" style="width:750px">
    <div style="display:flex" class="  flex-wrap">
        {#each Object.entries(formFields) as [field, value]}
            {@const placeholder = value.fieldType}
            <div class="flex flex-col gap-2 p-2   flex-1" style="min-width:25%">
                <label class="w-20 border-b">{value.fieldName}</label>
                <div>{@render control(value)}</div>
            </div>
        {/each}
    </div>
    <input type="submit" form={inputForm} value="submit" />
</div>
