import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('capture screenshots for walkthrough', async ({ page }) => {
    await login(page);

    // 1. Library with Multimedia
    await page.click('#nav-library');
    await page.waitForSelector('.library-item:has-text("Logo Concept")');
    await page.screenshot({ path: 'screenshots/library_multimedia.png' });

    // 2. Mentions Dropdown
    await page.click('#nav-chat');
    const input = page.locator('#chat-input');
    await input.focus();
    await input.pressSequentially('@Logo', { delay: 100 });
    await page.waitForSelector('#mentions-dropdown', { state: 'visible' });
    await page.screenshot({ path: 'screenshots/mentions_dropdown.png' });

    // 3. Chat with Links
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter'); // Actually send it
    await page.waitForSelector('.message.user a.message-link');
    await page.screenshot({ path: 'screenshots/chat_links.png' });
});
