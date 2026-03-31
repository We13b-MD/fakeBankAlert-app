import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        testTimeout: 10000,
        // Don't load .env automatically — tests should not hit real services
        env: {
            JWT_SECRET: 'test-jwt-secret-key-for-testing',
            SESSION_SECRET: 'test-session-secret',
            OPENAIKEY: 'test-key',
            NODE_ENV: 'test',
        },
    },
});
