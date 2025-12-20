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

export const uiState = new UIState();
