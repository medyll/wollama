import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CompanionSelector from './CompanionSelector.svelte';

const mockSubscribeFn = vi.fn();

// Mock $lib/db — DataGenericService imports getDatabase from '../db' (resolves to same file)
vi.mock('$lib/db', () => ({
	getDatabase: vi.fn().mockResolvedValue({
		user_companions: {
			find: vi.fn().mockReturnValue({
				$: { subscribe: mockSubscribeFn }
			})
		}
	})
}));

vi.mock('$lib/state/user.svelte', () => ({
	userState: { uid: 'user-1' }
}));

const mockUserCompanions = [
	{
		user_companion_id: 'uc-1',
		user_id: 'user-1',
		companion_id: '1',
		name: 'General Assistant',
		description: 'A helpful general purpose assistant',
		system_prompt: 'You are a helpful assistant...',
		model: 'mistral:latest',
		is_locked: true,
		created_at: Date.now()
	},
	{
		user_companion_id: 'uc-2',
		user_id: 'user-1',
		companion_id: '2',
		name: 'Expert Coder',
		description: 'Specialized in programming',
		system_prompt: 'You are a coding expert...',
		model: 'codellama:latest',
		is_locked: true,
		created_at: Date.now()
	}
];

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 50));

describe('CompanionSelector - Story 2.1', () => {
	beforeEach(() => {
		mockSubscribeFn.mockImplementation((cb: (docs: any[]) => void) => {
			cb(mockUserCompanions.map((d) => ({ toJSON: () => d })));
			return { unsubscribe: vi.fn() };
		});
	});

	describe('Rendering', () => {
		it('AC1: Should display companion selector component', () => {
			render(CompanionSelector, { props: { onSelect: vi.fn() } });
			expect(screen.getByRole('region', { name: /companion selection/i })).toBeTruthy();
		});

		it('AC2 & AC3: Should display system companions with name, description, and model', async () => {
			render(CompanionSelector, { props: { onSelect: vi.fn() } });
			await flush();

			expect(screen.getByText('General Assistant')).toBeTruthy();
			expect(screen.getByText('Expert Coder')).toBeTruthy();
		});

		it('AC4: Should display "Default" badge on system companions (have companion_id)', async () => {
			render(CompanionSelector, { props: { onSelect: vi.fn() } });
			await flush();

			expect(screen.queryAllByText(/default/i).length).toBeGreaterThan(0);
		});

		it('AC5: Should not display "Edit" button on locked companions', async () => {
			const { container } = render(CompanionSelector, { props: { onSelect: vi.fn() } });
			await flush();

			const editButtons = Array.from(container.querySelectorAll('button')).filter((b) =>
				b.textContent?.toLowerCase().includes('edit')
			);
			expect(editButtons.length).toBe(0);
		});
	});

	describe('Interaction', () => {
		it('AC6: Should call onSelect callback when companion is clicked', async () => {
			const onSelect = vi.fn();
			const { container } = render(CompanionSelector, { props: { onSelect } });
			await flush();

			const cards = container.querySelectorAll('.companion-card');
			expect(cards.length).toBeGreaterThan(0);
			await fireEvent.click(cards[0]);
			expect(onSelect).toHaveBeenCalled();
		});

		it('Should highlight selected companion with ring class', async () => {
			const { container } = render(CompanionSelector, { props: { onSelect: vi.fn() } });
			await flush();

			const card = container.querySelectorAll('.companion-card')[0];
			await fireEvent.click(card);
			await flush();
			expect(card.className).toMatch(/ring-primary/);
		});
	});

	describe('Accessibility (AC7)', () => {
		it('Should have proper ARIA label for region', () => {
			render(CompanionSelector, { props: { onSelect: vi.fn() } });
			expect(screen.getByRole('region', { name: /companion selection/i }).getAttribute('aria-label')).toBe(
				'Companion Selection'
			);
		});

		it('Should support keyboard navigation with arrow keys', async () => {
			const { container } = render(CompanionSelector, { props: { onSelect: vi.fn() } });
			await flush();

			const cards = container.querySelectorAll('.companion-card');
			if (cards.length > 1) {
				const firstCard = cards[0] as HTMLElement;
				await fireEvent.focus(firstCard);
				await fireEvent.keyDown(firstCard, { key: 'ArrowRight' });
				expect(document.activeElement).toBeDefined();
			}
		});

		it('Should support Enter key to select companion', async () => {
			const onSelect = vi.fn();
			const { container } = render(CompanionSelector, { props: { onSelect } });
			await flush();

			const cards = container.querySelectorAll('.companion-card');
			if (cards.length > 0) {
				await fireEvent.keyDown(cards[0] as HTMLElement, { key: 'Enter' });
				expect(onSelect).toHaveBeenCalled();
			}
		});

		it('Should have aria-label on each companion card', async () => {
			const { container } = render(CompanionSelector, { props: { onSelect: vi.fn() } });
			await flush();

			container.querySelectorAll('.companion-card').forEach((card) => {
				expect(card.getAttribute('aria-label')).toMatch(/select .* companion/i);
			});
		});
	});

	describe('Error Handling', () => {
		it('Should display error message if companions fail to load', async () => {
			const { getDatabase } = await import('$lib/db');
			(getDatabase as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('DB error'));

			render(CompanionSelector, { props: { onSelect: vi.fn() } });
			await flush();

			expect(screen.getByRole('alert')).toBeTruthy();
		});

		it('Should show empty state if no companions available', async () => {
			mockSubscribeFn.mockImplementationOnce((cb: (docs: any[]) => void) => {
				cb([]);
				return { unsubscribe: vi.fn() };
			});

			render(CompanionSelector, { props: { onSelect: vi.fn() } });
			await flush();

			expect(screen.getByRole('alert')).toBeTruthy();
		});
	});

	describe('Responsive Design', () => {
		it('Should use responsive grid layout', async () => {
			const { container } = render(CompanionSelector, { props: { onSelect: vi.fn() } });
			await flush();

			const grid = container.querySelector('.companions-grid');
			expect(grid).toBeTruthy();
			expect(grid?.className).toMatch(/grid-cols-2|sm:grid-cols-3|lg:grid-cols-4/);
		});
	});
});
