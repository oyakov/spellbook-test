import { Page, expect } from '@playwright/test';

export async function login(page: Page) {
    const password = process.env.LOGIN_PASSWORD;
    if (!password) {
        throw new Error('LOGIN_PASSWORD environment variable is required for tests.');
    }
    
    // Check if redirect to / occurred or if we are already there
    if (!page.url().includes('://')) {
        await page.goto('/');
    }

    const overlay = page.locator('#login-overlay');
    
    // If overlay is already hidden, we might be logged in via session
    if (await overlay.isHidden()) {
        return;
    }

    await page.fill('#login-password', password);
    await page.click('#login-btn');
    await overlay.waitFor({ state: 'hidden' });
    await expect(overlay).not.toBeVisible();
}
