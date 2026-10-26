// The content schema. One source for the TypeScript types and the runtime
// validation (Zod), so content that does not match fails the build instead of
// failing on a player's phone. game-narrative's schema-core replaces this with
// the full grammar; keep the file name.
import { z } from 'zod';

export const Choice = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  text: z.string().min(1),
  next: z.string().optional(),
  ending: z.string().optional(),
}).refine((c) => !!c.next !== !!c.ending, { message: 'a choice has exactly one of next or ending' });

export const Scene = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  title: z.string().min(1),
  text: z.string().min(1),
  choices: z.array(Choice).min(1),
});

export type Choice = z.infer<typeof Choice>;
export type Scene = z.infer<typeof Scene>;
export interface ContentBundle { scenes: Record<string, Scene>; start: string }
