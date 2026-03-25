// TODO: Re-enable after SvelteKit SSR vs DOM test environment is resolved
import { render } from '@testing-library/svelte';
import ToolCallMessage from './tool-call-message.svelte';

test.skip('renders ToolCallMessage', () => {
  const msg = { toolName: 'echo', toolId: 't1', timestamp: Date.now(), inputs: { q: 'hello' }, outputs: { r: 'hello' } };
  const { getByText } = render(ToolCallMessage, { props: { message: msg } });
  expect(getByText('Tool: echo')).toBeTruthy();
});
