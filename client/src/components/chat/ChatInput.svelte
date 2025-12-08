<script lang="ts">
    import { t } from '$lib/state/i18n.svelte';
    import { toast } from '$lib/state/notifications.svelte';
    import Icon from '@iconify/svelte';
    import AudioToggle from '$components/chat/AudioToggle.svelte';
    import DataButton from '$components/ui_data/DataButton.svelte';
    import type { Companion } from '$types/data';

    let { 
        value = $bindable(''), 
        files = $bindable([]), 
        isRecording = false,
        isTranscribing = false,
        currentCompagnon,
        chatId,
        onsend,
        onrecord,
        oncompanionclick
    } = $props<{
        value: string;
        files: string[];
        isRecording: boolean;
        isTranscribing: boolean;
        currentCompagnon: Companion;
        chatId?: string;
        onsend: () => void;
        onrecord: () => void;
        oncompanionclick: () => void;
    }>();

    let fileInput: HTMLInputElement;
    let textareaRef: HTMLTextAreaElement;

    function autoResize(e: Event) {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
    }

    function triggerFileInput() {
        fileInput.click();
    }

    function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            Array.from(input.files).forEach(file => {
                if (file.size > 2 * 1024 * 1024) {
                    toast.error(t('ui.file_too_large', { name: file.name }));
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        const res = e.target.result as string;
                        if (!files.includes(res)) {
                            files = [...files, res];
                        }
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        // Reset input
        input.value = '';
    }

    function removeFile(index: number) {
        files = files.filter((_: any, i: number) => i !== index);
    }

    // Reset height when value is cleared (handled via effect or just rely on autoResize on input)
    $effect(() => {
        if (value === '' && textareaRef) {
            textareaRef.style.height = 'auto';
        }
    });
</script>

<div class="w-full md:max-w-[760px] mx-auto">
    <!-- Top Bar: Companion, Audio, Delete -->
    <div class="flex justify-between items-center mb-2 px-2">
        <!-- Left: Companion -->
        <div 
            class="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity" 
            onclick={oncompanionclick} 
            role="button" 
            tabindex="0" 
            onkeydown={(e) => e.key === 'Enter' && oncompanionclick()}
        >
            <span class="text-xs font-medium opacity-70">{currentCompagnon.name}</span>
            <span class="badge badge-xs badge-ghost opacity-50">{currentCompagnon.model}</span>
        </div>

        <!-- Center: Audio Toggle -->
        <div class="flex justify-center">
            <AudioToggle />
        </div>

        <!-- Right: Delete Chat -->
        <div>
            {#if chatId}
                <DataButton 
                    table="chats" 
                    table_id={chatId} 
                    mode="delete" 
                    confirm={true} 
                />
            {/if}
        </div>
    </div>

    <!-- File Previews -->
    {#if files.length > 0}
        <div class="flex gap-2 p-2 overflow-x-auto mb-2">
            {#each files as file, i}
                <div class="relative group shrink-0">
                    {#if file.startsWith('data:image')}
                        <img src={file} alt="preview" class="h-20 w-20 object-cover rounded-lg border border-base-content/10" />
                    {:else}
                        <div class="h-20 w-20 flex flex-col items-center justify-center bg-base-200 rounded-lg border border-base-content/10">
                            <Icon icon="lucide:file" class="w-8 h-8 opacity-50" />
                            <span class="text-[10px] opacity-50">File</span>
                        </div>
                    {/if}
                    <button 
                        class="btn btn-circle btn-xs btn-error absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md" 
                        onclick={() => removeFile(i)}
                        aria-label={t('ui.remove_file') || 'Remove file'}
                    >✕</button>
                </div>
            {/each}
        </div>
    {/if}

    <div class="bg-base-200 rounded-2xl p-2 border border-base-content/10 focus-within:border-primary transition-colors shadow-sm">
        <textarea 
            bind:this={textareaRef}
            placeholder={t('ui.type_message')} 
            aria-label={t('ui.type_message')}
            class="textarea textarea-ghost w-full resize-none focus:outline-none bg-transparent px-2 py-2 min-h-12 text-base max-h-[50vh] overflow-y-auto" 
            rows="1"
            bind:value={value}
            oninput={autoResize}
            onkeydown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onsend();
                }
            }}
        ></textarea>
        
        <div class="flex justify-between items-center mt-1 px-1">
            <!-- Left: Attachments -->
            <div>
                <input 
                    type="file" 
                    class="hidden" 
                    multiple 
                    bind:this={fileInput} 
                    onchange={handleFileSelect} 
                />
                <button class="btn btn-ghost btn-sm btn-circle" aria-label="Add attachment" onclick={triggerFileInput}>
                    <Icon icon="lucide:paperclip" class="w-5 h-5 opacity-70" />
                </button>
            </div>

            <!-- Right: Send / Mic -->
            <div>
                {#if !value.trim()}
                    <button 
                        class="btn btn-circle btn-sm {isRecording ? 'btn-error animate-pulse' : 'btn-ghost'}" 
                        onclick={onrecord}
                        aria-label={isRecording ? "Stop recording" : "Start recording"}
                        disabled={isTranscribing}
                    >
                        {#if isTranscribing}
                            <span class="loading loading-spinner loading-xs"></span>
                        {:else if isRecording}
                            <Icon icon="lucide:square" class="w-5 h-5" />
                        {:else}
                            <Icon icon="lucide:mic" class="w-5 h-5 opacity-70" />
                        {/if}
                    </button>
                {:else}
                    <button class="btn btn-primary btn-sm btn-circle" onclick={onsend} aria-label="Send message">
                        <Icon icon="lucide:send-horizontal" class="w-5 h-5" />
                    </button>
                {/if}
            </div>
        </div>
    </div>
</div>