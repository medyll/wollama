import { browser } from '$app/environment';
import { OllamaOptionsDefaults } from '$configuration/configuration';
import type { OllOptionsType } from '$types/ollama';
import { writable } from 'svelte/store';

function ollamaOptionStoreBuild() {
    const store = writable<OllOptionsType>({} as OllOptionsType);

    store.subscribe((o) => {
        if (browser) {
            localStorage.ollamaOptions = JSON.stringify(o);
        }
    });

    function init(values: Partial<OllOptionsType> = {}) {
        if (browser) {
            const storeOptions = JSON.parse(localStorage.getItem('ollamaOptions') ?? '{}');
            const options: OllOptionsType = Object.keys(OllamaOptionsDefaults).reduce((acc: Partial<OllOptionsType>, key) => {
                acc[key] = OllamaOptionsDefaults[key].default ?? null;
                // console.log(key, acc[key]);
                return acc;
            }, {});

            store.set({ ...storeOptions, ...options, ...values });
        }
    }

    function resetParam(param: keyof OllOptionsType) {
        store.update((n) => {
            const newSettings = { ...n, [param]: OllamaOptionsDefaults[param].default ?? null };
            return newSettings;
        });
    }

    function resetAll() {
        localStorage.ollamaOptions = JSON.stringify({});
        const options: OllOptionsType = Object.keys(OllamaOptionsDefaults).reduce((acc: Partial<OllOptionsType>, key) => {
            acc[key] = OllamaOptionsDefaults[key].default ?? null;
            return acc;
        }, {});
        store.set(options);
    }

    return {
        init,
        resetAll,
        resetParam,
        set: store.set,
        setOption: (key: keyof OllOptionsType, value: any) => {
            store.update((n) => {
                const newSettings = { ...n, [key]: value };
                return newSettings;
            });
        },
        subscribe: store.subscribe,
    };
}

export const ollamaApiMainOptionsParams = ollamaOptionStoreBuild();
