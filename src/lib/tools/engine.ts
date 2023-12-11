import { settings } from "$lib/stores/settings";


export class engine {
 
    public static setTheme(theme: string) { 
        settings.setParameterValue("theme", theme);
        const currentTheme = theme == 'light' ? 'dark' : 'light'
        
        if (document?.documentElement) {
            document.documentElement.classList.replace(currentTheme, theme);
        }
    }
}