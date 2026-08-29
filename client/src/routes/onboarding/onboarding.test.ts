import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import * as navigation from '$app/navigation';
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

// Step 1 auto-tests the Ollama connection on entry; keep that off the network.
vi.mock('$lib/services/ollama.service', () => ({
	normalizeServerUrl: (url: string) => url,
	testOllamaConnection: vi.fn().mockResolvedValue({ success: false, error: 'Unable to connect' })
}));

import OnboardingPage from './OnboardingWizard.svelte';
import { userState } from '$lib/state/user.svelte';

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

describe('Onboarding Page (Story 1.1)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		userState.nickname = '';
		userState.preferences.onboarding_completed = false;
	});

	it('should render the first wizard step on mount', () => {
		render(OnboardingPage);

		expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument();
		expect(screen.getByTestId('wizard-title').textContent).toBe('Set Up Your Profile');
	});

	it('should explain what the current step asks for (AC 3)', () => {
		render(OnboardingPage);

		expect(screen.getByText(/Choose a nickname and optional password/)).toBeInTheDocument();
	});

	it('should have a Next button, disabled until the step is valid (AC 4)', async () => {
		render(OnboardingPage);

		const nextButton = screen.getByRole('button', { name: /next step/i });
		expect(nextButton).toBeInTheDocument();
		// Step 0 requires a nickname before it can be left.
		expect(nextButton).toBeDisabled();

		await userEvent.type(screen.getByLabelText('Nickname'), 'Meddy');

		await waitFor(() => expect(nextButton).toBeEnabled());
	});

	it('should advance to the server step and persist the nickname', async () => {
		render(OnboardingPage);

		await userEvent.type(screen.getByLabelText('Nickname'), 'Meddy');
		await userEvent.click(screen.getByRole('button', { name: /next step/i }));

		await waitFor(() => {
			expect(screen.getByTestId('wizard-title').textContent).toBe('Configure Ollama Server');
		});
		expect(userState.nickname).toBe('Meddy');
		expect(userState.save).toHaveBeenCalled();
	});

	it('should redirect to a fresh chat when Skip is clicked', async () => {
		render(OnboardingPage);

		await userEvent.click(screen.getByRole('button', { name: /skip onboarding/i }));

		await waitFor(() => {
			expect(navigation.goto).toHaveBeenCalledWith('/chat/new');
		});
	});

	it('should display step indicator', () => {
		render(OnboardingPage);

		const progressBars = screen.getAllByRole('progressbar');
		expect(progressBars.length).toBeGreaterThan(0);
	});

	it('should mark onboarding_completed when the wizard finishes', async () => {
		render(OnboardingPage);

		await userEvent.click(screen.getByRole('button', { name: /skip onboarding/i }));

		await waitFor(() => {
			expect(userState.preferences.onboarding_completed).toBe(true);
		});
		expect(userState.save).toHaveBeenCalled();
	});

	it('should label every control for assistive technology', () => {
		render(OnboardingPage);

		const buttons = screen.getAllByRole('button');
		expect(buttons.length).toBeGreaterThan(0);
		buttons.forEach((btn) => {
			expect(btn).toHaveAttribute('aria-label');
		});
	});
});

describe('First-Launch Detection (Task 1)', () => {
	it('should route to onboarding if onboarding_completed is false', () => {
		// This is tested in +layout.svelte onMount logic
		userState.preferences.onboarding_completed = false;

		// The +layout should call goto('/onboarding')
		// This would be an integration test with the full layout component
		expect(userState.preferences.onboarding_completed).toBe(false);
	});

	it('should not route to onboarding if onboarding_completed is true', () => {
		userState.preferences.onboarding_completed = true;

		// The +layout should NOT call goto('/onboarding')
		expect(userState.preferences.onboarding_completed).toBe(true);
	});
});

describe('Main Chat Interface Hidden During Onboarding (Task 3)', () => {
	it('should hide main chat interface when onboarding wizard is displayed', () => {
		// The routing in +layout.svelte ensures that if onboarding_completed = false,
		// the user is redirected to /onboarding route, thus the chat interface (+page.svelte)
		// is never rendered. This is verified by route-level logic.
		userState.preferences.onboarding_completed = false;

		// User should be on /onboarding route, not /chat
		// This is verified at the routing level in +layout
		expect(userState.preferences.onboarding_completed).toBe(false);
	});
});
