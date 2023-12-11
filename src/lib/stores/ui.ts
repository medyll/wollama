import { writable } from "svelte/store"



type UiStoreType = {
    connectionStatus: 'connected' | 'error' | 'connecting'
}



export function uiStore(){

    const { subscribe, set, update } = writable<UiStoreType>({} as UiStoreType)

    return {
        subscribe,
        set,
        update,
        setConnectionStatus: (status: UiStoreType['connectionStatus']) => update(state => ({...state, connectionStatus: status})),
    }

}


export const ui = uiStore()