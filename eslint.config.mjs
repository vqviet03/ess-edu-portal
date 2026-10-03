import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([...nextVitals, ...nextTs, {rules: {
  // Client-only session/theme hydration must run after the server render.
  'react-hooks/set-state-in-effect': 'off',
  'no-empty': ['error', {allowEmptyCatch: true}],
}}, globalIgnores(['.next/**', 'out/**', 'next-env.d.ts', 'test-results/**', 'playwright-report/**'])]);
