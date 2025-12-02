export class ConnectionState {
    isConnected = $state(true);
    isChecking = $state(false);
    showModal = $state(false);

    setConnected(status: boolean) {
        this.isConnected = status;
    }

    setChecking(status: boolean) {
        this.isChecking = status;
    }

    toggleModal() {
        this.showModal = !this.showModal;
    }
}

export const connectionState = new ConnectionState();
