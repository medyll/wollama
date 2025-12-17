import { DataGenericService } from './data-generic.service';
import type { Companion } from '$types/data';
import { DEFAULT_COMPANIONS } from '../../../../shared/configuration/data-default';

const DEFAULT_LANGUAGES = [
	{ code: 'en', name: 'English', flag: '🇺🇸' },
	{ code: 'fr', name: 'Français', flag: '🇫🇷' },
	{ code: 'es', name: 'Español', flag: '🇪🇸' },
	{ code: 'de', name: 'Deutsch', flag: '🇩🇪' },
	{ code: 'it', name: 'Italiano', flag: '🇮🇹' }
];

export class DataInitializer {
	static async initializeDefaults() {
		await this.initializeData<Companion>('companions', DEFAULT_COMPANIONS, true);
		await this.initializeData<any>('languages', DEFAULT_LANGUAGES, true);
	}

	private static async initializeData<T>(tableName: string, defaultData: Partial<T>[], force: boolean = false) {
		try {
			const service = new DataGenericService<T>(tableName);
			const existing = await service.getAll();

			if (existing.length === 0 || force) {
				console.log(`Initializing default ${tableName}...`);
				const pk = service.PrimaryKey;

				for (const item of defaultData) {
					const id = (item as any)[pk];
					let exists = false;

					if (id) {
						const existingItem = await service.get(id);
						if (existingItem) {
							exists = true;
							if (force) {
								// Update existing item
								await service.update({
									...existingItem,
									...item,
									updated_at: Date.now()
								} as unknown as T);
							}
						}
					}

					if (!exists) {
						await service.create({
							...item,
							created_at: Date.now(),
							updated_at: Date.now()
						} as unknown as T);
					}
				}
			}
		} catch (e) {
			console.error(`Failed to initialize ${tableName}:`, e);
		}
	}
}
