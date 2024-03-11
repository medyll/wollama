import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { defaultSettings } from '$configuration/configuration';
import { merge } from 'ts-deepmerge';
import type { SettingsType } from '$types/settings';

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

const SYMBOL = Symbol('svelte-state');
const settingState = () => {
    let settings: SettingsType = $state(defaultSettings);

    let dataStoreTimer: NodeJS.Timeout;

    $effect(() => {
        if (browser && settings) {
            storeData(settings);
        }
    });

    function updateObjectByPath(obj: Record<string, any>, path: string, value: any) {
        const keys: (keyof typeof obj)[] = path.split('.');
        let current = structuredClone(obj);

        while (keys.length > 1) {
            // @ts-ignore
            const key: keyof typeof obj = keys.shift();
            current[key] = current[key] || {};
            current = current[key];
        }

        current[keys[0]] = value;

        return current;
    }

    function createObjectByPath<T = Record<string, any>>(path: string, value: any): T {
        const keys: string[] = path.split('.');
        let current: Record<string, any> = {};

        while (keys.length > 1) {
            // @ts-ignore
            const key: keyof typeof obj = keys.shift();
            current[key] = current[key] || {};
            current = current[key];
        }

        current[keys[0]] = value;
        return current as T;
    }

    function initSettings() {
        if (browser) {
            const actualSettings = JSON.parse(localStorage.getItem('settings') ?? '{}');
            settings = actualSettings;
        }
    }

    function storeData(currentStore: SettingsType) {
        clearTimeout(dataStoreTimer);
        dataStoreTimer = setTimeout(() => {
            if (browser) {
                localStorage.settings = JSON.stringify(currentStore);
                localStorage.theme = currentStore.theme;
            }
        }, 500);
    }

    initSettings();

    return {
        ...settings,
        set: function (key: Partial<SettingsType> | ResolverPathType<SettingsType>, value: any) {},
        get: function (key?: ResolverPathType<SettingsType>) {},
        update: function (key: Partial<SettingsType> | ResolverPathType<SettingsType>, value: any) {
            if (typeof key === 'object') {
                settings = merge(settings, key);
            } else {
                const glo = createObjectByPath<SettingsType>(key, value);
                settings = merge(settings, glo);
            }
        },
    };
};

export const settings = settingStore();

export const showSettings = writable<boolean>(false);
