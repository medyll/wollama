<!-- Component: CollectionFieldValue.svelte (ancien nom CollectionFieldInput.svelte) -->
<script lang="ts" generics="COL = Record<string,any>">
	// Importation des types et composants nécessaires
	import { IDbCollectionFieldForge, IDbCollectionValues } from '$lib/db/dbFields';
	import type { TplCollectionName } from '@medyll/idae-idbql';
	import { IconButton } from '@medyll/idae-slotui-svelte';
	import { getAllContexts, getContext } from 'svelte';

	interface FieldValueProps {
		collection?:   TplCollectionName;
		collectionId?: any;
		fieldName:     keyof COL;
		data?:         COL;
		mode?:         'show' | 'create' | 'update';
		editInPlace?:  boolean;
		inputForm?:    string;
		showLabel?:    LabelPosition;
		showAiGuess?:  boolean;
	}

	// Déclaration des propriétés du composant avec leurs valeurs par défaut
	let {
		collection = getContext('collection'),
		collectionId,
		fieldName,
		data = $bindable(),
		mode = 'show',
		editInPlace = false,
		inputForm,
		showLabel = true,
		showAiGuess = false
	}: FieldValueProps = $props();

	let _data = getContext('data');

	data = data ?? ({} as COL);

	// Initialisation des valeurs de champ de collection
	let collectionFieldValues = new IDbCollectionValues(collection);
	let inputDataset = collectionFieldValues.getInputDataSet(fieldName, data);

	// Création d'une instance de forge de champ de collection
	const fieldForge = $derived(new IDbCollectionFieldForge(collection, fieldName, data));

	// Effet déclenché lorsque collectionId ou editInPlace change
	$effect(() => {
		collectionId;
		if (editInPlace && mode === 'show') {
			console.log('Edit in place activated for', fieldName);
		}
	});

	// Détermination si le champ est privé
	const isPrivate = $derived(fieldForge.fieldArgs?.includes('private'));

	// Arguments de forge pour le champ
	let forgeArgs = {
		required: fieldForge.fieldArgs?.includes('required'),
		readonly: fieldForge.fieldArgs?.includes('readonly')
	};

	// Arguments finaux pour l'élément de formulaire
	let finalArgs = {
		id:          fieldName,
		name:        fieldName,
		form:        inputForm,
		placeholder: `${fieldName} ${fieldForge.htmlInputType}`,
		...forgeArgs,
		...fieldForge.inputDataSet
	};

	/**
	 * Fonction pour obtenir la position de l'étiquette
	 * @param {LabelPosition} position - Position de l'étiquette
	 * @returns {string} - Position de l'étiquette sous forme de chaîne
	 */
	function getLabelPosition(position: LabelPosition): string {
		if (position === true) return 'above';
		if (position === false) return '';
		return position;
	}

	// Position de l'étiquette dérivée
	const labelPosition = $derived(getLabelPosition(showLabel));

	/**
	 * Fonction pour gérer la suggestion de valeur
	 * @param {string} fieldName - Nom du champ
	 * @param {string} value - Valeur suggérée
	 */
	function handleGuess(fieldName: string, value: string) {
		data[fieldName] = value;
	}

	/**
	 * Fonction pour itérer sur un tableau de données
	 * @param {any[]} data - Tableau de données
	 * @returns {any[]} - Tableau de données itéré
	 */
	function iterateArray(data: any[]): any[] {
		return fieldForge.iterateArrayField(fieldForge.collection, fieldForge.fieldName, data);
	}

	/**
	 * Fonction pour itérer sur un objet de données
	 * @param {Record<string, any>} data - Objet de données
	 * @returns {Record<string, any>} - Objet de données itéré
	 */
	function iterateObject(data: Record<string, any>): Record<string, any> {
		return dbFields.iterateObjectField(fieldForge.collection, fieldForge.fieldName, data);
	}
</script>

{#if !isPrivate}
	<div class="cell relative flex flex-col gap-2 wrapper-{fieldForge.fieldType}">
		{#if fieldForge.fieldType !== 'id' && (labelPosition === 'before' || labelPosition === 'above')}
			<label form={inputForm} for={fieldName} class="field-label {labelPosition}">{fieldName} </label>
		{/if}

		<div class="field-input flex">
			{#if mode === 'show'}
				<div class="flex w-48 gap-2">
					<div class="flex-1" {...inputDataset}>{fieldForge.format}</div>
					<!-- <IconButton width="tiny" onclick={() => console.log('Edit in place for', fieldName)} icon="mdi:pencil" /> -->
				</div>
			{:else if fieldForge.fieldType === 'id'}
				{#if mode !== 'create'}
					<input type="hidden" bind:value={data[fieldName]} {...inputDataset} {...finalArgs} />
				{/if}
			{:else if fieldForge.fieldType === 'boolean'}
				<input type="checkbox" bind:checked={data[fieldName]} {...inputDataset} {...finalArgs} />
			{:else if fieldForge.fieldType?.includes('area')}
				<textarea
					style="width:100%;max-width:100%;"
					bind:value={data[fieldName]}
					rows="3"
					class="input h-24"
					{...inputDataset}
					{...finalArgs}>{data[fieldName]}</textarea
				>
			{:else if fieldForge.fieldType === 'text'}
				<input
					style="width: 100%"
					class="input"
					bind:value={data[fieldName]}
					type={fieldForge.htmlInputType}
					{...inputDataset}
					{...finalArgs}
				/>
			{:else}
				<input
					style="width: 100%"
					class="input"
					bind:value={data[fieldName]}
					type={fieldForge.htmlInputType}
					{...inputDataset}
					{...finalArgs}
				/>
			{/if}
			<!-- <div><CollectionFieldGuess {collection} {collectionId} fieldNames={fieldName} formData={data} onGuess={handleGuess} /></div> -->
		</div>

		{#if labelPosition === 'after' || labelPosition === 'below'}
			<label form={inputForm} for={fieldName} class="field-label {labelPosition}">{fieldName}</label>
		{/if}
	</div>
{/if}

<style lang="postcss">
	@reference "../../styles/references.css";
	.field-label {
		display: block;
		font-weight: bold;
		padding: 0.5rem;
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

	.wrapper-text-tiny {
		width: 110px;
	}

	.wrapper-text-medium {
		width: 370px;
	}

	.wrapper-text-area {
		flex-basis: 100%;
		flex-grow: 1;
		max-width: 100%;
	}

	.wrapper-text-long {
		flex-basis: 100%;
		flex-grow: 1;
		max-width: 100%;
	}
</style>
