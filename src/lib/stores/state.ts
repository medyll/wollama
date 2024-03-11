import { merge } from 'ts-deepmerge';

type ResolverPathType<T> = T extends object
    ? {
          [K in keyof T]: T[K] extends null | undefined ? K & string : `${K & string}${'' extends ResolverPathType<T[K]> ? '' : '.'}${ResolverPathType<T[K]>}`;
      }[keyof T]
    : '';

class StateClass<T = Record<string, any>> {
    private state: T;

    constructor(propertiesObject: T) {
        this.state = $state(propertiesObject);

        $effect(() => {
            for (let key in this.state) {
                if (this.state.hasOwnProperty(key)) {
                    this[key] = this.state[key];
                }
            }
        });

        return this;
    }

    private createObjectByPath<T = Record<string, any>>(path: string, value: any): T {
        const keys: string[] = path.split('.');
        let current: Record<string, any> = {};

        while (keys.length > 1) {
            // @ts-ignore
            const key: keyof typeof obj = keys.shift();
            if (key) {
                current[key] = current[key] || {};
                current = current[key];
            }
        }

        current[keys[0]] = value;
        return current as T;
    }

    put(state: Partial<T> | ResolverPathType<T>) {
        this.state = state as T;
    }
    get(key?: ResolverPathType<T>) {}
    update(key: Partial<T> | ResolverPathType<T>, value: any) {
        if (typeof key === 'object') {
            this.state = merge(this.state, key) as T;
        } else {
            const glo = this.createObjectByPath<T>(key, value);
            this.state = merge(this.state, glo) as T;
        }
    }
}

// track:[]
export function stative(obj: Record<string, any>, cbs: () => void) {
    let objState = $state(obj);
    return new Proxy(objState, {
        apply: () => {
            return $derived.by(() => {
                return true;
            });
        },
    });
}

stative({}, () => {});
