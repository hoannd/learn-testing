import { defineConfig, devices } from '@playwright/test';

const isReportPortalEnabled = process.env.RP_ENABLED?.toLowerCase() === "true" || process.env.RP_ENABLED === "1";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './tests/flaky',
    testMatch: '**/*.test.ts',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Repeat each test multiple times for flaky test demonstration */
    repeatEach: process.env.REPEAT_TESTS ? parseInt(process.env.REPEAT_TESTS) : 1,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: isReportPortalEnabled
        ? [
            ['html', { open: 'never' }],
            ['junit', { outputFile: 'reports/playwright-results.xml' }],
            ['@reportportal/agent-js-playwright', {
                apiKey: process.env.RP_API_KEY!,
                endpoint: `${process.env.RP_URL!}/api/v1`,
                project: process.env.RP_PROJECT!,
                launch: process.env.RP_LAUNCH_NAME!,
                attributes: process.env.RP_LAUNCH_ATTRIBUTES!.split(";").map((attr: string) => {
                    const [key, value] = attr.split(":");
                    return { key, value };
                }),
                description: process.env.RP_LAUNCH_DESCRIPTION!,
            }]
        ]
        : [['html', { open: 'never' }]],
    /* Shared settings for all the tests below. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:3000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
    },
});
