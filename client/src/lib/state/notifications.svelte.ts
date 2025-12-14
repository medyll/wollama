export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	timeout?: number; // ms, 0 for no auto-close
}

class NotificationState {
	toasts = $state<Toast[]>([]);
	position = $state<ToastPosition>('bottom-right');
	isFocused = $state(true);
	isElectron = false;

	constructor() {
		if (typeof window !== 'undefined') {
			// Detect Electron (nodeIntegration: true)
			// @ts-ignore
			this.isElectron = !!(window.process && window.process.versions && window.process.versions.electron);

			window.addEventListener('focus', () => (this.isFocused = true));
			window.addEventListener('blur', () => (this.isFocused = false));

			// Request permission for system notifications if needed
			if (this.isElectron && Notification.permission !== 'granted') {
				Notification.requestPermission();
			}
		}
	}

	add(message: string, type: ToastType = 'info', timeout = 5000) {
		const id = crypto.randomUUID();
		const toast = { id, message, type, timeout };
		this.toasts.push(toast);

		if (timeout > 0) {
			setTimeout(() => {
				this.remove(id);
			}, timeout);
		}
		return id;
	}

	remove(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	setPosition(pos: ToastPosition) {
		this.position = pos;
	}

	/**
	 * Centralized notification method.
	 * - Always shows a Toast.
	 * - If Electron AND (Window Hidden OR Blurred), shows a System Notification.
	 */
	send(message: string, type: ToastType = 'info', timeout = 5000) {
		// 1. Internal Toast
		this.add(message, type, timeout);

		// 2. System Notification (Electron context)
		if (this.isElectron && !this.isFocused) {
			this.notifySystem(type.toUpperCase(), message);
		}
	}

	private notifySystem(title: string, body: string) {
		if (Notification.permission === 'granted') {
			new Notification(title, { body });
		}
	}

	// Helpers
	success(message: string, timeout?: number) {
		return this.send(message, 'success', timeout);
	}

	error(message: string, timeout?: number) {
		return this.send(message, 'error', timeout);
	}

	warning(message: string, timeout?: number) {
		return this.send(message, 'warning', timeout);
	}

	info(message: string, timeout?: number) {
		return this.send(message, 'info', timeout);
	}
}

export const toast = new NotificationState();
