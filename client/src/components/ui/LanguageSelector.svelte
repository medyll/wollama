<script lang="ts">
    import { userState } from '$lib/state/user.svelte';
    import { translations } from '../../locales/translations.js';

    const locales = Object.keys(translations);
    
    function changeLocale(newLocale: string) {
        console.log('Changing locale to:', newLocale);
        userState.preferences.locale = newLocale;
        userState.save();
    }
</script>

<div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-sm m-1" aria-label="Select Language">
        {(userState.preferences.locale || 'en').toUpperCase()}
        <svg width="12px" height="12px" class="h-2 w-2 fill-current opacity-60 inline-block ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
    </div>
    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        {#each locales as locale}
            <li>
                <button 
                    class:active={userState.preferences.locale === locale}
                    onclick={() => {
                        changeLocale(locale);
                        // Close dropdown by removing focus (optional hack for DaisyUI dropdowns)
                        if (document.activeElement instanceof HTMLElement) {
                            document.activeElement.blur();
                        }
                    }}
                >
                    {locale.toUpperCase()}
                </button>
            </li>
        {/each}
    </ul>
</div>
