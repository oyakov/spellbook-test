import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Settings & Provider Switching', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should open and close settings modal', async ({ page }) => {
        const modal = page.locator('#settings-modal');
        const gearBtn = page.locator('.header-right .icon-btn:nth-child(2)');
        const closeBtn = page.locator('#close-settings');

        await expect(modal).not.toBeVisible();
        await gearBtn.click();
        await expect(modal).toBeVisible();
        await closeBtn.click();
        await expect(modal).not.toBeVisible();
    });

    test('should save settings and persist in localStorage', async ({ page }) => {
        const gearBtn = page.locator('.header-right .icon-btn:nth-child(2)');
        const llmSelect = page.locator('#llm-provider');
        const apiKeyInput = page.locator('#gemini-api-key');
        const saveBtn = page.locator('#save-settings');

        await gearBtn.click();
        await llmSelect.selectOption('lmstudio');
        await apiKeyInput.fill('test-api-key-456');
        await saveBtn.click();

        // Check if confirmation message appears in chat
        await expect(page.locator('.message.assistant').last()).toContainText('Settings saved successfully');

        // Reload page and verify persistence
        await page.reload();
        await gearBtn.click();
        await expect(llmSelect).toHaveValue('lmstudio');
        await expect(apiKeyInput).toHaveValue('test-api-key-456');
    });

    test('should send provider and apiKey in chat requests', async ({ page }) => {
        const gearBtn = page.locator('.header-right .icon-btn:nth-child(2)');
        const apiKeyInput = page.locator('#gemini-api-key');
        const saveBtn = page.locator('#save-settings');
        const chatInput = page.locator('#chat-input');
        const sendBtn = page.locator('#send-btn');

        // Set settings
        await gearBtn.click();
        await apiKeyInput.fill('request-test-key');
        await saveBtn.click();

        // Listen for requests
        const [request] = await Promise.all([
            page.waitForRequest(req => req.url().includes('/api/chat') && req.method() === 'POST'),
            chatInput.fill('Hello Test'),
            sendBtn.click()
        ]);

        const body = JSON.parse(request.postData() || '{}');
        expect(body.provider).toBe('gemini');
        expect(body.apiKey).toBe('request-test-key');
    });

    test('should display fallback indicator when fallback occurs', async ({ page }) => {
        // Mock the backend API call to return a fallback response
        await page.route('/api/chat', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    text: 'This is a test fallback response.',
                    fallback: true,
                    provider: 'gemini'
                })
            });
        });

        const chatInput = page.locator('#chat-input');
        const sendBtn = page.locator('#send-btn');

        await chatInput.fill('Hello Testing');
        await sendBtn.click();

        // Check if the fallback badge appears
        const fallbackBadge = page.locator('.fallback-badge');
        await expect(fallbackBadge).toBeVisible();
        await expect(fallbackBadge).toContainText('Local LLM unavailable');

        // Check if the response text appears
        const responseText = page.locator('.message.assistant').last();
        await expect(responseText).toContainText('This is a test fallback response');
    });
});
