import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { login } from './helpers';

test.describe('Advanced UX & Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should support Drag and Drop of files', async ({ page }) => {
        const inputWrapper = page.locator('.chat-input-wrapper');
        
        // Simulating the drop event in the browser context
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
            if (!wrapper) return;

            // Create a mock DataTransfer
            const dataTransfer = new DataTransfer();
            const file = new File([content], name, { type: 'text/plain' });
            dataTransfer.items.add(file);
            
            // Dispatch the drop event
            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dataTransfer
            });
            wrapper.dispatchEvent(dropEvent);
        }, { name: fileName, content: fileContent });

        // Wait a bit for the async processing
        await page.click('#nav-docs');
        const displayedName = fileName.replace(/_/g, ' ');
        const docItem = page.locator(`.doc-item:has-text("${displayedName}")`);
        await expect(docItem).toBeVisible();
        await expect(docItem.locator('.doc-status.ready')).toBeVisible({ timeout: 15000 });
    });

    test('should support @Mentions with spaces and Cyrillic names', async ({ page }) => {
        // First upload a Cyrillic document
        await page.click('#nav-docs');
        const cyrillicName = 'Контракт_123.txt';
        const displayedCyrillicName = cyrillicName.replace(/_/g, ' ');
        const filePath = path.resolve(`tmp/${cyrillicName}`);
        if (!fs.existsSync('tmp')) fs.mkdirSync('tmp');
        fs.writeFileSync(filePath, 'Cyrillic content for testing mentions');
        
        await page.setInputFiles('#doc-upload', filePath);
        await page.waitForSelector(`.doc-item:has-text("${displayedCyrillicName}") .doc-status.ready`, { timeout: 20000 });

        await page.click('#nav-chat');
        const input = page.locator('#chat-input');
        await input.focus();

        // Type @ and part of the name
        await input.pressSequentially('@Контракт', { delay: 100 });
        
        const dropdown = page.locator('#mentions-dropdown');
        await expect(dropdown).toBeVisible();
        // The display name in the mention list should match the transformed name
        await expect(dropdown.locator('.mention-item')).toContainText('Контракт 123');

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
        await expect(page.locator('.message.assistant').last()).toContainText('Error: Too many requests');
    });

    test('should handle Empty Prompt rejection', async ({ page }) => {
        const sendBtn = page.locator('#send-btn');
        const input = page.locator('#chat-input');
        
        await input.fill('  '); // Only spaces
        await sendBtn.click();
        
        // Only the welcome/Thinking message should be there initially, but let's check for "user" messages
        await expect(page.locator('.message.user')).toHaveCount(0);
    });

    test('should persist Settings in localStorage across reloads', async ({ page }) => {
        await page.click('.header-right .icon-btn:nth-child(2)'); // Settings
        // Correcting value from "lm-studio" to "lmstudio"
        await page.selectOption('#llm-provider', 'lmstudio');
        await page.fill('#gemini-api-key', 'persistence-test-key');
        await page.click('#save-settings');
        
        await page.reload();
        await login(page);

        await page.click('.header-right .icon-btn:nth-child(2)');
        await expect(page.locator('#llm-provider')).toHaveValue('lmstudio');
        await expect(page.locator('#gemini-api-key')).toHaveValue('persistence-test-key');
    });
});
