import { test, expect } from '@playwright/test';

test.describe('Multimedia & @ Mentions', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8888');
        // Ensure the app is loaded and the specific item we need is ready
        await page.click('#nav-library');
        const logoItem = page.locator('.library-item:has-text("Logo Concept")');
        await expect(logoItem.locator('.doc-status.ready')).toBeVisible({ timeout: 20000 });
        await page.click('#nav-chat');
    });

    test('should show multimedia assets in library', async ({ page }) => {
        await page.click('#nav-library');
        await expect(page.locator('#library-list')).toBeVisible();

        // Check for logo concept (image)
        const logoItem = page.locator('.library-item:has-text("Logo Concept")');
        await expect(logoItem).toBeVisible();
        await expect(logoItem.locator('.doc-icon')).toHaveText('🖼️');

        // Check for audio briefing
        const audioItem = page.locator('.library-item:has-text("Contract Briefing")');
        await expect(audioItem).toBeVisible();
        await expect(audioItem.locator('.doc-icon')).toHaveText('🔊');
    });

    test('should show @ mention dropdown and select item', async ({ page }) => {
        const input = page.locator('#chat-input');
        await input.focus();
        // Using pressSequentially to simulate real typing for event listeners
        await input.pressSequentially('@', { delay: 100 });

        const dropdown = page.locator('#mentions-dropdown');
        await expect(dropdown).toBeVisible();

        // Select an item. Filter for "Logo"
        await input.pressSequentially('Logo', { delay: 50 });
        const logoOption = dropdown.locator('.mention-item:has-text("Logo Concept")');
        await expect(logoOption).toBeVisible();

        // Select using keyboard
        await page.keyboard.press('Enter');

        // Input should now have @Logo Concept
        const inputValue = await input.inputValue();
        expect(inputValue).toContain('@Logo Concept ');
        await expect(dropdown).toBeHidden();
    });

    test('should render link symbolics in chat', async ({ page }) => {
        const input = page.locator('#chat-input');
        await input.focus();
        // Manually type the formatted mention that should trigger the link
        await input.fill('Looking at @Logo Concept now');
        await page.keyboard.press('Enter');

        // Wait for the message to appear
        const userMessage = page.locator('.message.user');
        await expect(userMessage).toBeVisible();

        // The link should be formatted as <a class="message-link">...</a>
        const link = userMessage.locator('a.message-link');
        await expect(link).toBeVisible();
        await expect(link).toHaveText('Logo Concept');
    });
});
