import { DataGenericService } from './data-generic.service';
import type { Companion, UserCompanion } from '$types/data';

export class CompanionService {
	private systemService: DataGenericService<Companion>;
	private userService: DataGenericService<UserCompanion>;

	constructor() {
		this.systemService = new DataGenericService<Companion>('companions');
		this.userService = new DataGenericService<UserCompanion>('user_companions');
	}

	/**
	 * Get all companions available for a user (System + User defined)
	 * User defined companions override system companions if they are forks (have companion_id)
	 */
	async getAll(userId: string): Promise<(Companion | UserCompanion)[]> {
		const systemCompanions = await this.systemService.getAll();
		const userCompanions = await this.userService.find({ user_id: userId });

		// Track which system companions are overridden
		const overriddenIds = new Set<string>();
		for (const uc of userCompanions) {
			if (uc.companion_id) {
				overriddenIds.add(uc.companion_id);
			}
		}

		const result: (Companion | UserCompanion)[] = [];

		// Add system companions that are not overridden
		for (const sc of systemCompanions) {
			if (!overriddenIds.has(sc.companion_id)) {
				result.push(sc);
			}
		}

		// Add all user companions
		result.push(...userCompanions);

		return result;
	}

	async get(id: string): Promise<Companion | UserCompanion | null> {
		// Try user first
		const userComp = await this.userService.get(id);
		if (userComp) return userComp;

		// Then system
		return await this.systemService.get(id);
	}

	async create(companion: Omit<UserCompanion, 'user_companion_id' | 'created_at' | 'updated_at'>): Promise<UserCompanion> {
		const newCompanion: UserCompanion = {
			...companion,
			user_companion_id: crypto.randomUUID(),
			created_at: Date.now(),
			updated_at: Date.now()
		};
		return await this.userService.create(newCompanion);
	}

	async update(companion: UserCompanion): Promise<UserCompanion> {
		// We can only update user companions
		// If the ID belongs to a system companion, we should probably fork it (create a new UserCompanion)
		// But the UI should handle "Edit" by checking if it's a system companion first.

		// Check if it exists in user_companions
		const existing = await this.userService.get(companion.user_companion_id);
		if (existing) {
			return await this.userService.update({
				...companion,
				updated_at: Date.now()
			});
		} else {
			throw new Error('Cannot update a system companion directly. Please fork it first.');
		}
	}

	async delete(id: string): Promise<void> {
		// Can only delete user companions
		const existing = await this.userService.get(id);
		if (existing) {
			await this.userService.delete(id);
		} else {
			throw new Error('Cannot delete a system companion.');
		}
	}

	/**
	 * Fork a system companion to create a user customizable version
	 */
	async fork(systemCompanionId: string, userId: string): Promise<UserCompanion> {
		const systemComp = await this.systemService.get(systemCompanionId);
		if (!systemComp) throw new Error('System companion not found');

		const newCompanion: UserCompanion = {
			...systemComp,
			user_companion_id: crypto.randomUUID(),
			user_id: userId,
			companion_id: systemComp.companion_id,
			created_at: Date.now(),
			updated_at: Date.now()
		};

		return await this.userService.create(newCompanion);
	}
}
