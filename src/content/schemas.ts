import { z } from 'zod';
export const schemas = {
  pages: {
    home: z.object({
      "blobs": z.array(z.object({
        "cx": z.string(),
        "cy": z.string(),
        "r": z.number(),
        "varName": z.string(),
        "dur": z.number(),
        "dx": z.number(),
        "dy": z.number(),
        "id": z.string()
      }))
    })
  }
};
export type Schemas = typeof schemas;