/** Chrome-level UI state: page title, sidebar, audio indicator, active companion. */
export class UIState {
	pageTitle = $state('');
	sidebarCollapsed = $state(false);
	sidebarOpen = $state(true);
	isAudioPlaying = $state(false);
	activeCompanionId = $state<string | undefined>(undefined);

	setTitle(title: string) {
		this.pageTitle = title;
	}

	clearTitle() {
		this.pageTitle = '';
	}

	toggleSidebar() {
		this.sidebarCollapsed = !this.sidebarCollapsed;
	}

	toggleSidebarVisibility() {
		this.sidebarOpen = !this.sidebarOpen;
	}

	setAudioPlaying(playing: boolean) {
		this.isAudioPlaying = playing;
	}

	setActiveCompanionId(id: string | undefined) {
		this.activeCompanionId = id;
	}
}

/** App-wide UI state. */
export const uiState = new UIState();
