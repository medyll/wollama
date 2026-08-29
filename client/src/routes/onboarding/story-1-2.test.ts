import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
vi.mock('$app/environment', () => ({ browser: true, dev: true, version: '1.0.0' }));

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

// The wizard auto-advances to the companion step on a successful connection, which
// mounts CompanionSelector — stub the data layer so that transition is inert.
vi.mock('$lib/services/data-generic.service', () => ({
	DataGenericService: class {
		getQuery = vi.fn().mockResolvedValue({
			$: { subscribe: () => ({ unsubscribe: vi.fn() }) }
		});
		find = vi.fn().mockResolvedValue([]);
		create = vi.fn().mockResolvedValue(undefined);
	}
}));

import OnboardingPage from './OnboardingWizard.svelte';
import * as ollamaService from '$lib/services/ollama.service';
import { userState } from '$lib/state/user.svelte';

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock Ollama service
vi.mock('$lib/services/ollama.service', () => ({
	normalizeServerUrl: (url: string) => url,
	testOllamaConnection: vi.fn()
}));

/**
 * Story 1.2 — Ollama server configuration.
 *
 * The wizard is profile-first: step 0 collects a nickname, step 1 configures the
 * server. There is no explicit "Test Connection" button any more — entering step 1
 * probes the server once, and a success auto-advances to the companion step.
 */
describe('Onboarding Page - Story 1.2 (Server URL Configuration)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		userState.preferences.ollamaUrl = 'http://localhost:11434';
		vi.mocked(ollamaService.testOllamaConnection).mockResolvedValue({
			success: false,
			error: 'Unable to connect'
		} as never);
	});

	/** Fills the profile step and moves to the server step. */
	async function goToServerStep() {
		render(OnboardingPage);
		await userEvent.type(screen.getByLabelText('Nickname'), 'Meddy');
		await userEvent.click(screen.getByRole('button', { name: /next step/i }));
		await waitFor(() => {
			expect(screen.getByTestId('wizard-title').textContent).toBe('Configure Ollama Server');
		});
	}

	describe('Step 1: Server URL Input Form', () => {
		it('should display the server URL input on step 1', async () => {
			await goToServerStep();

			const serverUrlInput = screen.getByLabelText('Server URL input');
			expect(serverUrlInput).toBeInTheDocument();
			expect(serverUrlInput).toHaveAttribute('placeholder', 'http://localhost:11434');
		});

		it('should default to the stored Ollama URL', async () => {
			await goToServerStep();

			const serverUrlInput = screen.getByLabelText('Server URL input') as HTMLInputElement;
			expect(serverUrlInput.value).toBe('http://localhost:11434');
		});

		it('should not require a manual Test Connection action', async () => {
			await goToServerStep();

			expect(screen.queryByRole('button', { name: /test connection/i })).toBeNull();
		});
	});

	describe('Step 2: Health Check API Call', () => {
		it('should probe the server automatically when the step opens', async () => {
			await goToServerStep();

			await waitFor(() => {
				expect(ollamaService.testOllamaConnection).toHaveBeenCalledWith('http://localhost:11434');
			});
		});

		it('should probe only once per visit to the step', async () => {
			await goToServerStep();

			await waitFor(() => {
				expect(ollamaService.testOllamaConnection).toHaveBeenCalledTimes(1);
			});
		});

		it('should surface a timeout error', async () => {
			vi.mocked(ollamaService.testOllamaConnection).mockResolvedValue({
				success: false,
				error: 'Connection timeout'
			} as never);

			await goToServerStep();

			expect(await screen.findByText(/timeout/i)).toBeInTheDocument();
		});
	});

	describe('Step 3: Connection Feedback', () => {
		it('should display a success message on a valid connection', async () => {
			vi.mocked(ollamaService.testOllamaConnection).mockResolvedValue({ success: true } as never);

			await goToServerStep();

			expect(await screen.findByTestId('connection-success')).toHaveTextContent(/connected successfully/i);
		});

		it('should display the error and a suggestion on a failed connection', async () => {
			vi.mocked(ollamaService.testOllamaConnection).mockResolvedValue({
				success: false,
				error: 'Connection refused. Make sure Ollama is running.',
				suggestion: 'Start Ollama with `ollama serve`'
			} as never);

			await goToServerStep();

			const errorBox = await screen.findByTestId('connection-error');
			expect(errorBox).toHaveTextContent(/connection refused/i);
			expect(errorBox).toHaveTextContent(/ollama serve/i);
		});

		it('should let the user continue past a failed connection', async () => {
			await goToServerStep();

			await screen.findByTestId('connection-error');
			// Ollama can be configured later, so a failed probe must not trap the user.
			expect(screen.getByRole('button', { name: /next step/i })).toBeEnabled();
		});

		it('should auto-advance to the companion step once connected', async () => {
			vi.mocked(ollamaService.testOllamaConnection).mockResolvedValue({ success: true } as never);

			await goToServerStep();

			await waitFor(
				() => {
					expect(screen.getByTestId('wizard-title').textContent).toBe('Choose Your Companion');
				},
				{ timeout: 2000 }
			);
		});
	});

	describe('Step 4: Persistence', () => {
		it('should store the validated server URL', async () => {
			vi.mocked(ollamaService.testOllamaConnection).mockResolvedValue({ success: true } as never);

			render(OnboardingPage);
			await userEvent.type(screen.getByLabelText('Nickname'), 'Meddy');
			await userEvent.click(screen.getByRole('button', { name: /next step/i }));

			await waitFor(() => {
				expect(userState.preferences.ollamaUrl).toBe('http://localhost:11434');
			});
		});

		it('should leave the stored URL untouched when the probe fails', async () => {
			userState.preferences.ollamaUrl = 'http://previous:11434';

			await goToServerStep();

			await screen.findByTestId('connection-error');
			expect(userState.preferences.ollamaUrl).toBe('http://previous:11434');
		});
	});

	describe('Accessibility', () => {
		it('should label the URL field and announce the connection result', async () => {
			await goToServerStep();

			const serverUrlInput = screen.getByLabelText('Server URL input');
			expect(serverUrlInput).toHaveAttribute('aria-label', 'Server URL input');

			const status = await screen.findByTestId('connection-error');
			expect(status).toHaveAttribute('aria-live', 'polite');
			expect(status).toHaveAttribute('role', 'alert');
		});
	});
});
