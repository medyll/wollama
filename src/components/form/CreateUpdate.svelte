<!-- 
    Component CreateUpdate :  to open a CreateUpdateShow window for a specific collection.
    Button validate and cancel is in the Window component.
    D:\boulot\python\wollama\src\components\form\CreateUpdate.svelte
 -->

<script lang="ts">
	import {
		IDbCollections as DbFields,
		IDbCollectionValues,
		IDbFormValidate
	} from '$lib/db/dbFields';
	import { schemeModel, idbqlState, idbql } from '$lib/db/dbSchema';
	import { IconButton } from '@medyll/idae-slotui-svelte';
	import type { CreateUpdateProps } from './types';
	import CollectionReverseFks from './CollectionReverseFks.svelte';
	import CollectionFieldInput from './CollectionFieldValue.svelte';

	let {
		collection,
		data = {},
		dataId,
		mode = 'show',
		withData,
		showFields,
		inPlaceEdit,
		displayMode = 'wrap',
		showFks = false
	}: CreateUpdateProps = $props();
	let inputForm = `form-${String(collection)}-${mode}`;
	let dbFields = new DbFields(schemeModel);
	let indexName = dbFields.getIndexName(collection);
	let formFields = showFields
		? Object.fromEntries(
				Object.entries(dbFields.parseRawCollection(collection) ?? {}).filter(([key]) =>
					showFields.includes(key)
				)
			)
		: (dbFields.parseRawCollection(collection) ?? {});

	let qy: any = $derived(
		dataId && indexName ? idbqlState[collection].where({ [indexName]: { eq: dataId } }) : {}
	);

	let formData = $state<Record<string, any>>({ ...data, ...withData, ...$state.snapshot(qy)[0] });

	$effect.pre(() => {
		setFormDataDefaultFieldValues();
	});
	let ds = Object.keys(data).length > 0 ? data : qy[0];

	let formValidator = new IDbFormValidate(collection);
	let validationErrors: Record<string, string> = {};

	const validateFormData = (formData: Record<string, any> = {}) => {
		const { isValid, errors } = formValidator.validateForm(formData, {
			ignoreFields: mode == 'create' ? [indexName] : undefined
		});
		validationErrors = errors;

		return isValid;
	};

	export const submit = async (event: FormDataEvent) => {
		if (!validateFormData($state.snapshot(formData))) {
			console.log(validationErrors);

			Object.entries(validationErrors).forEach(([fieldName, errorMessage]) => {
				// Trouver l'élément input correspondant dans le formulaire
				const inputElement = document.querySelector(
					`[name="${fieldName}"][form="${inputForm}"]`
				) as HTMLInputElement | null;
				console.log({ inputElement });

				if (inputElement) {
					// Ajouter une classe d'erreur à l'élément input
					inputElement.classList.add('input-error');

					// Créer ou mettre à jour un message d'erreur
					let errorElement = inputElement.nextElementSibling as HTMLElement;
					if (!errorElement || !errorElement.classList.contains('error-message')) {
						errorElement = document.createElement('div');
						errorElement.classList.add('error-message');
						inputElement.parentNode?.insertBefore(errorElement, inputElement.nextSibling);
					}
					errorElement.textContent = errorMessage;

					// Optionnel : Ajouter un attribut aria pour l'accessibilité
					inputElement.setAttribute('aria-invalid', 'true');
					inputElement.setAttribute('aria-describedby', `error-${fieldName}`);
					errorElement.id = `error-${fieldName}`;
				}
			});
			return;
		}
		let datadb = $state.snapshot(formData);
		switch (mode) {
			case 'create':
				if (!dataId) {
					await idbql[collection].add({ ...datadb, ...withData });
					mode = 'show';
				}
				break;
			case 'update':
				if (dataId) {
					await idbqlState[collection].update(dataId, datadb);
				}
				break;
		}
	};

	function setFormDataDefaultFieldValues() {
		Object.entries(formFields).forEach(([fieldName, field]) => {
			if (formData[fieldName] === undefined && getDefaultValue(field?.fieldType)) {
				formData[fieldName] = getDefaultValue(field?.fieldType);
			}
		});
	}

	// déplacer qqpart ?
	function getDefaultValue(fieldType?: string) {
		if (mode !== 'create') return undefined;
		switch (fieldType) {
			case 'date':
				return new Date().toISOString().split('T')[0];
			case 'datetime':
				return new Date().toISOString();
			case 'time':
				return new Date().toISOString().split('T')[1].split('.')[0];
		}
	}

	let collectionFieldValues = new IDbCollectionValues(collection);

	function formatFieldValue(fieldName: string, value: any) {
		return collectionFieldValues.format(fieldName, { [fieldName]: value });
	}
