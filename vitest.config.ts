import { RPReporter } from "@reportportal/agent-js-vitest";
import { defineConfig } from "vitest/config";

const isReportPortalEnabled = process.env.RP_ENABLED?.toLowerCase() === "true" || process.env.RP_ENABLED === "1";

const sonarReporter = ["vitest-sonar-reporter", { outputFile: "reports/test-results.xml" }] as [
    "vitest-sonar-reporter",
    { outputFile: string },
];
const junitConfig = ["junit", {
    suiteName: "Vitest Tests",
    classnameTemplate: "filename:{filename} - filepath:{filepath}",
}] as ["junit", { suiteName: string; classnameTemplate: string }];

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/server/**/*.test.ts"],
        testTimeout: 10000,
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov", "html"],
            reportsDirectory: "coverage",
            include: ["server/**/*.ts"],
            exclude: ["server/**/*.d.ts", "tests/**/*"],
            thresholds: {
                branches: 70,
                functions: 70,
                lines: 70,
                statements: 70,
            },
        },
        setupFiles: ["@reportportal/agent-js-vitest/setup"],
        reporters: isReportPortalEnabled
            ? [
                "default",
                sonarReporter,
                junitConfig,
                new RPReporter({
                    apiKey: process.env.RP_API_KEY!,
                    endpoint: `${process.env.RP_URL!}/api/v1`,
                    project: process.env.RP_PROJECT!,
                    launch: process.env.RP_LAUNCH_NAME!,
                    attributes: process.env.RP_LAUNCH_ATTRIBUTES!.split(";").map((attr) => {
                        const [key, value] = attr.split(":");
                        return { key, value };
                    }),
                    description: process.env.RP_LAUNCH_DESCRIPTION!,
                }),
            ]
            : [
                "default",
                sonarReporter,
                junitConfig,
            ],
        outputFile: "reports/test-results.junit.xml",
    },
});
