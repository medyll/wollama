export class UIState {
    pageTitle = $state('');
    sidebarCollapsed = $state(false);

    setTitle(title: string) {
        this.pageTitle = title;
    }

    clearTitle() {
        this.pageTitle = '';
    }

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }
}

export const uiState = new UIState();
