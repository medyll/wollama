import { translations } from '../../locales/translations.js';

export class UserState {
    nickname = $state('');
    isConfigured = $state(false);
    
    // Auth State
    isAuthenticated = $state(false);
    uid = $state<string | null>(null);
    email = $state<string | null>(null);
    photoURL = $state<string | null>(null);
    token = $state<string | null>(null);
    password = $state<string | null>(null); // Simple local protection
    isSecured = $state(false);

    preferences = $state({
        serverUrl: 'http://localhost:3000',
        locale: 'en',
        theme: 'light',
        defaultModel: 'mistral:latest',
        defaultCompanion: '1', // Default to General Assistant
        defaultTemperature: 0.7,
        auto_play_audio: false,
        audioInputId: '',
        audioOutputId: ''
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

                this.password = data.password || null;
                this.isSecured = !!this.password;

                // Merge stored preferences with defaults
                if (data.preferences) {
                    // Use Object.assign to update the reactive proxy instead of replacing it
                    Object.assign(this.preferences, data.preferences);
                }
            } else {
                // First start: Detect browser language
                if (typeof navigator !== 'undefined') {
                    const browserLang = navigator.language.split('-')[0];
                    if (browserLang in translations) {
                        this.preferences.locale = browserLang;
                    }
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

    setLocalProtection(password: string) {
        this.password = password;
        this.isSecured = true;
        this.save();
    }

    logout() {
        this.uid = null;
        this.email = null;
        this.photoURL = null;
        this.token = null;
        this.isAuthenticated = false;
        // Keep preferences and nickname? Or full reset?
        // For now, just clear auth
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
                photoURL: this.photoURL,
                password: this.password
            }));
        }
    }

    reset() {
        this.nickname = '';
        this.isConfigured = false;
        this.isAuthenticated = false;
        this.uid = null;
        this.email = null;
        this.photoURL = null;
        this.token = null;
        this.password = null;
        this.isSecured = false;
        
        // Reset preferences to defaults
        this.preferences = {
            serverUrl: 'http://localhost:3000',
            locale: 'en',
            theme: 'light',
            defaultModel: 'mistral:latest',
            defaultCompanion: '1',
            defaultTemperature: 0.7,
            auto_play_audio: false,
            audioInputId: 'default',
            audioOutputId: 'default'
        };

        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('wollama_user');
        }
    }
}

export const userState = new UserState();
