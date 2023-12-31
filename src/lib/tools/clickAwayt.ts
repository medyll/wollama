export function clickAway(element: HTMLElement) { 
	document.addEventListener('click', handleClick, true);

	function handleClick(event: MouseEvent) { 
		if (!element?.contains(event.target as Node)) {
			element.dispatchEvent(new CustomEvent<Node>('clickAway', {}));
		}
	}

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}
