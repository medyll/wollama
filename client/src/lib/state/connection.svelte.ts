export class ConnectionState {
	isConnected = $state(true);
	isOllamaConnected = $state(false);
	isChecking = $state(false);
	showModal = $state(false);

	setConnected(status: boolean) {
		this.isConnected = status;
	}

	setOllamaConnected(status: boolean) {
		this.isOllamaConnected = status;
	}

	setChecking(status: boolean) {
		this.isChecking = status;
	}

	toggleModal() {
		this.showModal = !this.showModal;
	}
}

export const connectionState = new ConnectionState();
