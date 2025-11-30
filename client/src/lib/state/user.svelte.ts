export class UserState {
    nickname = $state('');
    isConfigured = $state(false);
    
    preferences = $state({
        serverUrl: 'http://localhost:3000',
        locale: 'en',
        theme: 'light',
        defaultModel: 'mistral',
        defaultTemperature: 0.7
    });

    constructor() {
        // Load from localStorage if available
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('wollama_user');
            if (stored) {
                const data = JSON.parse(stored);
                this.nickname = data.nickname || '';
                this.isConfigured = true;
                
                // Merge stored preferences with defaults
                if (data.preferences) {
                    // Use Object.assign to update the reactive proxy instead of replacing it
                    Object.assign(this.preferences, data.preferences);
                }
            }
        }
    }

    save() {
        this.isConfigured = true;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('wollama_user', JSON.stringify({
                nickname: this.nickname,
                preferences: this.preferences
            }));
        }
    }
}

export const userState = new UserState();
