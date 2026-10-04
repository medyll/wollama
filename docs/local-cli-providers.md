# Local CLI providers

Ollama remains Wollama's primary provider and the default for unqualified model names.
Codex, Claude Code and Kimi Code are additional text-chat providers. Wollama launches
their installed CLI on the server and uses the account already authenticated there.
These are local executables, but inference can use a remote service and the account's
usage limits. No API key is copied into Wollama or replicated to the client.

In Settings → Assistant → Artificial Intelligence, choose the provider. `default`
uses the CLI's default model; an explicit model can also be entered. The chat model
selector lists installed providers. Choosing one affects the current conversation;
changing the default in settings affects new conversations. Existing chats retain
their saved provider/model choice. A missing provider fails explicitly and never
sends a conversation to another provider as a fallback.

Availability confirms that an executable was found, not that its account is signed
in or that the model is accessible. Authenticate with the respective CLI outside
Wollama when needed. Refresh providers after installation.

Executable discovery uses PATH and standard Windows installation locations. Server
environment overrides are `WOLLAMA_CODEX_PATH`, `WOLLAMA_CLAUDE_PATH` and
`WOLLAMA_KIMI_PATH`. Each override is an executable path, never a shell command.

Each turn replays Wollama's conversation in a disposable temporary working directory.
Claude runs with no tools, safe mode and no session persistence. Kimi uses an explicit
tool-free profile. Codex runs read-only with shell and web search disabled. Wollama's
own tool loop is disabled for these providers. Coding-agent sessions, filesystem
editing, attachments and model downloads are not offered by these chat adapters.
Ollama retains its existing tools, embeddings, vision and model management.

The server terminates a CLI on HTTP disconnect or after five minutes. Only assistant
text is forwarded; reasoning and CLI diagnostic output are not shown in the chat.
Codex and Claude receive prompts on stdin. Kimi's prompt flag carries its conversation;
on Windows, conversations exceeding the command-line size limit fail explicitly.

`GET /api/providers` lists availability and capabilities. `GET /api/models` remains
Ollama-only for existing consumers; `?provider=all` combines catalogues, and
`?provider=codex|claude|kimi|ollama` filters them. `POST /api/chat/generate` accepts
`provider_id` and a provider-scoped `model`.

Provider/model pairs are stored as `wollama:provider:<provider>/<encoded-model>` in
the existing model string for non-Ollama selections. Bare model names remain Ollama.
No database schema migration, database renaming or data reset is required.

CLI references:

- https://learn.chatgpt.com/docs/non-interactive-mode
- https://code.claude.com/docs/en/headless
- https://moonshotai.github.io/kimi-code/en/reference/kimi-command.html
- https://moonshotai.github.io/kimi-code/en/customization/agents
