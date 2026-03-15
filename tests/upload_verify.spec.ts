import { test, expect } from '@playwright/test';
import path from 'path';
import { login } from './helpers';

test('upload sample documents and verify RAG status', async ({ page }) => {
    await login(page);

    // Click Documents tab
    await page.click('#nav-docs');

    // Verify sidebar section is visible
    const sidebarSection = page.locator('#docs-sidebar-section');
    await expect(sidebarSection).toBeVisible();

    // Upload NDA
    const ndaPath = path.resolve('samples/sample_nda.txt');
    await page.setInputFiles('#doc-upload', ndaPath);

    // Wait for Ready status
    // Our implementation adds a .doc-item with a .doc-status.ready
    await page.waitForSelector('.doc-item .doc-status.ready', { timeout: 30000 });

    // Upload Service Agreement
    const saPath = path.resolve('samples/service_agreement.txt');
    await page.setInputFiles('#doc-upload', saPath);

    // Wait for both to be ready
    await expect(page.locator('.doc-item')).toHaveCount(2);
    await page.waitForSelector('.doc-item:nth-child(2) .doc-status.ready', { timeout: 30000 });

    // Take screenshot of the sidebar
    await sidebarSection.screenshot({ path: 'tests/rag_sidebar_final.png' });

    console.log('RAG Upload Verification Successful!');
});
