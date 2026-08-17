# Wollama Design — Quiet Local

## Product idea

Wollama is a calm, capable workspace for conversations with local AI. The interface should feel private, precise and warm: the restraint of a professional writing tool, the density of a developer tool, and none of the visual noise of an admin dashboard.

The reference is the interaction quality of Claude and Codex, not a pixel copy. Wollama keeps its own character through warm neutral surfaces, a mineral blue accent and the recurring idea of a quiet, local workspace.

## Experience hierarchy

1. The conversation is the product. Application chrome stays visually secondary.
2. The composer is the main control. It remains stable, obvious and reachable.
3. Context is disclosed progressively. Companion, audio and destructive actions never compete with writing.
4. Reading comfort beats maximum width. Long-form content uses a 48–54rem measure.
5. Density is deliberate. Default interface text is 14px, labels 12–13px, titles 16–18px.

## Design principles

- **Quiet surfaces:** separate regions primarily with tone; use borders only where they clarify interaction.
- **One accent:** mineral blue marks focus, selection and the primary action. It is not decorative.
- **Warm neutrality:** light mode is parchment-white rather than sterile white; dark mode is charcoal rather than black.
- **Compact chrome, generous prose:** navigation is dense; message content keeps a relaxed line height.
- **Soft geometry:** medium radii for controls, larger radii only for the composer and floating panels.
- **Motion with purpose:** 120–200ms transitions for hover, focus, collapse and entry. Respect reduced motion.

## Token model

Tokens follow three levels:

```text
primitive feeling → css-base theme seeds → Wollama component tokens
warm neutral          surface/text colors       shell/composer/message
mineral blue          primary color             focus/active/send
```

The executable values live in `client/src/styles/wollama-theme.css`. Components consume semantic or component tokens and do not introduce local brand colors.

## Typography

- UI family: system sans stack supplied by `@medyll/css-base`.
- Code family: system monospace stack supplied by `@medyll/css-base`.
- Base: 14px / 1.5.
- Navigation and metadata: 12–13px.
- Product name and page title: 14–16px, medium weight.
- Empty-state title: 20px maximum.
- Avoid bold body copy. Use weight to express hierarchy only.

## Layout

- Sidebar expanded: 15rem; collapsed: 3.5rem.
- Header: 3.25rem.
- Conversation reading measure: 52rem.
- Composer measure: 52rem.
- Desktop gutters: 24px around prose; mobile gutters: 12px.
- The sidebar is flush with the shell on desktop and becomes an overlay sheet on mobile.

## Core components

### Sidebar

- Secondary surface, no card-within-a-card appearance.
- Current chat uses a subtle active tint and stronger text, not a heavy filled button.
- Icons are 16–18px. Rows are compact and keep a 32–36px target height.
- Search and new chat appear before history; settings stays anchored at the bottom.

### Header

- Thin contextual bar, not a navigation destination.
- Wollama wordmark is quiet; the current chat title carries the context.
- Status and account controls remain on the trailing edge.

### Messages

- Assistant content reads as document content on the page, without a large bubble.
- User messages use a compact, lightly tinted bubble aligned to the right.
- Avatars are metadata and stay small.
- Actions appear close to the message and remain visually subordinate.

### Composer

- One raised rounded surface with a subtle shadow and a clear focus ring.
- The textarea is visually dominant; secondary controls sit in a low-noise footer.
- Companion selection is metadata above the writing surface, never a competing toolbar.
- Send is the only strongly filled action.

## Themes

Both themes must preserve hierarchy rather than invert colors mechanically.

- Light: warm paper surface, quiet stone sidebar, near-black text.
- Dark: charcoal surface, slightly lifted composer, off-white text.
- Borders remain low contrast in both modes.
- Syntax highlighting may use its own palette but must visually sit inside the conversation.

## Accessibility

- Meet RGAA-compatible keyboard, focus, contrast and labeling requirements.
- Never communicate selection by color alone.
- Interactive targets are at least 32px in dense desktop chrome and 44px on touch layouts.
- Respect `prefers-reduced-motion`.
- Keep native controls and semantic landmarks whenever possible.

## Acceptance checklist

- No unintended text above 20px in the application shell or chat.
- Conversation and composer share the same visual measure.
- Light and dark themes both have three perceptible surface levels.
- Every interactive control has hover, focus-visible, active and disabled treatment.
- The primary accent appears only for focus, selection, progress and primary actions.
- Desktop, tablet and mobile layouts work without horizontal scrolling.
- A screenshot should be recognizable as Wollama without relying on the logo.
