import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaService } from './ollama.service';

describe('OllamaService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call chat on ollama instance', async () => {
        const spy = vi.spyOn(OllamaService.instance, 'chat').mockResolvedValue({} as any);
        const payload = { model: 'llama2', messages: [] };
        
        await OllamaService.chat(payload);
        
        expect(spy).toHaveBeenCalledWith(payload);
    });

    it('should call generate on ollama instance', async () => {
        const spy = vi.spyOn(OllamaService.instance, 'generate').mockResolvedValue({} as any);
        const payload = { model: 'llama2', prompt: 'hello' };
        
        await OllamaService.generate(payload);
        
        expect(spy).toHaveBeenCalledWith(payload);
    });

    it('should call list on ollama instance', async () => {
        const spy = vi.spyOn(OllamaService.instance, 'list').mockResolvedValue({ models: [] } as any);
        
        await OllamaService.list();
        
        expect(spy).toHaveBeenCalledWith();
    });

    it('should call listModels (alias) on ollama instance', async () => {
        const spy = vi.spyOn(OllamaService.instance, 'list').mockResolvedValue({ models: [] } as any);
        
        await OllamaService.listModels();
        
        expect(spy).toHaveBeenCalledWith();
    });
});
