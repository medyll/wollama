# TODO

## UI/UX Improvements

### Database Schema Enhancements
**Goal:** Enhance the schema definition in `shared/db/database-scheme.ts` to support better UI generation and data presentation.

**Requirements:**
- **Add `template` field**:
    - Structure: `{ presentation: string }`
    - Purpose: Define a pattern (e.g., "name other info") to construct a default display name, especially for composite fields.
- **Add `type` field**:
    - Purpose: Specify the UI component type (e.g., `ui.type`) to render for each field in the application.
