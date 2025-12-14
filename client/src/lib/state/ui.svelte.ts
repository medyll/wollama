export class UIState {
	pageTitle = $state('');
	sidebarCollapsed = $state(false);
	sidebarOpen = $state(true);

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
}

export const uiState = new UIState();
