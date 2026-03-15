import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Log console messages from the page
        page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
        await page.goto('/');
    });

    test('should show login overlay when unauthenticated', async ({ page }) => {
        const overlay = page.locator('#login-overlay');
        await overlay.waitFor({ state: 'visible', timeout: 10000 });
        await expect(overlay).toBeVisible();
    });

    test('should fail login with incorrect password', async ({ page }) => {
        await page.fill('#login-password', 'wrong-password');
        await page.click('#login-btn');
        const error = page.locator('#login-error');
        await error.waitFor({ state: 'visible' });
        await expect(error).toBeVisible();
        await expect(error).toHaveText('Invalid password');
    });

    test('should succeed login with correct password', async ({ page }) => {
        await page.fill('#login-password', 'admin123');
        await page.click('#login-btn');
        const overlay = page.locator('#login-overlay');
        await overlay.waitFor({ state: 'hidden' });
        await expect(overlay).not.toBeVisible();
        
        await page.fill('#chat-input', 'Hello');
        await page.click('#send-btn');
        await expect(page.locator('.message.user')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
        await page.fill('#login-password', 'admin123');
        await page.click('#login-btn');
        const overlay = page.locator('#login-overlay');
        await overlay.waitFor({ state: 'hidden' });
        
        await page.click('.header-right .icon-btn:nth-child(2)'); // Settings
        await page.click('#logout-btn');
        
        await overlay.waitFor({ state: 'visible' });
        await expect(overlay).toBeVisible();
    });
});