</script>

{#snippet control(value, inputMode)}
	{#if value?.fieldType?.trim() === 'boolean'}
		{#if value?.fieldType?.trim() === 'boolean' && !value?.fieldArgs?.includes('private')}
			<input
				type="checkbox"
				form={inputForm}
				name={value.field}
				required={value?.fieldArgs?.includes('required')}
				readonly={value?.fieldArgs?.includes('readonly')}
				bind:checked={formData[value.fieldName]}
				{...collectionFieldValues.getInputDataSet(value.fieldName, formData)}
			/>
		{/if}
	{:else if value.fieldType.trim() === 'id'}
		{#if inputMode != 'create'}
			{@render input('hidden', value, inputMode)}
		{/if}
	{:else if value.fieldType?.startsWith('text')}
		{@render controlText(value, inputMode)}
	{:else if ['url', 'email', 'number', 'date', 'time', 'datetime', 'phone', 'text'].includes(value.fieldType.trim())}
		{@render input(value.fieldType, value, inputMode)}
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
	{:else if inputMode !== 'show' && variant.trim() == 'area'}
		<textarea
			style="width:100%;"
			bind:value={formData[value.fieldName]}
			form={inputForm}
			rows="3"
			name={value.fieldName}
			class="textfield h-24"
			placeholder={value.fieldName + ' ' + value?.fieldType}
			{...collectionFieldValues.getInputDataSet(value.fieldName, formData)}
		>
			{formData[value.fieldName]}
		</textarea>
	{:else}
		{@render input('text', value, inputMode)}
	{/if}
{/snippet}
{#snippet input(tag: any, value, inputMode)}
	{#if inputMode === 'show' || value?.fieldArgs?.includes('readonly')}
		{@html collectionFieldValues.format(value.fieldName, formData)}
	{:else}
		<input
			style="width: 100%"
			class="textfield"
			required={value?.fieldArgs?.includes('required')}
			readonly={value?.fieldArgs?.includes('readonly')}
			form={inputForm}
			bind:value={formData[value.fieldName]}
			type={tag.trim()}
			name={value.fieldName}
			placeholder={value?.fieldName + ' ' + value?.fieldType}
			{...collectionFieldValues.getInputDataSet(value.fieldName, formData)}
		/>
	{/if}
{/snippet}

<form
	id={inputForm}
	name={inputForm}
	onchange={(event) => {
		console.log('Form changed', event);
	}}
	onsubmit={(event) => {
		event.preventDefault();
		// onSubmit(event);
	}}
></form>

<div style="width:750px;display:flex;">
	<div class="crud {displayMode}">
		{#each Object.entries(formFields) as [fieldName, fieldInfo]}
			<div
				class="cell flex flex-col gap-2"
				class:hidden={fieldInfo?.fieldArgs?.includes('private')}
			>
				<div class="relative">
					<CollectionFieldInput
						{collection}
						{fieldName}
						{mode}
						editInPlace={inPlaceEdit === true ||
							(Array.isArray(inPlaceEdit) && inPlaceEdit.includes(fieldName))}
						bind:data={formData}
						{inputForm}
					/>
				</div>
			</div>
		{/each}
	</div>
	{#if showFks && (mode === 'show' || mode === 'update')}
		<div>
			<CollectionReverseFks showTitle={true} {collection} collectionId={dataId}>
				{#snippet children({ collection, template })}
					<div class="p2">presentation</div>
				{/snippet}
			</CollectionReverseFks>
		</div>
	{/if}
</div>
<button
	><div class="button-start">svg icon</div>
	<div class="button-central"></div>
	<div class="button-action">icon</div></button
>

<style lang="postcss">
	@reference "../../styles/references.css";
	.input-error {
		border: 10px solid red;
	}
	:global(.crud) {
		padding: 1rem;
		min-width: 32rem;
		&.wrap {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
			.cell {
				max-width: 100%;
				min-width: 30%;
				width: 30%;
				flex: 1 auto;
				:global(.field-input) {
					width: 100%;
					min-height: 2rem;
				}
			}

			.cell:has(textarea) {
				width: 100%;
				:global(textarea) {
					width: 100% !important;
				}
			}
			.cell:has([data-fieldType='text-long']),
			.cell:has([data-fieldType='text-giant']) {
				width: 100%;
			}
			.cell:has([data-fieldType='number']) {
				width: 25%;
			}
		}
		&.vertical {
			display: block;
		}
	}
	[aria-invalid='true'] {
		border-color: red;
		background-color: #ffeeee;
	}

	.error-message {
		color: red;
		font-size: 0.8em;
		margin-top: 0.2em;
	}
</style>
