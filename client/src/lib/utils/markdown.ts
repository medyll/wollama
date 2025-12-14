import { Marked } from 'marked';
import hljs from 'highlight.js';

const renderer = {
	code({ text, lang }: { text: string; lang?: string }) {
		const language = hljs.getLanguage(lang || '') ? lang : 'plaintext';
		const highlighted = hljs.highlight(text, { language: language || 'plaintext' }).value;

		return `
            <div class="mockup-code bg-[#282c34] text-neutral-content my-4 min-w-0 text-sm shadow-lg">
                <div class="flex items-center justify-between px-4 py-2 bg-base-300/10 text-xs text-base-content/70 select-none border-b border-white/10">
                    <span class="font-mono font-bold text-gray-400">${language || 'text'}</span>
                    <button class="copy-btn btn btn-ghost btn-xs text-gray-400 hover:text-white gap-1" data-code="${encodeURIComponent(text)}">
                        <span class="icon-[lucide--copy] w-3 h-3"></span>
                        Copy
                    </button>
                </div>
                <pre class="px-5 py-4 overflow-x-auto"><code class="hljs language-${language}">${highlighted}</code></pre>
            </div>
        `;
	}
};

const marked = new Marked();
marked.use({ renderer });

export function parseMarkdown(content: string): string {
	return marked.parse(content) as string;
}
