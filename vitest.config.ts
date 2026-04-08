import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    test: {
        testTimeout: 15000,
        env: {
            BASE_URL: process.env.BASE_URL ?? 'http://localhost:8111',
            ADMIN_TOKEN: process.env.ADMIN_TOKEN ?? '',
        },
    },
});