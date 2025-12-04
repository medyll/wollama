export class UIState {
    pageTitle = $state('');

    setTitle(title: string) {
        this.pageTitle = title;
    }

    clearTitle() {
        this.pageTitle = '';
    }
}

export const uiState = new UIState();
