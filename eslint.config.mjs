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
    'showcase-export/**',
    'next-env.d.ts',
    'pages/api/**',
    'lib/**/*',
    '!lib/evaluation.ts',
  ]),
])
