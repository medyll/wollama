import { userState } from './user.svelte';

export type ContextFile = {
    name: string;
    path: string;
    content: string;
    source: 'user' | 'auto'; // user selected or auto-detected
};

export class ContextState {
    activeFiles = $state<ContextFile[]>([]);
    
    addFile(file: ContextFile) {
        // Avoid duplicates
        if (!this.activeFiles.find(f => f.path === file.path)) {
            this.activeFiles.push(file);
        }
    }

    removeFile(path: string) {
        this.activeFiles = this.activeFiles.filter(f => f.path !== path);
    }

    clear() {
        this.activeFiles = [];
    }
    
    getPayload() {
        return {
            files: $state.snapshot(this.activeFiles),
            profile: $state.snapshot(userState.preferences)
        };
    }
}

export const contextState = new ContextState();
