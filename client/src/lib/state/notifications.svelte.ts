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
        this.toasts = this.toasts.filter(t => t.id !== id);
    }
    
    setPosition(pos: ToastPosition) {
        this.position = pos;
    }

    // Helpers
    success(message: string, timeout?: number) {
        return this.add(message, 'success', timeout);
    }

    error(message: string, timeout?: number) {
        return this.add(message, 'error', timeout);
    }

    warning(message: string, timeout?: number) {
        return this.add(message, 'warning', timeout);
    }

    info(message: string, timeout?: number) {
        return this.add(message, 'info', timeout);
    }
}

export const toast = new NotificationState();
