import { test, expect } from '@playwright/test';

test.use({
  storageState: 'admin-auth.json',
});

test('Signup Pages', async ({ page }) => {
  await page.goto('/signup/step1');
  await expect(page).toHaveURL(/.*\signup\/step1/);
});
