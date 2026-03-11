import { test, expect } from '@playwright/test';

test('verify chat input alignment', async ({ page }) => {
    await page.goto('http://localhost:8888');

    // Wait for the input card
    const inputCard = page.locator('.input-card');
    await expect(inputCard).toBeVisible();

    // Specifically check the input wrapper
    const wrapper = page.locator('.chat-input-wrapper');
    await expect(wrapper).toHaveCSS('display', 'flex');

    // Capture the input card area
    await inputCard.screenshot({ path: 'screenshots/chat_input_fix.png' });
});
