export class UserState {
    nickname = $state('');
    serverUrl = $state('http://localhost:3000');
    locale = $state('en');
    isConfigured = $state(false);

    constructor() {
        // Load from localStorage if available
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('wollama_user');
            if (stored) {
                const data = JSON.parse(stored);
                this.nickname = data.nickname;
                this.serverUrl = data.serverUrl;
                this.locale = data.locale || 'en';
                this.isConfigured = true;
            }
        }
    }

    save() {
        this.isConfigured = true;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('wollama_user', JSON.stringify({
                nickname: this.nickname,
                serverUrl: this.serverUrl,
                locale: this.locale
            }));
        }
    }
}

export const userState = new UserState();
