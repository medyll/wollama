<script lang="ts">
    import { userState } from '$lib/state/user.svelte';
    import { translations } from '../../locales/translations.js';

    const locales = Object.keys(translations);
    // Generate a unique ID for the popover to allow multiple instances
    const uid = 'pop-' + Math.random().toString(36).slice(2);
    
    function changeLocale(newLocale: string) {
        userState.preferences.locale = newLocale;
        userState.save();
    }
</script>

<button 
    class="btn btn-ghost btn-sm m-1" 
    popovertarget="lang-popover-{uid}" 
    style="anchor-name: --lang-anchor-{uid}"
    aria-label="Select Language"
>
    {(userState.preferences.locale || 'en').toUpperCase()}
    <svg width="12px" height="12px" class="h-2 w-2 fill-current opacity-60 inline-block ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
</button>

<div 
    id="lang-popover-{uid}" 
    popover="auto" 
    class="p-0 bg-transparent border-none shadow-none overflow-visible"
    style="
        position-anchor: --lang-anchor-{uid};
        top: anchor(bottom);
        left: anchor(center);
        transform: translateX(-50%);
        margin-top: 0.5rem;
        position-try-fallbacks: flip-block;
    "
>
    <ul class="menu p-2 shadow bg-base-100 rounded-box w-52">
        {#each locales as locale}
            <li>
                <button 
                    class:active={userState.preferences.locale === locale}
                    onclick={() => changeLocale(locale)}
                >
                    {locale.toUpperCase()}
                </button>
            </li>
        {/each}
    </ul>
</div>
