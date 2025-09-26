import assert from "assert";
import { AfterScenario, BeforeScenario, Step } from "gauge-ts";
import { Browser, BrowserContext, chromium, Page } from "playwright";

export default class FormSubmissionTest {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;

    @BeforeScenario()
    public async setupBrowser(): Promise<void> {
        this.browser = await chromium.launch({
            headless: true, // Set to false for debugging
        });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
    }

    @AfterScenario()
    public async teardownBrowser(): Promise<void> {
        if (this.page) {
            await this.page.close();
        }
        if (this.context) {
            await this.context.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
    }

    @Step("Navigate to <url>")
    public async navigateToUrl(url: string): Promise<void> {
        if (!this.page) {
            throw new Error("Page not initialized. Make sure BeforeScenario hook ran.");
        }

        if (url.startsWith("env")) {
            // If the URL starts with "env", replace it with the environment variable value
            const envUrl = process.env[url.replace("env:", "")];
            if (!envUrl) {
                throw new Error(`Environment variable for URL '${url}' is not set.`);
            }
            url = envUrl;
        }
        await this.page.goto(url);
        await this.page.waitForLoadState("networkidle");
    }

    @Step("Enter <text> into the <fieldName> field")
    public async enterTextIntoField(text: string | number, fieldName: string): Promise<void> {
        if (!this.page) {
            throw new Error("Page not initialized.");
        }

        // Try different field selectors
        const selectors = [
            `input[name="${fieldName}"]`,
            `textarea[name="${fieldName}"]`,
            `#${fieldName}`,
            `[data-testid="${fieldName}"]`,
        ];

        let fieldFound = false;
        for (const selector of selectors) {
            try {
                if (await this.page.isVisible(selector)) {
                    await this.page.waitForSelector(selector, { state: "visible" });
                    await this.page.fill(selector, String(text));
                    fieldFound = true;
                    break;
                }
            } catch (error) {
                // Continue to next selector
                continue;
            }
        }

        if (!fieldFound) {
            throw new Error(`Could not find field with name '${fieldName}'`);
        }
    }

    @Step("Check <option> checkbox for <fieldName>")
    public async checkCheckbox(option: string, fieldName: string): Promise<void> {
        if (!this.page) {
            throw new Error("Page not initialized.");
        }

        const checkboxSelector = `input[type="checkbox"][name="${fieldName}"][value="${option.toLowerCase()}"]`;

        await this.page.waitForSelector(checkboxSelector, { state: "visible" });
        await this.page.check(checkboxSelector);
    }

    @Step("Select <option> radio button for <fieldName>")
    public async selectRadioButton(option: string, fieldName: string): Promise<void> {
        if (!this.page) {
            throw new Error("Page not initialized.");
        }

        const radioSelector = `input[type="radio"][name="${fieldName}"][value="${option.toLowerCase()}"]`;

        await this.page.waitForSelector(radioSelector, { state: "visible" });
        await this.page.check(radioSelector);
    }

    @Step("Click the <buttonText> button")
    public async clickButton(buttonText: string): Promise<void> {
        if (!this.page) {
            throw new Error("Page not initialized.");
        }

        // Try different button selectors
        const selectors = [
            `button:has-text("${buttonText}")`,
            `input[type="submit"][value="${buttonText}"]`,
            `input[type="button"][value="${buttonText}"]`,
            `[role="button"]:has-text("${buttonText}")`,
            `button:text("${buttonText}")`,
            `input[value="${buttonText}"]`,
        ];

        let buttonFound = false;
        for (const selector of selectors) {
            try {
                if (await this.page.isVisible(selector)) {
                    await this.page.click(selector);
                    await this.page.waitForLoadState("networkidle");
                    buttonFound = true;
                    break;
                }
            } catch (error) {
                // Continue to next selector
                continue;
            }
        }

        if (!buttonFound) {
            throw new Error(`Could not find button with text '${buttonText}'`);
        }
    }

    @Step("The response should contain <text>")
    public async verifyResponseContains(text: string): Promise<void> {
        if (!this.page) {
            throw new Error("Page not initialized.");
        }

        // Wait for the page to load completely
        await this.page.waitForLoadState("networkidle");

        // Get the page content
        const pageContent = await this.page.content();
        const visibleText = await this.page.innerText("body");

        // Check if the text is present in either the full HTML or visible text
        const textFound = pageContent.includes(text) || visibleText.includes(text);

        assert(textFound, `Expected text '${text}' not found in the response`);
    }
}
