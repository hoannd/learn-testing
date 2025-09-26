import { test, expect } from '@playwright/test';

/**
 * Pizza Delivery Time Selection Test
 *
 * This test validates the pizza order form with random delivery time selection
 * within business hours. The test behavior:
 *
 * 1. Random time selection in 10-minute intervals between 11:00-21:00
 * 2. Form submission with the selected delivery time
 * 3. Assertion that submitted time appears in the response
 *
 * Expected behavior: Test may pass or fail depending on form submission success
 */

test.describe('Pizza Delivery Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Start the server and navigate to the form
        await page.goto('http://localhost:3000/forms/post');
    });

    test('Random delivery time selection within business hours', async ({ page }) => {
        // Generate random delivery time in 10-minute intervals between 11:00-21:00
        const randomHour = Math.floor(Math.random() * 11) + 11; // 11-21 hours (11 possible hours)
        const randomTenMinuteSlot = Math.floor(Math.random() * 6); // 0-5 slots
        const randomMinutes = randomTenMinuteSlot * 10; // 0, 10, 20, 30, 40, 50

        // Format time as HH:MM for the form input
        const timeString = `${randomHour.toString().padStart(2, '0')}:${randomMinutes.toString().padStart(2, '0')}`;

        console.log(`🕐 Testing with delivery time: ${timeString}`);

        // Fill out the pizza order form
        await page.fill('#custname', 'John Doe');
        await page.fill('#custtel', '555-0123');
        await page.fill('#custemail', 'john@example.com');

        // Select pizza size
        await page.check('input[name="size"][value="large"]');

        // Select toppings
        await page.check('input[name="topping"][value="bacon"]');
        await page.check('input[name="topping"][value="cheese"]');

        // Set the random delivery time
        await page.fill('#delivery', timeString);

        // Add delivery instructions
        await page.fill('#comments', 'Please ring doorbell twice!');

        // Submit the form
        await page.click('button[type="submit"]');

        // Wait for response page
        await page.waitForLoadState('networkidle');

        // Get the response data from the page
        const responseText = await page.textContent('body');

        console.log(`📋 Form Response:`);
        console.log(`   - Submitted time: ${timeString}`);
        console.log(`   - Response contains submitted time: ${responseText?.includes(timeString)}`);

        // Assert that the submitted delivery time appears in the response
        // This validates that the form submission worked and the time was processed correctly
        expect(responseText, `Response should contain the submitted delivery time: ${timeString}`).toContain(timeString);

        console.log(`✅ Form submission successful! Delivery time ${timeString} was processed correctly`);
    });
});
