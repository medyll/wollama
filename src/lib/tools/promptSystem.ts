import type { DbChat } from '$types/db';
import type { DBMessage } from '$types/db';
import { get } from 'svelte/store';
import { OllamaApi } from '../db/ollamaApi';
import { settings } from '$lib/stores/settings.svelte';
import { idbQuery } from '$lib/db/dbQuery';
import type { OllApiGenerate, OllamaResponse } from '$types/ollama';
import { ollamaApiMainOptionsParams } from '$lib/stores/ollamaParams';

let categoryPresets = [
    'Coding',
    'Design',
    'Development',
    'Marketing',
    'Sales',
    'Support',
    'Management',
    'HR',
    'Finance',
    'Medicine',
    'Legal',
    'Livres',
    'Ecriture',
    'Espace',
];

export async function askOllama(prompt: string, model: string) {}

function promptOptions({ system, prompt }: Partial<OllApiGenerate>): OllApiGenerate {
    const config = get(settings);
    const ollamaOptions = get(ollamaApiMainOptionsParams);
    return {
        model: config?.defaultModel,
        system,
        prompt,
        stream: false,
        format: 'json',
        options: { ...ollamaOptions, temperature: 0.1 },
    } as OllApiGenerate;
}
export async function guessChatMetadata(message: string): Promise<OllamaResponse> {
    let categories = categoryPresets.join('\r\n');
    //
    const prompt = `[INST] 
    Basé sur la conversation suivante:
    - génère un titre tres court et accrocheur qui capture l'essence principale du dialogue. Le titre ne doit pas dépasser 10 mots au maximum.
    - catégorise-la en un seul mot.  Utilise le nom d'une des catégories existantes si elle convient parfaitement.  Si aucune catégorie existante ne correspond bien, propose une nouvelle catégorie pertinente en un seul mot. Catégories existantes :  ${categories}\
    - Résume la conversation suivante en 2-3 phrases concises. Capture les points clés et le contexte général sans entrer dans les détails spécifiques. \r\n
    - cré un maximum de quatre tags pertinents pour cette conversation. Les tags doivent être des mots-clés qui capturent les thèmes principaux de la conversation. Si le tag n'existe pas, crée le \r\n
    Conversation :\r\n
    ${message}
    \r\n
    Instructions strictes :  
- le jons retourné doit contenir les clefs 'title', 'description' , 'category' et 'tags'.
- LA CATEGORY NE DOIT FAIRE QU'UN SEUL MOT.
- NE PAS COMMENCER AVEC "Title :", "Titre :" ou d'autres préfixes.
- NE PAS donner d'explications.
- UN MAXIMUM de 10 MOTs OBLIGATOIRE.
    \r\n
    [INST]`;
    let system = `Tu es un assistant de génération de titres et de categories et de tags. 
        Ceux-ci doivent appraitre dans une liste. 
        Tu réponds toujours en un maximum de trois seul mot.
        Tu ne fais jamais de phrases longues. 
        Tes  reponse font entre un et dix mots`;

    let defaultOptions = promptOptions({ prompt, system });
    return await OllamaApi.generate(defaultOptions, () => {});
}
export async function guessChatCategorie(message: string): Promise<OllamaResponse> {
    let categories = categoryPresets.join('\r\n');
    //
    const prompt = `[INST]
    Analyse la conversation suivante et catégorise-la en un seul mot. 
    Utilise le nom d'une des catégories existantes si elle convient parfaitement. 
    Si aucune catégorie existante ne correspond bien, propose une nouvelle catégorie pertinente en un seul mot.
    La categorie doit-être un seul mot.

Conversation :
 ${message}\r\n

Catégories existantes :
 ${categories}\r\n

Instructions strictes :
- Si une catégorie existante convient, réponds UNIQUEMENT avec ce mot.
- Sinon, invente une nouvelle catégorie d'UN SEUL MOT.
- NE PAS utiliser "Nouvelle catégorie :" ou d'autres préfixes.
- NE PAS donner d'explications.
- UN SEUL MOT OBLIGATOIRE.

Rappel : Ta réponse doit être UN SEUL MOT.
[/INST]`;

    let system = 'Tu es un assistant de catégorisation précis. Tu réponds toujours en un seul mot.';

    let defaultOptions = promptOptions({ prompt, system });
    return await OllamaApi.generate(defaultOptions, () => {});
}

export async function guessChatDescription(message: string): Promise<OllamaResponse> {
    const config = get(settings);
    //
    const prompt = `[INST]Résume la conversation suivante en 2-3 phrases concises. Capture les points clés et le contexte général sans entrer dans les détails spécifiques.
Voici la conversation :
 ${message}\r\n
\r\n 
Fourni  un résumé.[/INST]`;

    let system = config?.system_prompt;
    let defaultOptions = promptOptions({ prompt, system });
    return await OllamaApi.generate(defaultOptions, () => {});
}

async function doResume(chatId: any, steps: number = 10) {
    const chatMessages = await idbQuery.getMessages(chatId);
    return chatMessages
        .slice(0, steps)
        .map((message: DBMessage) => {
            return `message-role:\r\n${message.role}\r\n\r\nmessage-content:\r\n${message.content}`;
        })
        .join('\n\n-------\n\n');
}

export class chatMetadata {
    static async checkCategorie(chatId: string) {
        const resume = await doResume(chatId, 15);
        const res = await guessChatMetadata(resume);

        const upd = {} as DbChat;
        let fr = JSON.parse(res.response);
        if (res?.response !== '' && fr?.category) upd.category = fr.category;
        return idbQuery.updateChat(chatId, upd);
    }
    static async checkTitle(chatId: string) {
        const resume = await doResume(chatId, 15);
        const res = await guessChatMetadata(resume);

        const upd = {} as DbChat;
        let fr = JSON.parse(res.response);
        console.log(fr?.title);
        if (res?.response !== '' && fr?.title) upd.title = fr?.title; //  idbQuery.updateChat(chatId, { title: res.response });

        return idbQuery.updateChat(chatId, upd);
    }
    static async checkDescription(chatId: string) {
        const resume = await doResume(chatId, 15);
        const res = await guessChatMetadata(resume);

        const upd = {} as DbChat;
        let fr = JSON.parse(res.response);
        if (res?.response !== '' && fr?.description) upd.description = fr.description; // idbQuery.updateChat(chatId, { : resd.response });

        return idbQuery.updateChat(chatId, upd);
    }
    static async checkTags(chatId: string) {
        const resume = await doResume(chatId, 15);
        const res = await guessChatMetadata(resume);

        const upd = {} as DbChat;
        let fr = JSON.parse(res.response);
        if (res?.response !== '' && fr?.description) upd.tags = fr.tags; // idbQuery.updateChat(chatId, { : resd.response });

        return idbQuery.updateChat(chatId, upd);
    }
}
