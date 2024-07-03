import { idbql } from '$lib/db/dbSchema';
import { promptLib } from '$lib/prompts/promptLib';

export async function init() {
    let query;
    // AGENTS
    query = await idbql.agent.where({ code: { eq: 'chat_metadata' } });
    if (!query?.[0]) {
        idbql.agent.add({ code: 'chat_metadata', name: 'chat_metadata', prompt: promptLib.chat_metadata.prompt });
    }
    query = await idbql.agent.where({ code: { eq: 'chat_eval' } });
    if (!query?.[0]) {
        idbql.agent.add({ code: 'chat_eval', name: 'chat_eval', prompt: promptLib.chat_eval.prompt });
    }

    // SYSTEM PROMPT
    query = await idbql.prompts.where({ code: { eq: 'project_manager' } });
    if (!query?.[0]) {
        idbql.prompts.add({ code: 'project_manager', name: 'chat_eval', value: promptLib.project_manager.prompt });
    }
    query = await idbql.prompts.where({ code: { eq: 'prompt_maker' } });
    if (!query?.[0]) {
        idbql.prompts.add({ code: 'prompt_maker', name: 'prompt_maker', value: promptLib.prompt_maker.prompt });
    }
}
