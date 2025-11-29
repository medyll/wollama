export class UserState {
    nickname = $state('');
    serverUrl = $state('http://localhost:3000');
    isConfigured = $state(false);

    constructor() {
        // Load from localStorage if available
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('wollama_user');
            if (stored) {
                const data = JSON.parse(stored);
                this.nickname = data.nickname;
                this.serverUrl = data.serverUrl;
                this.isConfigured = true;
            }
        }
    }

    save() {
        this.isConfigured = true;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('wollama_user', JSON.stringify({
                nickname: this.nickname,
                serverUrl: this.serverUrl
            }));
        }
    }
}

export const userState = new UserState();
