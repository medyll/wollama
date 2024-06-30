import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { defaultSettings } from '$configuration/configuration';
import { merge } from 'ts-deepmerge';
import type { SettingsType } from '$types/settings';

/* class Settings {
    settings = $state<SettingsType>(defaultSettings);
    dataStoreTimer!: NodeJS.Timeout;

    constructor() {
        this.initSettings();
        $effect(() => {
            this.storeData();
            console.log('settings changed');
        });
    }

    initSettings() {
        if (browser) {
            const actualSettings = JSON.parse(localStorage.getItem('settings') ?? '{}');
            this.settings = { ...this.settings, ...actualSettings };
        }
    }

    storeData() {
        clearTimeout(this.dataStoreTimer);
        this.dataStoreTimer = setTimeout(() => {
            if (browser) {
                localStorage.settings = JSON.stringify(settings);
                //localStorage.theme = settings?.theme;
            }
        }, 500);
    }

    setSetting(key: keyof SettingsType, value: any) {
        this.settings[key] = value;
    }
}
export const settings = new Settings(); */
// set to indexedDB
const settingStore = () => {
    const { subscribe, set, update } = writable<SettingsType>({
        ...defaultSettings,
    } as SettingsType);

    let currentStore = {} as SettingsType;
    let dataStoreTimer: NodeJS.Timeout;

    subscribe((o) => {
        currentStore = o;
        storeData();
    });

    function initSettings() {
        if (browser) {
            const actualSettings = JSON.parse(localStorage.getItem('settings') ?? '{}');
            update((n) => ({ ...n, ...actualSettings }));
        }
    }

    function storeData() {
        clearTimeout(dataStoreTimer);
        dataStoreTimer = setTimeout(() => {
            if (browser) {
                localStorage.settings = JSON.stringify(currentStore);
                localStorage.theme = currentStore.theme;
            }
        }, 500);
    }

    initSettings();

    function setSetting(key: keyof SettingsType, value: any) {
        update((n) => {
            const newSettings = { ...n, [key]: value };
            return newSettings;
        });
    }

    return {
        initSettings,
        set,
        setSetting,
        subscribe,
        update,
    };
};
type ResolverPathType<T> = T extends object
    ? {
          [K in keyof T]: T[K] extends null | undefined ? K & string : `${K & string}${'' extends ResolverPathType<T[K]> ? '' : '.'}${ResolverPathType<T[K]>}`;
      }[keyof T]
    : '';

export const settings = settingStore();

export const showSettings = writable<boolean>(false);
