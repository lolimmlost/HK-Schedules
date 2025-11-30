import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_API_URL: z.string().url().optional(),
    VITE_APP_NAME: z.string().default('Housekeeper Schedule Manager'),
  },
  runtimeEnv: {
    VITE_API_URL: import.meta.env?.VITE_API_URL,
    VITE_APP_NAME: import.meta.env?.VITE_APP_NAME,
  },
})
