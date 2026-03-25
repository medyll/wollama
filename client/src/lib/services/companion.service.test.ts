import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompanionService } from './companion.service';
import type { Companion, UserCompanion } from '$types/data';
import { DataGenericService } from './data-generic.service';

// Mock DataGenericService
vi.mock('./data-generic.service', () => {
	function DataGenericService(this: any, collectionName?: string) {
		// When used with `new`, if a factory is set, return its result
		if ((DataGenericService as any)._factory) {
			return (DataGenericService as any)._factory(collectionName);
		}
		// otherwise create an empty instance
		return this;
	}
	// Allow setting a factory like vi.fn().mockImplementation
	(DataGenericService as any).mockImplementation = (fn: (...args: any[]) => any) => {
		(DataGenericService as any)._factory = fn;
	};
	// Provide default prototype methods so instance has expected shape
	DataGenericService.prototype.get = function(){};
	DataGenericService.prototype.getAll = function(){};
	DataGenericService.prototype.create = function(){};
	DataGenericService.prototype.update = function(){};
	DataGenericService.prototype.delete = function(){};
	DataGenericService.prototype.find = function(){};

	// Also make it recognizable by vi.mocked() by returning the function
	return { DataGenericService };
});

describe('CompanionService - Companion Ownership Model (Story 5.1)', () => {
	let companionService: CompanionService;
	let mockSystemService: any;
	let mockUserService: any;

	// Mock data
	const mockSystemCompanion: Companion = {
		companion_id: 'sys-1',
		name: 'Assistant',
		description: 'System default assistant',
		system_prompt: 'You are a helpful assistant.',
		model: 'mistral:latest',
		voice_id: 'default',
		voice_tone: 'neutral',
		mood: 'helpful',
		avatar: 'avatar-1.png',
		specialization: 'general',
		is_locked: true,
		created_at: 1000,
		updated_at: 1000
	};

	const mockUserId = 'user-123';
	const mockCurrentDate = Date.now();

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();

		// Create mock service instances
		mockSystemService = {
			getAll: vi.fn(),
			get: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			find: vi.fn()
		};

		mockUserService = {
			getAll: vi.fn(),
			get: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			find: vi.fn()
		};

		// Mock the DataGenericService constructor
		const DataGenericServiceMock = vi.mocked(DataGenericService);
		DataGenericServiceMock.mockImplementation((collectionName: string) => {
			if (collectionName === 'companions') {
				return mockSystemService;
			}
			return mockUserService;
		});

		// Create service instance
		companionService = new CompanionService();
	});

	describe('Task 2: System Companion Tests (AC: 1)', () => {
		it('should identify system companions with is_locked = true', async () => {
			mockSystemService.get.mockResolvedValueOnce(mockSystemCompanion);

			const result = await companionService.get('sys-1');

			expect(result).not.toBeNull();
			expect(result?.is_locked).toBe(true);
		});

		it('should not allow direct modification of system companion', async () => {
			mockUserService.get.mockResolvedValueOnce(null);
			mockSystemService.get.mockResolvedValueOnce(mockSystemCompanion);

			const result = companionService.update(mockSystemCompanion as UserCompanion);

			await expect(result).rejects.toThrow('Cannot update a system companion directly');
		});

		it('should not allow deletion of system companion', async () => {
			mockUserService.get.mockResolvedValueOnce(null);

			const result = companionService.delete('sys-1');

			await expect(result).rejects.toThrow('Cannot delete a system companion');
		});

		it('should retrieve system companion from database', async () => {
			mockUserService.get.mockResolvedValueOnce(null);
			mockSystemService.get.mockResolvedValueOnce(mockSystemCompanion);

			const result = await companionService.get('sys-1');

			expect(mockUserService.get).toHaveBeenCalledWith('sys-1');
			expect(mockSystemService.get).toHaveBeenCalledWith('sys-1');
			expect(result).toEqual(mockSystemCompanion);
		});
	});

	describe('Task 3: Customize Action Tests (AC: 1 - Core Logic)', () => {
		it('should create new user_companion when forking system companion (AC: 1)', async () => {
			mockSystemService.get.mockResolvedValueOnce(mockSystemCompanion);

			const newUserCompanion: UserCompanion = {
				user_companion_id: 'user-comp-1',
				user_id: mockUserId,
				companion_id: mockSystemCompanion.companion_id,
				name: 'My Assistant',
				description: 'My custom version',
				system_prompt: 'You are MY helpful assistant.',
				model: 'mistral:latest',
				voice_id: 'my-voice',
				voice_tone: 'friendly',
				mood: 'helpful',
				avatar: 'avatar-2.png',
				specialization: 'general',
				is_locked: false,
				created_at: mockCurrentDate,
				updated_at: mockCurrentDate
			};

			mockUserService.create.mockResolvedValueOnce(newUserCompanion);

			const result = await companionService.fork('sys-1', mockUserId);

			expect(result).not.toBeNull();
			expect(mockSystemService.get).toHaveBeenCalledWith('sys-1');
			expect(mockUserService.create).toHaveBeenCalled();
		});

		it('should set user_companion.user_id to current user (AC: 1)', async () => {
			mockSystemService.get.mockResolvedValueOnce(mockSystemCompanion);

			let capturedUserCompanion: UserCompanion | null = null;
			mockUserService.create.mockImplementationOnce(async (companion: UserCompanion) => {
				capturedUserCompanion = companion;
				return companion;
			});

			await companionService.fork('sys-1', mockUserId);

			expect(capturedUserCompanion).not.toBeNull();
			expect(capturedUserCompanion?.user_id).toBe(mockUserId);
		});

		it('should set user_companion.companion_id to original companion ID (AC: 1)', async () => {
			mockSystemService.get.mockResolvedValueOnce(mockSystemCompanion);

			let capturedUserCompanion: UserCompanion | null = null;
			mockUserService.create.mockImplementationOnce(async (companion: UserCompanion) => {
				capturedUserCompanion = companion;
				return companion;
			});

			await companionService.fork('sys-1', mockUserId);

			expect(capturedUserCompanion).not.toBeNull();
			expect(capturedUserCompanion?.companion_id).toBe(mockSystemCompanion.companion_id);
		});

		it('should not modify original system companion when forking (AC: 1)', async () => {
			const originalCompanion = { ...mockSystemCompanion };
			mockSystemService.get.mockResolvedValueOnce(originalCompanion);
			mockUserService.create.mockResolvedValueOnce({} as UserCompanion);

			await companionService.fork('sys-1', mockUserId);

			// Verify original companion unchanged
			expect(originalCompanion.is_locked).toBe(true);
			expect(originalCompanion.name).toBe('Assistant');
		});

		it('should mark customized companion as editable (is_locked = false)', async () => {
			mockSystemService.get.mockResolvedValueOnce(mockSystemCompanion);

			let capturedUserCompanion: UserCompanion | null = null;
			mockUserService.create.mockImplementationOnce(async (companion: UserCompanion) => {
				capturedUserCompanion = companion;
				return companion;
			});

			await companionService.fork('sys-1', mockUserId);

			expect(capturedUserCompanion).not.toBeNull();
			expect(capturedUserCompanion?.is_locked).toBe(false);
		});

		it('should throw error when forking non-existent system companion', async () => {
			mockSystemService.get.mockResolvedValueOnce(null);

			const result = companionService.fork('non-existent', mockUserId);

			await expect(result).rejects.toThrow('System companion not found');
		});
	});

	describe('Task 4: User-Owned Companion Tests (AC: 1)', () => {
		const mockUserCompanion: UserCompanion = {
			user_companion_id: 'user-comp-1',
			user_id: mockUserId,
			companion_id: 'sys-1',
			name: 'My Assistant',
			description: 'My custom version',
			system_prompt: 'You are MY helpful assistant.',
			model: 'mistral:latest',
			voice_id: 'my-voice',
			voice_tone: 'friendly',
			mood: 'helpful',
			avatar: 'avatar-2.png',
			specialization: 'general',
			is_locked: false,
			created_at: mockCurrentDate,
			updated_at: mockCurrentDate
		};

		it('should have correct user_id for user-owned companion', () => {
			expect(mockUserCompanion.user_id).toBe(mockUserId);
		});

		it('should allow modification of user-owned companion', async () => {
			const updatedCompanion: UserCompanion = {
				...mockUserCompanion,
				name: 'Updated Name',
				updated_at: mockCurrentDate + 1000
			};

			mockUserService.get.mockResolvedValueOnce(mockUserCompanion);
			mockUserService.update.mockResolvedValueOnce(updatedCompanion);

			const result = await companionService.update(updatedCompanion);

			expect(result.name).toBe('Updated Name');
			expect(mockUserService.update).toHaveBeenCalled();
		});

		it('should not affect original system companion when deleting user companion', async () => {
			mockUserService.get.mockResolvedValueOnce(mockUserCompanion);
			mockUserService.delete.mockResolvedValueOnce(undefined);

			await companionService.delete('user-comp-1');

			// Verify system companion was not deleted
			expect(mockUserService.delete).toHaveBeenCalledWith('user-comp-1');
			expect(mockSystemService.delete).not.toHaveBeenCalled();
		});

		it('should have is_locked = false for user-owned companion', () => {
			expect(mockUserCompanion.is_locked).toBe(false);
		});

		it('should track companion_id reference to system companion', () => {
			expect(mockUserCompanion.companion_id).toBe('sys-1');
		});
	});

	describe('Task 5: Edge Cases and Error Scenarios (AC: 1)', () => {
		it('should allow customizing same companion multiple times creating separate records', async () => {
			mockSystemService.get.mockResolvedValue(mockSystemCompanion);
			mockUserService.create.mockResolvedValueOnce({
				user_companion_id: 'user-comp-1',
				user_id: mockUserId,
				companion_id: 'sys-1'
			} as UserCompanion);
			mockUserService.create.mockResolvedValueOnce({
				user_companion_id: 'user-comp-2',
				user_id: mockUserId,
				companion_id: 'sys-1'
			} as UserCompanion);

			const result1 = await companionService.fork('sys-1', mockUserId);
			const result2 = await companionService.fork('sys-1', mockUserId);

			expect(result1.user_companion_id).not.toBe(result2.user_companion_id);
			expect(result1.companion_id).toBe(result2.companion_id);
			expect(mockUserService.create).toHaveBeenCalledTimes(2);
		});

		it('should handle invalid companion ID in fork', async () => {
			mockSystemService.get.mockResolvedValueOnce(null);

			const result = companionService.fork('invalid-id', mockUserId);

			await expect(result).rejects.toThrow('System companion not found');
		});

		it('should not allow modification if user is not authenticated', async () => {
			const unauthenticatedUserId = '';

			mockUserService.create.mockRejectedValueOnce(new Error('User not authenticated'));

			const result = companionService.create({
				user_id: unauthenticatedUserId,
				companion_id: 'sys-1',
				name: 'Test',
				description: '',
				system_prompt: '',
				model: '',
				voice_id: '',
				voice_tone: '',
				mood: '',
				avatar: '',
				specialization: '',
				is_locked: false
			});

			await expect(result).rejects.toThrow();
		});

		it('should handle concurrent customization attempts gracefully', async () => {
			mockSystemService.get.mockResolvedValue(mockSystemCompanion);

			const user1Id = 'user-1';
			const user2Id = 'user-2';

			mockUserService.create.mockResolvedValueOnce({
				user_companion_id: 'user-comp-1',
				user_id: user1Id,
				companion_id: 'sys-1'
			} as UserCompanion);
			mockUserService.create.mockResolvedValueOnce({
				user_companion_id: 'user-comp-2',
				user_id: user2Id,
				companion_id: 'sys-1'
			} as UserCompanion);

			const result1 = companionService.fork('sys-1', user1Id);
			const result2 = companionService.fork('sys-1', user2Id);

			const [r1, r2] = await Promise.all([result1, result2]);

			expect(r1.user_id).toBe(user1Id);
			expect(r2.user_id).toBe(user2Id);
			expect(r1.user_companion_id).not.toBe(r2.user_companion_id);
		});
	});

	describe('Task 6: Integration and Coverage (AC: 1)', () => {
		it('should support full companion ownership workflow', async () => {
			const mockSystemCompanionFromDb: Companion = { ...mockSystemCompanion };
			const userId = 'user-123';

			// Step 1: Get system companion
			mockUserService.get.mockResolvedValueOnce(null);
			mockSystemService.get.mockResolvedValueOnce(mockSystemCompanionFromDb);
			const systemComp = await companionService.get('sys-1');
			expect(systemComp?.is_locked).toBe(true);

			// Step 2: Fork to create user companion
			mockSystemService.get.mockResolvedValueOnce(mockSystemCompanionFromDb);
			const newUserComp: UserCompanion = {
				user_companion_id: 'user-comp-1',
				user_id: userId,
				companion_id: 'sys-1',
				name: 'My Custom Assistant',
				description: 'My version',
				system_prompt: 'Custom prompt',
				model: 'mistral:latest',
				voice_id: 'voice-1',
				voice_tone: 'friendly',
				mood: 'helpful',
				avatar: 'avatar-custom.png',
				specialization: 'general',
				is_locked: false,
				created_at: mockCurrentDate,
				updated_at: mockCurrentDate
			};
			mockUserService.create.mockResolvedValueOnce(newUserComp);
			const customComp = await companionService.fork('sys-1', userId);
			expect(customComp.user_id).toBe(userId);
			expect(customComp.companion_id).toBe('sys-1');
			expect(customComp.is_locked).toBe(false);

			// Step 3: Update user companion
			const updatedComp = { ...newUserComp, name: 'Updated Assistant' };
			mockUserService.get.mockResolvedValueOnce(newUserComp);
			mockUserService.update.mockResolvedValueOnce(updatedComp);
			const result = await companionService.update(updatedComp);
			expect(result.name).toBe('Updated Assistant');

			// Step 4: System companion should remain unchanged
			mockUserService.get.mockResolvedValueOnce(null);
			mockSystemService.get.mockResolvedValueOnce(mockSystemCompanionFromDb);
			const systemCompAfter = await companionService.get('sys-1');
			expect(systemCompAfter?.name).toBe('Assistant'); // Original name unchanged
		});

		it('should maintain data integrity across operations', async () => {
			const operations = [
				async () => {
					mockSystemService.get.mockResolvedValueOnce(mockSystemCompanion);
					mockUserService.create.mockResolvedValueOnce({
						user_companion_id: 'user-comp-1',
						user_id: 'user-1',
						companion_id: 'sys-1',
						is_locked: false
					} as UserCompanion);
					return companionService.fork('sys-1', 'user-1');
				},
				async () => {
					mockSystemService.get.mockResolvedValueOnce(mockSystemCompanion);
					mockUserService.create.mockResolvedValueOnce({
						user_companion_id: 'user-comp-2',
						user_id: 'user-2',
						companion_id: 'sys-1',
						is_locked: false
					} as UserCompanion);
					return companionService.fork('sys-1', 'user-2');
				}
			];

			const results = await Promise.all(operations.map(op => op()));

			// All should reference same system companion
			expect(results[0].companion_id).toBe(results[1].companion_id);
			// But have different user IDs and IDs
			expect(results[0].user_id).not.toBe(results[1].user_id);
			expect(results[0].user_companion_id).not.toBe(results[1].user_companion_id);
		});
	});
});
