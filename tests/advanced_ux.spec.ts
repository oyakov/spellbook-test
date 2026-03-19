import { test, expect } from '@playwright/test';
import path from 'path';
import { login } from './helpers';

test.describe('Advanced UX & Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should support Drag and Drop of files', async ({ page }) => {
        const inputWrapper = page.locator('.chat-input-wrapper');
        
        // Simulating the drop event in the browser context
        // We use a mocked dataTransfer since direct OS-level drag-drop is limited in headless
        await page.evaluate(() => {
            const wrapper = document.querySelector('.chat-input-wrapper');
            if (wrapper) wrapper.classList.add('drag-active');
        });
        await expect(inputWrapper).toHaveClass(/drag-active/);

        // Actual Drop simulation (File contents)
        const fileName = 'dragged_doc.txt';
        const fileContent = 'This is a dragged legal document content.';
        
        await page.evaluate(async ({ name, content }) => {
            const wrapper = document.querySelector('.chat-input-wrapper');
            const dataTransfer = new DataTransfer();
            const file = new File([content], name, { type: 'text/plain' });
            dataTransfer.items.add(file);
            
            const dropEvent = new DragEvent('drop', {
                dataTransfer: dataTransfer,
                bubbles: true,
                cancelable: true
            });
            wrapper?.dispatchEvent(dropEvent);
        }, { name: fileName, content: fileContent });

        // Verify it upload and show in sidebar
        await page.click('#nav-docs');
        const docItem = page.locator(`.doc-item:has-text("${fileName}")`);
        await expect(docItem).toBeVisible();
        await expect(docItem.locator('.doc-status.ready')).toBeVisible({ timeout: 20000 });
    });

    test('should support @Mentions with spaces and Cyrillic names', async ({ page }) => {
        // First upload a Cyrillic document
        await page.click('#nav-docs');
        const cyrillicName = 'Контракт №123.txt';
        const filePath = path.resolve('tmp/temp_cyrillic.txt');
        require('fs').writeFileSync(filePath, 'Cyrillic content for testing mentions');
        
        await page.setInputFiles('#doc-upload', filePath);
        await page.waitForSelector(`.doc-item:has-text("${cyrillicName}") .doc-status.ready`, { timeout: 20000 });

        await page.click('#nav-chat');
        const input = page.locator('#chat-input');
        await input.focus();

        // Type @ and part of the name
        await input.pressSequentially('@Контракт', { delay: 100 });
        
        const dropdown = page.locator('#mentions-dropdown');
        await expect(dropdown).toBeVisible();
        await expect(dropdown.locator('.mention-item')).toHaveText(new RegExp(cyrillicName));

        // Select it
        await page.keyboard.press('Enter');
        const value = await input.inputValue();
        expect(value).toContain(`@${cyrillicName} `);
    });

    test('should handle Rate Limiting UI (429)', async ({ page }) => {
        // Mock a 429 response for the /api/chat endpoint
        await page.route('/api/chat', route => route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Too many requests' })
        }));

        const input = page.locator('#chat-input');
        await input.fill('Triggering 429...');
        await page.keyboard.press('Enter');

        // Check for error message in chat
        await expect(page.locator('.message.assistant')).toContainText('Error: Too many requests');
    });

    test('should handle Empty Prompt rejection', async ({ page }) => {
        const sendBtn = page.locator('#send-btn');
        const input = page.locator('#chat-input');
        
        await input.fill('  '); // Only spaces
        // The button should be visibly disabled (low opacity or similar) or not clickable
        // In our current style, it might not be formally [disabled], but we check logic
        await sendBtn.click();
        
        // No new user messages should appear
        await expect(page.locator('.message.user')).toHaveCount(0);
    });

    test('should persist Settings in localStorage across reloads', async ({ page }) => {
        await page.click('.header-right .icon-btn:nth-child(2)'); // Settings
        await page.selectOption('#llm-provider', 'lm-studio');
        await page.fill('#gemini-api-key', 'persistence-test-key');
        await page.click('#save-settings');
        
        await page.reload();
        // Login again (mock or real)
        await login(page);

        await page.click('.header-right .icon-btn:nth-child(2)');
        await expect(page.locator('#llm-provider')).toHaveValue('lm-studio');
        await expect(page.locator('#gemini-api-key')).toHaveValue('persistence-test-key');
    });
});
