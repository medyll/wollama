// Shared between acp-team.connection.ts and acp-team.backend.ts — kept in its own
// file so neither has to import the other just for this id (which would create a
// connection <-> backend import cycle).
export const ACP_TEAM_SERVER_ID = 'acp-team';
