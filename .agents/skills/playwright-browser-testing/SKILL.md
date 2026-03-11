---
name: playwright-browser-testing
description: >
  Playwright browser automation and E2E testing reference. Use this skill whenever
  the user mentions browser testing, E2E tests, Playwright, web scraping, visual
  regression, cross-browser testing, test automation, or automating browser
  interactions — even if they just say 'test my web app' or 'check if the page works'.
---

# Playwright Browser Testing

This skill provides expert knowledge for building browser automation and end-to-end tests using **Playwright** — Microsoft's open-source framework for reliable cross-browser testing with auto-waiting, network interception, and first-class TypeScript support.

## When to use

- User wants to write E2E tests for a web application
- User needs to automate browser interactions (clicks, forms, navigation)
- User asks about cross-browser testing (Chromium, Firefox, WebKit)
- User needs visual regression or screenshot comparison testing
- User wants to intercept network requests or mock API responses
- User asks to integrate browser tests into CI/CD pipelines
- User needs to test authenticated flows, file uploads, or multi-tab scenarios

## Core Concepts

### Architecture

Playwright communicates with browsers via the **DevTools Protocol** (Chromium) and custom protocols (Firefox, WebKit), giving it direct control over browser behavior without intermediary drivers.

### Key Advantages

- **Auto-waiting**: No manual waits — Playwright waits for elements to be actionable
- **Web-first assertions**: `expect(locator)` retries until condition passes or timeout
- **Isolation**: Each test gets a fresh browser context (no shared state)
- **Parallelism**: Tests run in parallel by default across worker processes
- **Trace viewer**: Built-in debugging with DOM snapshots, network log, and screenshots

## Instructions

### Project setup

1. **Initialize a new Playwright project**:
```bash
npm init playwright@latest
```

This creates:
- `playwright.config.ts` — configuration file
- `tests/` — test directory
- `tests-examples/` — example tests

2. **Install browsers**:
```bash
npx playwright install
```

3. **Basic config** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

### Writing tests

1. **Basic test structure**:
```typescript
import { test, expect } from '@playwright/test';

test('should display homepage title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/My App/);
});

test('should navigate to about page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL('/about');
});
```

2. **Locator strategies** (prefer in this order):
   - `getByRole`
   - `getByText`
   - `getByLabel`
   - `getByPlaceholder`
   - `getByAltText`
   - `getByTitle`
   - `getByTestId`

3. **Form interactions**:
```typescript
test('should submit login form', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Welcome back')).toBeVisible();
});
```

4. **Assertions** (all auto-retry):
```typescript
await expect(locator).toBeVisible();
await expect(locator).toHaveText('Expected text');
await expect(locator).toHaveCount(3);
await expect(locator).toHaveAttribute('href', '/about');
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveTitle('Dashboard');
```

### Network interception and mocking
```typescript
test('should mock API response', async ({ page }) => {
  await page.route('**/api/users', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 1, name: 'Mock User' }]),
    });
  });

  await page.goto('/users');
  await expect(page.getByText('Mock User')).toBeVisible();
});
```

### Authentication handling

1. **Save auth state** (setup once, reuse across tests):
```typescript
// auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: '.auth/user.json' });
});
```

2. **Use saved state in config**:
```typescript
// In playwright.config.ts projects:
{
  name: 'authenticated',
  use: { storageState: '.auth/user.json' },
  dependencies: ['setup'],
}
```

### Visual regression testing
```typescript
test('should match homepage screenshot', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixelRatio: 0.01,
  });
});

// Update snapshots: npx playwright test --update-snapshots
```

### Page Object Model pattern
```typescript
// pages/LoginPage.ts
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### CI/CD integration

**GitHub Actions**:
```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
```

## Running tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/login.spec.ts

# Run in headed mode (see the browser)
npx playwright test --headed

# Run in UI mode (interactive)
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium

# Debug with step-through
npx playwright test --debug

# Generate test code interactively
npx playwright codegen http://localhost:3000

# View HTML report
npx playwright show-report

# View trace file
npx playwright show-trace trace.zip
```

## Decision Tree

- Need to find an element? → Use `getByRole()` first, then `getByText()`, then `getByTestId()`
- Element not found? → Check if it's inside an iframe (`page.frameLocator()`), shadow DOM, or needs scrolling
- Test is flaky? → Never use `page.waitForTimeout()` — use `expect()` auto-retry or `locator.waitFor()`
- Need to test multiple browsers? → Add projects to config, run with `--project=firefox`
- Need to test mobile? → Use `devices['iPhone 13']` in project config
- Need to test auth? → Use `storageState` pattern to save/restore login
- Need to mock API? → Use `page.route()` to intercept and fulfill
- Need debugging? → Use `--debug` flag, Trace Viewer, or `page.pause()` in code
- Need to generate tests? → Use `npx playwright codegen <url>` for recording
- Need CI integration? → Use official GitHub Action or Docker image `mcr.microsoft.com/playwright`

## Constraints

- **Never use hardcoded waits** (`page.waitForTimeout()`) — always use auto-waiting locators and assertions
- **Never use CSS/XPath selectors** as first choice — prefer accessible locators (`getByRole`, `getByLabel`)
- **Always use web-first assertions** (`expect(locator).toBeVisible()`) instead of manual checks
- **Isolate tests** — do not rely on test execution order, each test should set up its own state
- **Do not share page/context** between tests — Playwright creates fresh context per test
- **Use `test.describe`** for grouping related tests, not for sharing state
- **Pin browser versions** in CI by specifying Playwright version in `package.json`
- **Store screenshots/traces as CI artifacts** — do not commit them to git

## References

- [Official documentation](https://playwright.dev/docs/intro)
- [API reference](https://playwright.dev/docs/api/class-playwright)
- [Best practices](https://playwright.dev/docs/best-practices)
- [GitHub repository](https://github.com/microsoft/playwright)
- [Trace viewer](https://playwright.dev/docs/trace-viewer-intro)
