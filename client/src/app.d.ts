export {};

type DesktopBackendStatus = {
	url: string;
	status: 'development' | 'stopped' | 'starting' | 'running' | 'stopping' | 'failed';
	error: string | null;
	managed: boolean;
};

declare global {
	interface Window {
		wollamaDesktop?: {
			serverUrl: string | null;
			getBackendStatus: () => Promise<DesktopBackendStatus>;
			restartBackend: () => Promise<DesktopBackendStatus>;
		};
	}
}
declare global {
	namespace App {
		interface PageState {
			settingsOverlay?: boolean;
		}
	}
}

export {};
