# TODO

## UI/UX Improvements

### Redesign Chat Bubbles
**Goal:** Modernize the chat interface by removing explicit role labels and improving the visual hierarchy with avatars and names.

**Requirements:**
- Remove text roles ("You", "Assistant") from the chat bubbles.
- Position user avatars at the top of their message block.
- Display the Assistant Companion's name and avatar clearly.

**Implementation Process:**
1.  **Modify `client/src/components/chat/ChatWindow.svelte`**:
    - Locate the message loop `{#each messages as message, i}`.
    - **User Messages (`chat-end`)**:
        - Remove the `.chat-header` div that contains the text "You" (or translation).
        - Ensure the avatar (`.chat-image`) is aligned to the top (check DaisyUI alignment classes).
    - **Assistant Messages (`chat-start`)**:
        - Remove the `.chat-header` div that contains the text "Assistant".
        - **Avatar**: Replace the generic "AI" placeholder in `.chat-image` with the `currentCompagnon`'s avatar image.
        - **Name**: Add the Companion's name (`currentCompagnon.name`) to the `.chat-header` (or a new element above the bubble) so it is visible.
    
2.  **Update Styles**:
    - Adjust spacing/margins to compensate for the removed role labels.
    - Ensure the layout remains responsive and looks good on mobile.

3.  **Verify**:
    - Check display for both User and Assistant messages.
    - Verify that changing the companion updates the avatar and name in the chat history correctly.

### Input Area & Audio Toggle Refactor
**Goal:** Improve the accessibility and layout of the audio controls and companion information near the input area.

**Requirements:**
- **Internationalization**: Use `i18n` for the "Toggle Audio Response" label.
- **Componentization**: Extract the audio toggle button into its own component.
- **Layout Change**: Create a dedicated zone *above* the message input area.
- **Content**:
    - **Left**: Place the **Companion Name** (clickable).
    - **Center**: Place the **Audio Toggle Button**.
    - **Right**: Place the **Delete Chat Button** (moved from Header).
- **Styling**:
    - Audio Toggle Button:
        - Centered in the new zone.
        - Large size (approx 48px icon).
        - Circular container.
        - Hover effect: Scale up (grow).

**Implementation Process:**
1.  **Create `client/src/components/chat/AudioToggle.svelte`**:
    - Move the `<label class="swap ...">` logic here.
    - Add props for `checked` state (bindable).
    - Use `t('ui.toggle_audio')` (or similar key) for `aria-label`.
    - Apply new styling (large size, hover scale).

2.  **Modify `client/src/components/chat/ChatWindow.svelte`**:
    - **Remove** the old toggle button and delete button from the Header.
    - **Create** the new zone container above the `textarea` / input box.
    - **Layout**: Flexbox with `justify-between` or Grid.
    - **Insert** the clickable Companion Name (left).
    - **Insert** the `AudioToggle` component (center).
    - **Insert** the Delete Chat Button (right).
    - **Update** the `inputArea` snippet to include this new zone.

### Fix Sidebar Collapse Trigger
**Goal:** Restore the visibility of the sidebar collapse/expand button.

**Issue:** The button to toggle `isCollapsed` in the sidebar is currently not visible or misplaced.

**Requirements:**
- Place the collapse trigger button **immediately before** the App Title in the Header (or at the top of the sidebar if that's the intended design, but user asked for "just before the app title").
- *Clarification*: The user said "just before the app title". The App Title is usually in the main Layout header, not the Sidebar.
- *Interpretation*: The user likely wants the hamburger menu/collapse button in the main top navigation bar (Layout), which controls the Sidebar state.
- **Action**:
    - Verify where the App Title is (`client/src/routes/+layout.svelte`).
    - Ensure the button that toggles the sidebar (or `isCollapsed` state) is visible there.
    - If the button is inside `Sidebar.svelte`, move it or ensure it's visible.
    - *Correction based on context*: The user said "in the sidebar, the button to shrink... is no longer visible. Put it back, just before the app title". This implies the App Title might be IN the sidebar, or they want the button in the main header next to the title.
    - *Decision*: Place the toggle button in the **Main Layout Header** (`+layout.svelte`), to the left of the "Wollama" title. This button will toggle the Sidebar's open/collapsed state.

**Implementation Process:**
1.  **Modify `client/src/routes/+layout.svelte`**:
    - Add a button to the left of the Logo/Title.
    - This button should toggle the `isOpen` or `isCollapsed` state of the Sidebar.
    - *Note*: The Sidebar component currently has `isOpen` (mobile) and internal `isCollapsed` (desktop). We might need to expose `isCollapsed` as a prop or manage it in the Layout.
2.  **Modify `client/src/components/ui/Sidebar.svelte`**:
    - Check if `isCollapsed` needs to be a bindable prop to be controlled from outside.

3.  **Styles**:
    - Ensure the new zone doesn't clutter the mobile view (check spacing).
    - Verify the "grow on hover" animation.

### Electron Splash Screen Image
**Goal:** Unify the splash screen imagery between Electron and the Web App.

**Requirements:**
- The Electron splash screen (`client/electron/splash.html`) should use the same image asset as the Svelte app's splash screen (referenced in `app.html` or similar).
- Ensure the image path is correctly resolved in the Electron build context.

### Search Page
**Goal:** Implement a dedicated search interface to find chats and messages.

**Requirements:**
- **Access**: Accessible via the Search icon in the Sidebar.
- **Filters** (DaisyUI Checkboxes):
    - Search by **Chat Name**.
    - Search by **Message Content**.
    - Search by **Assistant Name**.
- **Sorting**: Ability to sort results by **Date** (Newest/Oldest).
- **UI**:
    - A dedicated route (e.g., `/search`).
    - Search input field.
    - Filter options (checkboxes).
    - Results list with clickable items navigating to the specific chat/message.

### Refactor Input Area Component
**Goal:** Modularize the chat interface by extracting the input area and its controls into a dedicated component.

**Requirements:**
- **Component**: Create `client/src/components/chat/ChatInput.svelte` (or similar).
- **Scope**:
    - The component must include the **Text Input Area** (textarea, file attachment, send button).
    - The component must ALSO include the **Top Bar** (the zone above the input defined in "Input Area & Audio Toggle Refactor").
        - Left: Companion Name.
        - Center: Audio Toggle.
        - Right: Delete Chat Button.
- **Props/Events**:
    - Handle message sending (event).
    - Handle file attachments.
    - Handle audio toggle state.
    - Handle companion selection/click.
    - Handle chat deletion.

### Database Schema Enhancements
**Goal:** Enhance the schema definition in `shared/db/database-scheme.ts` to support better UI generation and data presentation.

**Requirements:**
- **Add `template` field**:
    - Structure: `{ presentation: string }`
    - Purpose: Define a pattern (e.g., "name other info") to construct a default display name, especially for composite fields.
- **Add `type` field**:
    - Purpose: Specify the UI component type (e.g., `ui.type`) to render for each field in the application.
