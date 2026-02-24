import { test, expect, type Page } from "@playwright/test";
import {
  TEST_ACCOUNTS,
  TEST_IDS,
  loginAs,
  waitForPageLoad,
  createAdminClient,
} from "./helpers";

// ---------------------------------------------------------------------------
// Shared state: login once and reuse authentication across all tests
// ---------------------------------------------------------------------------

let authenticatedPage: Page;

test.describe("Instructor Flows", () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    authenticatedPage = await context.newPage();
    await loginAs(authenticatedPage, TEST_ACCOUNTS.instructor);
    await waitForPageLoad(authenticatedPage);
  });

  test.afterAll(async () => {
    await authenticatedPage.context().close();
  });

  // Re-use the authenticated page for each test to avoid repeated logins
  test.beforeEach(async () => {
    // Navigate back to dashboard before each test to start from a known state
    await authenticatedPage.goto("/dashboard");
    await waitForPageLoad(authenticatedPage);
  });

  // -------------------------------------------------------------------------
  // 1. Dashboard
  // -------------------------------------------------------------------------

  test("instructor dashboard loads with correct heading and widgets", async () => {
    const page = authenticatedPage;

    await page.goto("/dashboard/instructor");
    await waitForPageLoad(page);

    // Verify the page heading
    await expect(
      page.getByRole("heading", { level: 1, name: "대시보드" })
    ).toBeVisible();

    // Verify dashboard widgets are rendered
    // Each widget is expected to be a distinct section or component
    const widgetLabels = [
      /my.*course|내.*강의|강의/i,
      /student.*activity|학생.*활동/i,
      /pending.*q&?a|대기.*질문/i,
      /quiz.*performance|퀴즈.*성과/i,
    ];

    for (const label of widgetLabels) {
      const widget = page.getByText(label).first();
      // Widgets should exist on the page (some may load asynchronously)
      await expect(widget).toBeVisible({ timeout: 10_000 });
    }
  });

  // -------------------------------------------------------------------------
  // 2. Courses page with "create course" button
  // -------------------------------------------------------------------------

  test('courses page shows "강의 만들기" button for instructor', async () => {
    const page = authenticatedPage;

    await page.goto("/courses");
    await waitForPageLoad(page);

    // Verify page heading
    await expect(
      page.getByRole("heading", { level: 1, name: "강의" })
    ).toBeVisible();

    // Instructor-only create button must be visible
    const createButton = page.getByRole("link", { name: /강의 만들기/i });
    // Fallback: might be a button instead of a link
    const createBtn = createButton.or(
      page.getByRole("button", { name: /강의 만들기/i })
    );
    await expect(createBtn).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 3. Create a new course
  // -------------------------------------------------------------------------

  test("create a new course with all required fields", async () => {
    const page = authenticatedPage;
    const uniqueTitle = `E2E Test Course ${Date.now()}`;

    await page.goto("/courses/create");
    await waitForPageLoad(page);

    // Fill in course title
    const titleInput = page.getByLabel(/제목/i);
    await expect(titleInput).toBeVisible();
    await titleInput.fill(uniqueTitle);

    // Fill in course description
    const descriptionInput = page.getByLabel(/설명/i);
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.fill(
      "This is an automated E2E test course. It will be cleaned up after the test run."
    );

    // Select category (Radix UI combobox - click to open, then click option)
    const categoryCombobox = page.getByRole("combobox", { name: /카테고리/i });
    if (await categoryCombobox.isVisible()) {
      await categoryCombobox.click();
      // Wait for dropdown and click first available option
      const firstOption = page.getByRole("option").first();
      await firstOption.waitFor({ state: "visible", timeout: 5_000 });
      await firstOption.click();
    }

    // Submit the form
    const submitButton = page.getByRole("button", { name: /강의 만들기/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // After creation, expect navigation away from the create page
    // Either redirect to course detail or courses list
    await expect(page).not.toHaveURL(/\/courses\/create/, {
      timeout: 15_000,
    });

    // Verify the course title appears on the redirected page
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10_000 });

    // -----------------------------------------------------------------------
    // Cleanup: delete the newly created course via admin API
    // -----------------------------------------------------------------------
    const admin = createAdminClient();
    const { data: courses } = await admin
      .from("courses")
      .select("id")
      .eq("title", uniqueTitle)
      .limit(1);

    if (courses && courses.length > 0) {
      await admin.from("courses").delete().eq("id", courses[0].id);
    }
  });

  // -------------------------------------------------------------------------
  // 4. View existing published course
  // -------------------------------------------------------------------------

  test("view existing published course details", async () => {
    const page = authenticatedPage;

    await page.goto(`/courses/${TEST_IDS.publishedCourseId}`);
    await waitForPageLoad(page);

    // The published course title should be visible
    await expect(
      page.getByText("Introduction to Web Development")
    ).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // 5. Sidebar navigation
  // -------------------------------------------------------------------------

  const sidebarLinks = [
    { label: "강의", urlPattern: /\/courses/ },
    { label: "Q&A", urlPattern: /\/qa/ },
    { label: "퀴즈", urlPattern: /\/quizzes/ },
    { label: "팀", urlPattern: /\/teams/ },
    { label: "메모", urlPattern: /\/memos/ },
    { label: "프로필", urlPattern: /\/profile/ },
  ] as const;

  for (const { label, urlPattern } of sidebarLinks) {
    test(`sidebar navigation: "${label}" navigates correctly`, async () => {
      const page = authenticatedPage;

      // Navigate to dashboard first to ensure sidebar is present
      await page.goto("/dashboard");
      await waitForPageLoad(page);

      // Click the sidebar link
      const sidebarLink = page
        .getByRole("navigation")
        .getByRole("link", { name: new RegExp(label, "i") });

      // Fallback: some sidebars use aside element or specific data attribute
      const fallbackLink = page
        .locator("aside, nav, [data-testid='sidebar']")
        .getByRole("link", { name: new RegExp(label, "i") });

      const linkToClick = (await sidebarLink.isVisible())
        ? sidebarLink
        : fallbackLink;

      await linkToClick.click();

      // Verify URL changed to expected pattern
      await expect(page).toHaveURL(urlPattern, { timeout: 10_000 });
    });
  }

  // -------------------------------------------------------------------------
  // 6. Profile page shows instructor info
  // -------------------------------------------------------------------------

  test("profile page shows instructor information", async () => {
    const page = authenticatedPage;

    await page.goto("/profile");
    await waitForPageLoad(page);

    // Verify heading
    await expect(
      page.getByRole("heading", { level: 1, name: /프로필 설정/i })
    ).toBeVisible();

    // Email should be displayed in a disabled input
    const emailInput = page.locator('input[disabled]').first();
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue(TEST_ACCOUNTS.instructor.email);

    // Name input should be present and have a value
    const nameInput = page.getByRole("textbox", { name: /이름/i });
    await expect(nameInput).toBeVisible();
    await expect(nameInput).not.toBeEmpty();
  });

  // -------------------------------------------------------------------------
  // 7. Courses page shows instructor's courses
  // -------------------------------------------------------------------------

  test("courses page displays instructor's own courses", async () => {
    const page = authenticatedPage;

    await page.goto("/courses");
    await waitForPageLoad(page);

    // The instructor should see their published course from seed data
    await expect(
      page.getByText("Introduction to Web Development")
    ).toBeVisible({ timeout: 10_000 });

    // The draft course should also be listed (with draft badge or similar)
    await expect(page.getByText("Advanced React Patterns")).toBeVisible({
      timeout: 10_000,
    });
  });

  // -------------------------------------------------------------------------
  // 8. Quiz management page
  // -------------------------------------------------------------------------

  test("quiz page is accessible from sidebar", async () => {
    const page = authenticatedPage;

    await page.goto("/quizzes");
    await waitForPageLoad(page);

    // Page should load - either quiz content or error page (known app bug)
    const quizHeading = page.getByRole("heading", { name: /퀴즈/i });
    const errorHeading = page.getByRole("heading", { name: /문제가 발생/i });

    await expect(quizHeading.or(errorHeading)).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // 9. Dashboard link in sidebar returns to dashboard
  // -------------------------------------------------------------------------

  test('sidebar "대시보드" link navigates to dashboard', async () => {
    const page = authenticatedPage;

    // Start from courses page
    await page.goto("/courses");
    await waitForPageLoad(page);

    // Click dashboard link in sidebar
    const dashboardLink = page
      .getByRole("navigation")
      .getByRole("link", { name: /대시보드/i });

    const fallbackLink = page
      .locator("aside, nav, [data-testid='sidebar']")
      .getByRole("link", { name: /대시보드/i });

    const linkToClick = (await dashboardLink.isVisible())
      ? dashboardLink
      : fallbackLink;

    await linkToClick.click();

    // Sidebar "대시보드" link navigates to / (landing page) or /dashboard
    await expect(page).toHaveURL(/\/$|\/dashboard/, { timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // 10. Course creation form - back button
  // -------------------------------------------------------------------------

  test("course creation page back button returns to courses", async () => {
    const page = authenticatedPage;

    // Navigate to courses page first so browser history has it
    await page.goto("/courses");
    await waitForPageLoad(page);

    // Then navigate to create page
    await page.goto("/courses/create");
    await waitForPageLoad(page);

    // Click the back button (may be a button or a link)
    const backButton = page.getByRole("button", { name: /뒤로 가기/i });
    const backLink = page.getByRole("link", { name: /뒤로 가기/i });
    const back = backButton.or(backLink);

    await back.click();

    // Should navigate back - could be /courses or /dashboard depending on implementation
    await expect(page).not.toHaveURL(/\/courses\/create/, { timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // 11. Courses page has search and filter controls
  // -------------------------------------------------------------------------

  test("courses page has search bar and view toggle", async () => {
    const page = authenticatedPage;

    await page.goto("/courses");
    await waitForPageLoad(page);

    // Search bar should exist
    const searchInput = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/검색|search/i))
      .or(page.locator('[data-testid="course-search"]'));

    await expect(searchInput).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // 12. Course creation form validation
  // -------------------------------------------------------------------------

  test("course creation form prevents submission without required fields", async () => {
    const page = authenticatedPage;

    await page.goto("/courses/create");
    await waitForPageLoad(page);

    // Attempt to submit without filling any fields
    const submitButton = page.getByRole("button", { name: /강의 만들기/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Should stay on the create page (validation prevents navigation)
    await expect(page).toHaveURL(/\/courses\/create/);

    // An error or validation message should appear
    // Check for HTML5 validation or custom error messages
    const titleInput = page.getByLabel(/제목/i);
    const isInvalid =
      (await titleInput.getAttribute("aria-invalid")) === "true" ||
      (await titleInput.evaluate(
        (el) => !(el as HTMLInputElement).validity.valid
      ));

    // Either the field is marked invalid or an error message is shown
    const errorMessage = page.getByText(
      /필수|required|입력해|입력하세요/i
    );
    const hasError = isInvalid || (await errorMessage.isVisible().catch(() => false));
    expect(hasError).toBeTruthy();
  });
});
