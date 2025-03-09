<!-- 
    Component CreateUpdate :  to open a CreateUpdateShow window for a specific collection.
    Button validate and cancel is in the Window component.
 -->

<script lang="ts" generics="COL = Record<string,any>">
	import { IDbCollections as DbFields, IDbFormValidate } from '$lib/db/dbFields';
	import { idbql, idbqlState, schemeModel } from '$lib/db/dbSchema';
	import type { CreateUpdateProps } from './types';
	import CollectionReverseFks from './CollectionReverseFks.svelte';
	import FieldInput from './timestamp.svelte';

	let {
		collection,
		data = {},
		dataId,
		mode = 'show',
		withData,
		showFields,
		inPlaceEdit,
		displayMode = 'wrap',
		afterCreate,
		showFks = false
	}: CreateUpdateProps = $props();
	let inputForm = `form-${String(collection)}-${mode}`;
	let dbFields = new DbFields(schemeModel);
	let indexName = dbFields.getIndexName(collection);
	let formFields = showFields
		? Object.fromEntries(
				Object.entries(dbFields.parseRawCollection(collection) ?? {}).filter(([key]) => showFields.includes(key))
			)
		: (dbFields.parseRawCollection(collection) ?? {});

	let qy: any = $derived(dataId && indexName ? idbqlState[collection].where({ [indexName]: { eq: dataId } }) : {});

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
			case 'timestamp':
				return Date.now();
			case 'date':
				return new Date().toISOString().split('T')[0];
			case 'datetime':
				return new Date().toISOString();
			case 'time':
				return new Date().toISOString().split('T')[1].split('.')[0];
		}
	}
</script>

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
			<FieldInput
				{collection}
				{fieldName}
				{mode}
				editInPlace={inPlaceEdit === true || (Array.isArray(inPlaceEdit) && inPlaceEdit.includes(fieldName))}
				bind:data={formData}
				{inputForm}
			/>
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

<style lang="postcss">
	@reference "../../styles/references.css";

	:global(.crud) {
		min-width: 32rem;
		padding: 2rem;

		&.wrap {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		&.inline {
			display: flex;
			flex-direction: row;
			gap: 1rem;
		}
	}

	[aria-invalid='true'] {
		background-color: #ffeeee;
		border-color: red;
	}

	.error-message {
		color: red;
		font-size: 0.8em;
		margin-top: 0.2em;
	}
</style>
