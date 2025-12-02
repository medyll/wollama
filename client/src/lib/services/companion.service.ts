import { getDatabase } from '$lib/db';
import type { Companion } from '$types/data';

export class CompanionService {
    
    async getAll(): Promise<Companion[]> {
        const db = await getDatabase();
        return db.companions.find().exec();
    }

    async getById(id: string): Promise<Companion | null> {
        const db = await getDatabase();
        return db.companions.findOne(id).exec();
    }

    async create(companion: Omit<Companion, 'created_at'>): Promise<string> {
        const db = await getDatabase();
        const companionId = companion.companion_id || crypto.randomUUID();
        
        await db.companions.insert({
            ...companion,
            companion_id: companionId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        return companionId;
    }

    async update(id: string, data: Partial<Companion>): Promise<void> {
        const db = await getDatabase();
        const companion = await db.companions.findOne(id).exec();
        if (companion) {
            await companion.patch({
                ...data,
                updated_at: new Date().toISOString()
            });
        }
    }

    async delete(id: string): Promise<void> {
        const db = await getDatabase();
        const companion = await db.companions.findOne(id).exec();
        if (companion) {
            await companion.remove();
        }
    }

    async initializeDefaults(): Promise<void> {
        const db = await getDatabase();
        const count = await db.companions.count().exec();
        
        if (count === 0) {
            console.log('Initializing default companions...');
            const defaults: Omit<Companion, 'created_at'>[] = [
                { 
                    companion_id: '1', 
                    name: 'General Assistant', 
                    description: 'A helpful general purpose assistant', 
                    model: 'mistral:latest',
                    system_prompt: 'You are a helpful assistant.',
                    voice_id: 'alloy',
                    voice_tone: 'neutral',
                    mood: 'friendly'
                },
                { 
                    companion_id: '2', 
                    name: 'Expert Coder', 
                    description: 'Specialized in programming and software architecture', 
                    model: 'codellama',
                    system_prompt: 'You are an expert programmer.',
                    voice_id: 'onyx',
                    voice_tone: 'fast',
                    mood: 'professional'
                },
                { 
                    companion_id: '3', 
                    name: 'Storyteller', 
                    description: 'Creative writer for engaging stories', 
                    model: 'llama2',
                    system_prompt: 'You are a creative storyteller.',
                    voice_id: 'nova',
                    voice_tone: 'slow',
                    mood: 'happy'
                },
            ];

            for (const c of defaults) {
                await this.create(c);
            }
        }
    }
}

export const companionService = new CompanionService();
