import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    '.next/**',
    '.test-dist/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'pages/api/*.ts',
    'pages/api/**/*.ts',
    'lib/demo-data.ts',
    'lib/demo-mode.ts',
    'lib/auth.ts',
    'lib/cors.ts',
    'lib/supabase.ts',
    'lib/supabase-server.ts',
  ]),
])
