export class UserState {
    nickname = $state('');
    isConfigured = $state(false);
    
    // Auth State
    isAuthenticated = $state(false);
    uid = $state<string | null>(null);
    email = $state<string | null>(null);
    photoURL = $state<string | null>(null);
    token = $state<string | null>(null);

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
                
                // Restore Auth State if persisted (be careful with tokens in localstorage in prod)
                if (data.uid) {
                    this.uid = data.uid;
                    this.email = data.email;
                    this.photoURL = data.photoURL;
                    this.isAuthenticated = true;
                }

                // Merge stored preferences with defaults
                if (data.preferences) {
                    // Use Object.assign to update the reactive proxy instead of replacing it
                    Object.assign(this.preferences, data.preferences);
                }
            }
        }
    }

    setAuth(user: { uid: string, email: string | null, photoURL: string | null, token: string }) {
        this.uid = user.uid;
        this.email = user.email;
        this.photoURL = user.photoURL;
        this.token = user.token;
        this.isAuthenticated = true;
        this.save();
    }

    logout() {
        this.uid = null;
        this.email = null;
        this.photoURL = null;
        this.token = null;
        this.isAuthenticated = false;
        this.save();
    }

    save() {
        this.isConfigured = true;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('wollama_user', JSON.stringify({
                nickname: this.nickname,
                preferences: this.preferences,
                uid: this.uid,
                email: this.email,
                photoURL: this.photoURL
            }));
        }
    }
}

export const userState = new UserState();
