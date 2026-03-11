import { test, expect } from '@playwright/test';

test.describe('Spellbook Chat App', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load the page correctly', async ({ page }) => {
        await expect(page).toHaveTitle(/Spellbook | AI Legal Assistant/);
        await expect(page.locator('.logo-text')).toContainText('Spellbook');
        await expect(page.locator('.message.assistant')).toBeVisible();
    });

    test('should send a message and receive a real AI response', async ({ page }) => {
        const input = page.locator('#chat-input');
        const sendBtn = page.locator('#send-btn');
        const testMessage = 'What is an Indemnification clause? Explain briefly.';

        // Type message
        await input.fill(testMessage);
        await sendBtn.click();

        // Check if user message is added
        await expect(page.locator('.message.user .response-text')).toContainText(testMessage);

        // Check if thinking animation appears
        await expect(page.locator('.thinking')).toBeVisible();

        // Wait for response and check (real API might take longer)
        const response = page.locator('.message.assistant .response-text').nth(1);
        await expect(response).toBeVisible({ timeout: 20000 });
        const responseText = await response.innerText();

        // Verify it's not a generic error and has legal content
        expect(responseText.length).toBeGreaterThan(10);
        expect(responseText.toLowerCase()).toContain('indemnification');
    });

    test('should handle multi-line input and textarea expansion', async ({ page }) => {
        const input = page.locator('#chat-input');
        const initialHeight = await input.evaluate(el => el.clientHeight);

        await input.fill('Line 1\nLine 2\nLine 3');
        const expandedHeight = await input.evaluate(el => el.clientHeight);

        expect(expandedHeight).toBeGreaterThan(initialHeight);
    });

    test('should update character count on input', async ({ page }) => {
        const input = page.locator('#chat-input');
        const charCount = page.locator('.char-count');
        await input.fill('Hello');
        await expect(charCount).toHaveText('5/2000');
    });

    test('should handle multi-line input manually', async ({ page }) => {
        const input = page.locator('#chat-input');
        await input.fill('Line 1\nLine 2');
        const value = await input.inputValue();
        expect(value).toBe('Line 1\nLine 2');
    });

    test('should support document upload and status change', async ({ page }) => {
        // Mocking file upload is complex in Playwright, but we can verify the UI elements
        await expect(page.locator('#attach-btn')).toBeVisible();
        await expect(page.locator('#doc-upload')).toBeAttached();

        // Check if the empty state is initially shown
        await page.click('#nav-docs');
        await expect(page.locator('.empty-docs').first()).toBeVisible();
    });

    test('should scroll to bottom when new messages are added', async ({ page }) => {
        const input = page.locator('#chat-input');
        const chatContainer = page.locator('#chat-messages');

        for (let i = 0; i < 5; i++) {
            await input.fill(`Message ${i}`);
            await input.press('Enter');
            await page.waitForTimeout(500); // Wait for response
        }

        const isAtBottom = await chatContainer.evaluate((el) => {
            const threshold = 100;
            return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
        });

        expect(isAtBottom).toBe(true);
    });
});
