import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from 'eslint-plugin-vitest';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            'no-empty': ['error', { allowEmptyCatch: true }],
        },
    },
    {
        files: ['src/tests/**/*.ts'],
        plugins: { vitest },
        rules: vitest.configs.recommended.rules,
    },
);