import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('$app/environment', () => ({ browser: true, dev: true, version: '1.0.0' }));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$lib/state/user.svelte', () => ({
	userState: {
		uid: 'test-user',
		currentUser: { user_id: 'test-user', username: 'testuser' },
		nickname: '',
		email: null,
		password: null,
		isSecured: false,
		preferences: {
			serverUrl: '',
			ollamaUrl: 'http://localhost:11434',
			onboarding_completed: false
		},
		save: vi.fn(),
		setLocalProtection: vi.fn()
	}
}));

vi.mock('$lib/state/ui.svelte', () => ({
	uiState: {
		setActiveCompanionId: vi.fn()
	}
}));

// A reachable server is what carries the wizard from the server step to the
// companion step, so the probe always succeeds here.
vi.mock('$lib/services/ollama.service', () => ({
	normalizeServerUrl: (url: string) => url,
	testOllamaConnection: vi.fn().mockResolvedValue({ success: true })
}));

const seededCompanions = [
	{
		user_companion_id: 'uc-1',
		user_id: 'test-user',
		companion_id: 'sys-1',
		name: 'General Assistant',
		description: 'A helpful generalist',
		system_prompt: 'You are helpful.',
		model: 'mistral:latest',
		is_locked: false,
		created_at: 1
	},
	{
		user_companion_id: 'uc-2',
		user_id: 'test-user',
		companion_id: 'sys-2',
		name: 'Code Helper',
		description: 'Writes and reviews code',
		system_prompt: 'You are a developer.',
		model: 'codellama:latest',
		is_locked: false,
		created_at: 2
	},
	{
		user_companion_id: 'uc-3',
		user_id: 'test-user',
		companion_id: 'sys-3',
		name: 'Translator',
		description: 'Translates between languages',
		system_prompt: 'You translate.',
		model: 'mistral:latest',
		is_locked: false,
		created_at: 3
	}
];

// CompanionSelector subscribes to a live RxDB query; this stub replays a fixed set
// of documents through the same `query.$` shape.
const companionDocs = { current: seededCompanions };
const createCompanion = vi.fn().mockResolvedValue(undefined);

vi.mock('$lib/services/data-generic.service', () => ({
	DataGenericService: class {
		getQuery = vi.fn().mockResolvedValue({
			$: {
				subscribe: (next: (docs: unknown[]) => void) => {
					next(companionDocs.current.map((companion) => ({ toJSON: () => companion })));
					return { unsubscribe: vi.fn() };
				}
			}
		});
		find = vi.fn().mockResolvedValue(companionDocs.current);
		create = createCompanion;
	}
}));

import OnboardingWizard from './OnboardingWizard.svelte';
import { userState } from '$lib/state/user.svelte';

/** Drives the wizard from the profile step to the companion step. */
async function goToCompanionStep() {
	const result = render(OnboardingWizard);
	await userEvent.type(screen.getByLabelText('Nickname'), 'Meddy');
	await userEvent.click(screen.getByRole('button', { name: /next step/i }));
	await waitFor(
		() => {
			expect(screen.getByTestId('wizard-title').textContent).toBe('Choose Your Companion');
		},
		{ timeout: 2000 }
	);
	return result;
}

