function myPlugin() {
	return {
		name: 'my-plugin',

		transform(code, id) {
			if (id.includes('Message.svelte')) console.log(code);
			return {
				code,
				map: null // provide source map if available
			};
		}
	};
}

export { myPlugin };
