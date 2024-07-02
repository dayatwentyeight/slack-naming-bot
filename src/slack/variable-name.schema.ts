import { z } from 'zod';

export const variableNameSchema = z
  .string()
  // remove all characters except alphabet, number, _
  .transform((val) => val.replace(/[^a-zA-Z0-9_]/g, ''))
  .transform((val) => (/^[0-9]/.test(val) ? `_${val}` : val));
