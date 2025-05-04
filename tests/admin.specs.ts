/* eslint-disable */
import { test, expect, Page } from '@playwright/test';

// --- Authentication ---
// Assumes 'adminAuthState.json' is created by a setup script/global setup
// that logs in as an admin user.
test.use({ storageState: 'adminAuthState.json' });

// --- Base URL ---
// Configure baseURL in playwright.config.ts or use full URLs here.
const ADMIN_URL = '/admin';

// --- Helper Functions (Optional) ---
async function switchTab(page: Page, tabName: string) {
  // Use Playwright's role locator for accessibility and robustness
  await page.getByRole('tab', { name: tabName }).click();
  // Add a small wait or check for content if needed after tab switch
  // await page.waitForTimeout(100); // Avoid fixed waits if possible
}

// --- Tests ---
test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin page before each test in this suite
    await page.goto(ADMIN_URL);
    // Wait for a key element to ensure the page is loaded
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
  });

  test('should display main tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Manage Content' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Manage Categories' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Manage Users' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Background Jobs' })).toBeVisible();
  });

  // --- Background Jobs Tab Tests ---
  test.describe('Background Jobs Tab', () => {
    test.beforeEach(async ({ page }) => {
      await switchTab(page, 'Background Jobs');
    });

    test('should display job scheduling buttons and status table', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Schedule Event Scrape' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Schedule Club Scrape' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Recent Job Statuses' })).toBeVisible();
      await expect(page.getByRole('table')).toBeVisible(); // Check if the status table exists
      await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
    });

    test('should show success message after scheduling event job', async ({ page }) => {
      // Mock the API response for scheduling
      await page.route('/api/admin/import/events', async route => {
        await route.fulfill({
          status: 202, // Accepted
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Event scraping job scheduled successfully.', jobId: 'mock-job-id-123' }),
        });
      });

      // Mock the status API response to avoid errors during the test
      await page.route('/api/admin/jobs/status', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.getByRole('button', { name: 'Schedule Event Scrape' }).click();

      // Check for the success alert message
      await expect(page.getByRole('alert')).toContainText('Event scraping job scheduled successfully!');
    });

    test('should show warning message if event job already pending', async ({ page }) => {
      // Mock the API response for scheduling conflict
      await page.route('/api/admin/import/events', async route => {
        await route.fulfill({
          status: 409, // Conflict
          contentType: 'application/json',
          body: JSON.stringify({ message: 'An event scraping job is already pending.' }),
        });
      });

      // Mock the status API response
      await page.route('/api/admin/jobs/status', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.getByRole('button', { name: 'Schedule Event Scrape' }).click();

      // Check for the warning alert message
      await expect(page.getByRole('alert')).toContainText('An event scraping job is already pending.');
      await expect(page.getByRole('alert')).toHaveClass(/alert-warning/); // Check class if needed
    });

    // Add similar test for scheduling club job
  });

  // --- Manage Categories Tab Tests ---
  test.describe('Manage Categories Tab', () => {
    test.beforeEach(async ({ page }) => {
      await switchTab(page, 'Manage Categories');

      // Mock the initial category list fetch
      await page.route('/api/categories', async route => {
        await route.fulfill({ status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'cat1', name: 'Technology', createdAt: new Date().toISOString() },
            { id: 'cat2', name: 'Arts', createdAt: new Date().toISOString() },
          ]) });
      });
      // Wait for list items to potentially appear
      await expect(page.getByText('Technology')).toBeVisible();
    });

    test('should display existing categories and add form', async ({ page }) => {
      await expect(page.getByPlaceholder('New category name...')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add Category' })).toBeVisible();
      await expect(page.getByText('Technology')).toBeVisible();
      await expect(page.getByText('Arts')).toBeVisible();
    });

    test('should add a new category', async ({ page }) => {
      const newCategoryName = `Test Category ${Date.now()}`;

      // Mock the POST request
      await page.route('/api/admin/categories', async (route, request) => {
        if (request.method() === 'POST') {
          const body = request.postDataJSON();
          expect(body.name).toBe(newCategoryName);
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'newCat123', name: newCategoryName, createdAt: new Date().toISOString() }),
          });
        } else {
          route.continue(); // Allow other methods (like initial GET)
        }
      });

      // Mock the GET request after adding to refresh the list
      await page.route('/api/categories', async route => {
        await route.fulfill({ status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'cat1', name: 'Technology', createdAt: new Date().toISOString() },
            { id: 'cat2', name: 'Arts', createdAt: new Date().toISOString() },
            { id: 'newCat123', name: newCategoryName, createdAt: new Date().toISOString() }, // Include the new one
          ]) });
      });

      await page.getByPlaceholder('New category name...').fill(newCategoryName);
      await page.getByRole('button', { name: 'Add Category' }).click();

      // Check if the new category appears in the list
      await expect(page.getByText(newCategoryName)).toBeVisible();
      // Check if input is cleared
      await expect(page.getByPlaceholder('New category name...')).toHaveValue('');
    });

    test('should delete a category after confirmation', async ({ page }) => {
      const categoryToDeleteName = 'Arts';
      const categoryToDeleteId = 'cat2';

      // Mock the DELETE request
      await page.route(`/api/admin/categories/${categoryToDeleteId}`, async (route, request) => {
        expect(request.method()).toBe('DELETE');
        await route.fulfill({
          status: 204, // No Content
        });
      });

      // Mock the GET request after deleting to refresh the list
      await page.route('/api/categories', async route => {
        await route.fulfill({ status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'cat1', name: 'Technology', createdAt: new Date().toISOString() },
          // "Arts" is now removed
          ]) });
      });

      // Find the delete button associated with the 'Arts' category
      // Using locator chaining: find the list item containing 'Arts', then find the button within it
      const artsListItem = page.getByRole('listitem').filter({ hasText: categoryToDeleteName });
      await artsListItem.getByRole('button', { name: 'Delete Category' }).click();

      // Confirmation Modal interaction
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('dialog')).toContainText(`delete the category "${categoryToDeleteName}"`);
      await page.getByRole('button', { name: 'Delete' }).click();

      // Check that the category is gone from the list
      await expect(page.getByText(categoryToDeleteName)).not.toBeVisible();
      await expect(page.getByText('Technology')).toBeVisible(); // Ensure others remain
    });

    test('should show error if deleting a category in use', async ({ page }) => {
      const categoryToDeleteName = 'Technology';
      const categoryToDeleteId = 'cat1';

      // Mock the DELETE request to return a conflict
      await page.route(`/api/admin/categories/${categoryToDeleteId}`, async (route, request) => {
        expect(request.method()).toBe('DELETE');
        await route.fulfill({
          status: 409, // Conflict
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Cannot delete category: It is linked to 5 events.' }),
        });
      });

      const techListItem = page.getByRole('listitem').filter({ hasText: categoryToDeleteName });
      await techListItem.getByRole('button', { name: 'Delete Category' }).click();

      // Confirmation Modal interaction
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: 'Delete' }).click();

      // Check for error message within the modal
      await expect(page.getByRole('dialog').locator('.alert-danger')).toContainText('Cannot delete category: It is linked to 5 events.');

      // Check the category is still visible in the list (deletion failed)
      await expect(page.getByText(categoryToDeleteName)).toBeVisible();

      // Close the modal
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  // --- Manage Users Tab Tests ---
  test.describe('Manage Users Tab', () => {
    test.beforeEach(async ({ page }) => {
      await switchTab(page, 'Manage Users');

      // Mock the initial user list fetch
      await page.route('/api/admin/users?page=1&limit=15', async route => {
        await route.fulfill({ status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              { id: 'user1', name: 'Regular User', email: 'user@test.com', isAdmin: false, createdAt: new Date().toISOString() },
              { id: 'admin2', name: 'Other Admin', email: 'admin2@test.com', isAdmin: true, createdAt: new Date().toISOString() },
              // Assume the logged-in admin (from authState) is 'admin1@test.com', ID 'admin1'
              // We don't include the current admin in the mock list if the API filters them,
              // or include them to test the disabled button. Let's assume API returns all.
              { id: 'admin1', name: 'Current Admin', email: 'admin1@test.com', isAdmin: true, createdAt: new Date().toISOString() },
            ],
            pagination: { page: 1, totalPages: 1, totalItems: 3, limit: 15 },
          }) });
      });
      // Wait for table content
      await expect(page.getByRole('cell', { name: 'user@test.com' })).toBeVisible();
    });

    test('should display users table and search', async ({ page }) => {
      await expect(page.getByPlaceholder('Search by name or email...')).toBeVisible();
      await expect(page.getByRole('table')).toBeVisible();
      await expect(page.getByRole('cell', { name: 'user@test.com' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'admin2@test.com' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'admin1@test.com' })).toBeVisible();
    });

    test('should make a regular user an admin', async ({ page }) => {
      const userIdToPromote = 'user1';
      const userName = 'Regular User';

      // Mock the PATCH request
      await page.route(`/api/admin/users/${userIdToPromote}/role`, async (route, request) => {
        expect(request.method()).toBe('PATCH');
        const body = request.postDataJSON();
        expect(body.isAdmin).toBe(true);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: userIdToPromote, isAdmin: true }) });
      });

      // Find the row for the user, then click the "Make Admin" button
      const userRow = page.getByRole('row').filter({ hasText: userName });
      await userRow.getByRole('button', { name: 'Make Admin' }).click();

      // Confirm in modal
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('dialog')).toContainText(`grant admin privileges for ${userName}`);
      await page.getByRole('button', { name: 'Make Admin' }).click(); // Confirm button in modal

      // Check that the badge/button updated in the table row
      await expect(userRow.getByRole('button', { name: 'Revoke Admin' })).toBeVisible();
    });

    test('should revoke admin status from another admin', async ({ page }) => {
      const userIdToDemote = 'admin2';
      const userName = 'Other Admin';

      // Mock the PATCH request
      await page.route(`/api/admin/users/${userIdToDemote}/role`, async (route, request) => {
        expect(request.method()).toBe('PATCH');
        const body = request.postDataJSON();
        expect(body.isAdmin).toBe(false);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: userIdToDemote, isAdmin: false }) });
      });

      const userRow = page.getByRole('row').filter({ hasText: userName });
      await userRow.getByRole('button', { name: 'Revoke Admin' }).click();

      // Confirm in modal
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('dialog')).toContainText(`revoke admin privileges for ${userName}`);
      await page.getByRole('button', { name: 'Revoke Admin' }).click(); // Confirm button in modal

      // Check that the badge/button updated
      await expect(userRow.getByRole('button', { name: 'Make Admin' })).toBeVisible();
    });

    test('should disable role change button for current admin', async ({ page }) => {
      const currentAdminName = 'Current Admin';
      const userRow = page.getByRole('row').filter({ hasText: currentAdminName });

      // Check if the "Revoke Admin" button exists and is disabled
      await expect(userRow.getByRole('button', { name: 'Revoke Admin' })).toBeDisabled();
      // Check if the "(You)" text is present
      await expect(userRow.getByText('(You)')).toBeVisible();
    });
  });

  // --- Manage Content Tab Tests (Example: Approving an Event) ---
  test.describe('Manage Content Tab', () => {
    test.beforeEach(async ({ page }) => {
      await switchTab(page, 'Manage Content');
      // Ensure the 'Events' sub-tab/section is active by default or click it
      // await page.getByRole('tab', { name: 'Manage Events' }).click(); // If nested tabs exist

      // Mock the initial fetch for PENDING events
      await page.route('/api/admin/events?page=1&limit=10&status=PENDING', async route => {
        await route.fulfill({ status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              { id: 'event1',
                title: 'Pending Event Alpha',
                description: 'Needs approval',
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                hostClub: null },
              { id: 'event2',
                title: 'Pending Event Beta',
                description: 'Also pending',
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                hostClub: { name: 'Test Club' } },
            ],
            pagination: { page: 1, totalPages: 1, totalItems: 2, limit: 10 },
          }) });
      });
      await expect(page.getByRole('cell', { name: 'Pending Event Alpha' })).toBeVisible();
    });

    test('should approve a pending event', async ({ page }) => {
      const eventIdToApprove = 'event1';
      const eventTitle = 'Pending Event Alpha';

      // Mock the PATCH request to update status
      await page.route(`/api/admin/events/${eventIdToApprove}/status`, async (route, request) => {
        expect(request.method()).toBe('PATCH');
        const body = request.postDataJSON();
        expect(body.status).toBe('APPROVED');
        await route.fulfill({ status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: eventIdToApprove, status: 'APPROVED' }) });
      });

      // Find the row and click the Approve button (using title attribute for clarity)
      const eventRow = page.getByRole('row').filter({ hasText: eventTitle });
      await eventRow.getByRole('button', { name: 'Approve' }).click();

      // Check that the status badge updates and Approve button might disappear/change
      await expect(eventRow.getByRole('button', { name: 'Approve' })).not.toBeVisible();
      await expect(eventRow.getByRole('button', { name: 'Reject' })).toBeVisible(); // Reject should still be there
      await expect(eventRow.getByRole('button', { name: 'Set Pending' })).toBeVisible(); // Set Pending should appear
    });

    test('should open create event modal', async ({ page }) => {
      await page.getByRole('button', { name: 'Create New Event' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Create New Event' })).toBeVisible();
      // Close it
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    // Add tests for filtering, rejecting, setting pending, editing, deleting events...
  });
}); // End of Admin Dashboard describe block
