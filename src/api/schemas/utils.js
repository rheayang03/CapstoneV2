import { z } from 'zod';

// Reusable primitives
export const IdSchema = z.string().min(1);
// Match ISO strings that end with 'Z' or a timezone offset like +08:00 or -0500
export const ISODateTime = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/Z|[+-]\d{2}:?\d{2}$/))
  .optional();

// Helper to validate and throw readable error
export function validate(schema, data, label = 'Response') {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    const err = new Error(`${label} validation failed: ${issues}`);
    err.issues = parsed.error.issues;
    throw err;
  }
  return parsed.data;
}
