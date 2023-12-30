export function clickAway(element: HTMLElement) {
	console.log(element);
	document.addEventListener('click', handleClick, true);

	function handleClick(event: MouseEvent) {
		console.log('clickAway', event.target);
		if (!element?.contains(event.target as Node)) {
			console.log('clickAway hide !', element);
			element.dispatchEvent(new CustomEvent<Node>('clickAway', {}));
		}
	}

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}
