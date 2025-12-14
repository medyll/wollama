export class UIState {
	pageTitle = $state('');
	sidebarCollapsed = $state(false);
	sidebarOpen = $state(true);
	isAudioPlaying = $state(false);

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
}

export const uiState = new UIState();
