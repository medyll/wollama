// ajv's default export doesn't typecheck as constructable under this repo's
// module:Node16 + esModuleInterop combination (it resolves fine at runtime — verified
// against the installed 8.20.0 — but TS loses the construct signature on the default
// import). The named export carries the same class and typechecks correctly, so it's
// used here instead; this is the one place in the repo that imports ajv.
import { Ajv, type ValidateFunction } from 'ajv';

// strict:false is mandatory here: JSON Schemas coming from zod-to-json-schema (what the
// MCP SDK emits, e.g. acp-team's tool schemas) carry `$schema`, `$defs`,
// `additionalProperties` and similar keys that ajv's strict mode rejects outright.
const ajv = new Ajv({ strict: false, allErrors: true });

const cache = new Map<string, ValidateFunction>();

function compile(toolId: string, schema: Record<string, unknown>): ValidateFunction {
	const cached = cache.get(toolId);
	if (cached) return cached;
	const validateFn = ajv.compile(schema);
	cache.set(toolId, validateFn);
	return validateFn;
}

export interface ValidationResult {
	valid: boolean;
	errors?: string;
}

export function validateToolInput(toolId: string, schema: Record<string, unknown>, input: unknown): ValidationResult {
	try {
		const validateFn = compile(toolId, schema);
		const valid = validateFn(input);
		if (valid) return { valid: true };
		return { valid: false, errors: ajv.errorsText(validateFn.errors, { separator: '; ' }) };
	} catch (err: any) {
		// A malformed schema (e.g. from a misbehaving MCP server) must not crash the
		// tool call — treat it as a validation failure instead.
		return { valid: false, errors: `Invalid schema: ${err?.message ?? String(err)}` };
	}
}

/** Drops the compiled-schema cache entry for a tool, e.g. after an MCP reconnect. */
export function invalidateToolSchema(toolId: string): void {
	cache.delete(toolId);
}
