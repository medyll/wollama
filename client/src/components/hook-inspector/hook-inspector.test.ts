import { render } from '@testing-library/svelte';
import HookInspector from './hook-inspector.svelte';
import { hooks } from '$lib/stores/hooks';

test('renders Hook Inspector', () => {
  const { getByText } = render(HookInspector);
  expect(getByText('Hook Inspector')).toBeTruthy();
});

test('shows no selection message', () => {
  const { getByText } = render(HookInspector);
  expect(getByText('Select a hook to inspect details')).toBeTruthy();
});
