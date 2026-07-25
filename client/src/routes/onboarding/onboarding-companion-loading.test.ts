import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createMock, findMock, getQueryMock, gotoMock, saveMock } = vi.hoisted(() => ({
	createMock: vi.fn().mockResolvedValue(undefined),
	findMock: vi.fn().mockResolvedValue([]),
	getQueryMock: vi.fn().mockResolvedValue({
		$: {
			subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
		}
	}),
	gotoMock: vi.fn(),
	saveMock: vi.fn()
}));

vi.mock('$app/navigation', () => ({ goto: gotoMock }));

vi.mock('$lib/services/ollama.service', () => ({
	normalizeServerUrl: (url: string) => url,
	testOllamaConnection: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('$lib/services/data-generic.service', () => ({
	DataGenericService: class {
		find = findMock;
		create = createMock;
		getQuery = getQueryMock;
	}
}));

vi.mock('$lib/state/user.svelte', () => ({
	userState: {
		nickname: '',
		uid: 'user-1',
		email: null,
		password: null,
		isSecured: false,
		preferences: {
			ollamaUrl: 'http://localhost:11434',
			onboarding_completed: false
		},
		save: saveMock,
		setLocalProtection: vi.fn()
	}
}));

vi.mock('$lib/state/ui.svelte', () => ({
	uiState: { setActiveCompanionId: vi.fn() }
}));

import OnboardingWizard from './OnboardingWizard.svelte';

describe('Onboarding companion loading', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('imports companions once and keeps Skip responsive while the list is loading', async () => {
		render(OnboardingWizard);

		await fireEvent.input(screen.getByLabelText('Nickname'), { target: { value: 'Meddy' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Next step' }));

		await waitFor(() => expect(screen.getByTestId('wizard-title').textContent).toBe('Choose Your Companion'), {
			timeout: 1500
		});
		await waitFor(() => expect(createMock).toHaveBeenCalled());

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(findMock).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('status').textContent).toContain('Loading companions');

		await fireEvent.click(screen.getByRole('button', { name: 'Skip onboarding' }));

		expect(gotoMock).toHaveBeenCalledWith('/chat/new');
	});
});
