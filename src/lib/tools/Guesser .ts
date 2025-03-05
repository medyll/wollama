// guesser.ts
import type { TplCollectionName } from '@medyll/idae-idbql';
import { IDbCollections } from '$lib/db/dbFields';

export class Guesser {
	private dbFields: IDbCollections;

	constructor() {
		this.dbFields = new IDbCollections();
	}

	async guessValue(params: {
		collection: TplCollectionName;
		collectionId?: any;
		fieldName: string;
		data: Record<string, any>;
	}) {
		const guessObj = this.buildGuessObject(params);
		// Appel à l'API IA avec guessObj
		/* const response = await fetch('/api/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guessObj),
        });
        return await response.json(); */

		return {};
	}

	private buildGuessObject(params: {
		collection: TplCollectionName;
		collectionId?: any;
		fieldName: string;
		data: Record<string, any>;
	}) {
		const { collection, collectionId, fieldName, data: formData } = params;
		return {
			guessPrompt:       this.buildPrompt(),
			guessFor:          this.buildGuessFor(collection, collectionId, fieldName, formData),
			guessWithFks:      this.buildGuessWithFks(collection, formData),
			guessWithRFks:     this.buildGuessWithRFks(collection, formData),
			guessWithSiblings: this.buildGuessWithSiblings(collection, formData)
		};
	}

	private buildGuessFor(
		collection: TplCollectionName,
		collectionId: any,
		fieldName: string,
		formData: Record<string, any>
	) {
		return [
			{
				collectionId,
				collection,
				fieldName,
				value: formData?.[fieldName]
			}
		];
	}
	private buildPrompt() {
		// ecrire le prompt system pour l'ai
		// tu es un auteur de livre , tu dois trouver une valeur pour le champ fielnNme de collection ayant actuellement cette valeur
		// tu as des metadatas sur les collections liées
	}

	private buildGuessWithRFks(collection: TplCollectionName, formData: Record<string, any>) {
		const guessWithRFks: Array<{ collection: string; fieldName: string; value: any }> = [];

		Object.entries(this.dbFields.parseAllCollections()).forEach(
			([otherCollection, otherFields]) => {
				const otherCollectionTemplate = this.dbFields.getCollection(
					otherCollection as TplCollectionName
				)?.template;
				const otherFks = otherCollectionTemplate?.fks;
				if (otherFks && otherFks[collection]) {
					const rfkField = otherFks[collection].code;
					if (formData[rfkField]) {
						Object.keys(otherFields).forEach((fieldName) => {
							if (formData[fieldName] !== undefined) {
								guessWithRFks.push({
									collection: otherCollection,
									fieldName,
									value:      formData[fieldName]
								});
							}
						});
					}
				}
			}
		);

		return guessWithRFks;
	}

	private buildGuessWithFks(collection: TplCollectionName, formData: Record<string, any>) {
		const collectionTemplate = this.dbFields.getCollection(collection)?.template;
		const fks = collectionTemplate?.fks;
		if (!fks) return [];

		const guessWithFks: Array<{ collection: string; fieldName: string; value: any }> = [];

		Object.entries(fks).forEach(([fkCollection, fkInfo]) => {
			const fkField = fkInfo.code;
			const fkValue = formData?.[fkField];

			if (fkValue) {
				const fkCollectionTemplate = this.dbFields.getCollection(
					fkCollection as TplCollectionName
				)?.template;
				if (fkCollectionTemplate) {
					Object.keys(fkCollectionTemplate.fields).forEach((fieldName) => {
						if (formData[fieldName] !== undefined) {
							guessWithFks.push({
								collection: fkCollection,
								fieldName,
								value:      formData[fieldName]
							});
						}
					});
				}
			}
		});

		return guessWithFks;
	}

	private buildGuessWithSiblings(collection: TplCollectionName, formData: Record<string, any>) {
		const guessWithSiblings: Array<{ collection: string; fieldName: string; value: any }> = [];
		const fks = this.dbFields.getTemplate(collection)?.fks;

		if (fks) {
			Object.entries(fks).forEach(([fkCollection, fkInfo]) => {
				const fkField = fkInfo.code;
				const fkValue = formData[fkField];

				if (fkValue) {
					// Ici, vous devriez implémenter une logique pour récupérer d'autres enregistrements
					// de la même collection ayant la même valeur de clé étrangère
					// Cette partie dépendra de votre système de gestion de base de données
					// Par exemple :
					// const siblings = await this.dbService.getSiblings(collection, fkField, fkValue);
					// siblings.forEach(sibling => {
					//     Object.keys(sibling).forEach(fieldName => {
					//         guessWithSiblings.push({
					//             collection,
					//             fieldName,
					//             value: sibling[fieldName]
					//         });
					//     });
					// });
				}
			});
		}

		return guessWithSiblings;
	}
}