describe('Story 2.1 - Display System-Provided Default Companions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		companionDocs.current = seededCompanions;
		userState.preferences.onboarding_completed = false;
	});

	describe('Onboarding Flow with Companion Selector', () => {
		it('AC1: Should display the companion selector as the step after server configuration', async () => {
			await goToCompanionStep();

			expect(await screen.findByTestId('companion-selector')).toBeInTheDocument();
		});

		it('AC2-AC4: Companions should render name, description and origin badge', async () => {
			await goToCompanionStep();

			const cards = await screen.findAllByTestId('companion-card');
			expect(cards).toHaveLength(3);
			expect(cards[0]).toHaveTextContent('General Assistant');
			expect(cards[0]).toHaveTextContent('A helpful generalist');
			// Cards forked from a system companion carry the "Default" badge.
			expect(cards[0]).toHaveTextContent('Default');
		});

		it('Should have 3 steps total: Profile + Server Config + Companion Selection', () => {
			const { container } = render(OnboardingWizard);

			const stepIndicator = container.querySelector('[role="progressbar"]');
			expect(stepIndicator?.getAttribute('aria-valuemax')).toBe('3');
			expect(stepIndicator?.querySelectorAll('span')).toHaveLength(3);
		});

		it('AC5: System companions should be read-only (no Customize button)', async () => {
			await goToCompanionStep();

			const cards = await screen.findAllByTestId('companion-card');
			cards.forEach((card) => {
				expect(card.querySelector('button')).toBeNull();
			});
		});

		it('AC6: Companion cards should be selectable', async () => {
			await goToCompanionStep();

			const cards = await screen.findAllByTestId('companion-card');
			await fireEvent.click(cards[1]);

			await waitFor(() => {
				expect(cards[1]).toHaveAttribute('aria-pressed', 'true');
			});
			expect(cards[0]).toHaveAttribute('aria-pressed', 'false');
		});

		it('AC7: Companion selector should be keyboard accessible', async () => {
			await goToCompanionStep();

			const region = screen.getByRole('region', { name: 'Companion Selection' });
			expect(region).toBeInTheDocument();

			const cards = await screen.findAllByTestId('companion-card');
			expect(cards[0]).toHaveAttribute('tabindex', '0');
			expect(cards[0]).toHaveAttribute('aria-label', 'Select General Assistant companion');

			await fireEvent.keyDown(cards[0], { key: 'Enter' });

			await waitFor(() => {
				expect(cards[0]).toHaveAttribute('aria-pressed', 'true');
			});
		});

		it('Should complete onboarding once a companion is selected', async () => {
			const { goto } = await import('$app/navigation');
			const { uiState } = await import('$lib/state/ui.svelte');

			await goToCompanionStep();

			const cards = await screen.findAllByTestId('companion-card');
			await fireEvent.click(cards[0]);

			const completeBtn = screen.getByRole('button', { name: /complete onboarding/i });
			await waitFor(() => expect(completeBtn).toBeEnabled());
			await userEvent.click(completeBtn);

			await waitFor(() => {
				expect(goto).toHaveBeenCalledWith('/chat/new');
			});
			expect(uiState.setActiveCompanionId).toHaveBeenCalledWith('uc-1');
			expect(userState.preferences.onboarding_completed).toBe(true);
		});

		it('Should let the user skip companion selection entirely', async () => {
			const { goto } = await import('$app/navigation');

			await goToCompanionStep();

			await userEvent.click(screen.getByRole('button', { name: /skip onboarding/i }));

			await waitFor(() => {
				expect(goto).toHaveBeenCalledWith('/chat/new');
			});
		});
	});

	describe('Companion Selector Component Integration', () => {
		it('Should import the default companions when the step opens', async () => {
			// Nothing stored yet, so the wizard seeds the defaults.
			companionDocs.current = [];

			await goToCompanionStep();

			await waitFor(() => {
				expect(createCompanion).toHaveBeenCalled();
			});
		});

		it('Should not re-import when companions already exist', async () => {
			await goToCompanionStep();

			await screen.findAllByTestId('companion-card');
			expect(createCompanion).not.toHaveBeenCalled();
		});

		it('Should show an empty state when no companion is available', async () => {
			companionDocs.current = [];

			await goToCompanionStep();

			expect(await screen.findByText(/no companions available/i)).toBeInTheDocument();
		});
	});

	describe('Routing and Navigation', () => {
		it('Should show step 3 of 3 on the companion step', async () => {
			await goToCompanionStep();

			const indicator = screen.getByRole('progressbar');
			expect(indicator).toHaveAttribute('aria-valuenow', '3');
			expect(indicator).toHaveTextContent('Step 3 of 3');
		});

		it('Should disable the completion button until a companion is selected', async () => {
			await goToCompanionStep();

			expect(screen.getByRole('button', { name: /complete onboarding/i })).toBeDisabled();
		});

		it('Should label the final action "Complete Setup"', async () => {
			await goToCompanionStep();

			expect(screen.getByRole('button', { name: /complete onboarding/i })).toHaveTextContent(/complete setup/i);
		});
	});

	describe('Layout', () => {
		it('Should switch the panel to the companion layout on the final step', async () => {
			const { container } = await goToCompanionStep();

			expect(container.querySelector('onboarding-panel')).toHaveAttribute('data-step', 'companions');
		});
	});
});
