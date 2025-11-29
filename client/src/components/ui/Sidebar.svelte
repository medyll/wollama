<script lang="ts">
    let { isOpen = $bindable(true) } = $props();
</script>

<aside class="bg-base-300 h-full transition-all duration-300 flex flex-col border-r border-base-content/10 {isOpen ? 'w-64' : 'w-0 overflow-hidden'}">
    <div class="p-4 border-b border-base-content/10 flex items-center justify-between">
        <span class="font-bold text-xl truncate">Conversations</span>
    </div>
    
    <div class="flex-1 overflow-y-auto p-2 space-y-2">
        <!-- Mock List -->
        <a href="/chat/1" class="btn btn-ghost btn-block justify-start no-animation font-normal">
            Discussion 1
        </a>
        <a href="/chat/2" class="btn btn-ghost btn-block justify-start no-animation font-normal">
            Discussion 2
        </a>
    </div>

    <div class="p-4 border-t border-base-content/10">
        <a href="/personas" class="btn btn-outline btn-block btn-sm">
            + Nouvelle Chat
        </a>
    </div>
</aside>
