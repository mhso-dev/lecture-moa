import { test, expect } from "@playwright/test";
import {
  TEST_ACCOUNTS,
  loginAs,
  createTestUser,
  deleteTestUser,
  registerViaUI,
  logout,
} from "./helpers";

// Track dynamically created user IDs for cleanup
const createdUserIds: string[] = [];

test.afterAll(async () => {
  // Clean up all dynamically created test users
  for (const userId of createdUserIds) {
    try {
      await deleteTestUser(userId);
    } catch {
      // Ignore cleanup errors - user may already be deleted
    }
  }
  createdUserIds.length = 0;
});

// ---------------------------------------------------------------------------
// 1. Login Tests
// ---------------------------------------------------------------------------
test.describe("Login", () => {
  test("instructor login redirects to /dashboard/instructor", async ({
    page,
  }) => {
    await loginAs(page, TEST_ACCOUNTS.instructor);

    await page.waitForURL("**/dashboard/instructor", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard\/instructor/);
  });

  test("student login redirects to /dashboard/student", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.student1);

    await page.waitForURL("**/dashboard/student", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard\/student/);
  });

  test("login with invalid credentials shows error message", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.getByLabel("이메일").fill("nonexistent@test.com");
    await page.getByLabel("비밀번호").fill("wrongpassword");
    await page.getByRole("button", { name: "로그인" }).click();

    // Should remain on the login page and show an error
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByText(
        /올바르지|잘못된|유효하지|오류|실패|invalid|error|incorrect|wrong/i
      )
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// 2. Registration Tests
// ---------------------------------------------------------------------------
test.describe("Registration", () => {
  test("register new instructor account", async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-instructor-${timestamp}@e2e.test`;
    const password = "StrongP@ss123!";
    const name = "E2E Instructor";

    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    // Fill in the registration form
    await page.getByLabel("이름").fill(name);
    await page.getByLabel("이메일").fill(email);

    // Password fields - first() for the main password, then confirm
    const passwordInputs = page.getByLabel("비밀번호", { exact: false });
    await passwordInputs.first().fill(password);

    const confirmPw = page.getByLabel("비밀번호 확인");
    if (await confirmPw.isVisible()) {
      await confirmPw.fill(password);
    }

    // Select instructor role via radio/card
    const instructorRole = page.getByRole("radio", { name: /강사/i });
    if (await instructorRole.isVisible()) {
      await instructorRole.click();
    } else {
      // Fallback: try clicking role card text
      await page.getByText("강사").click();
    }

    await page.getByRole("button", { name: "계정 만들기" }).click();

    // Should redirect to dashboard or show success
    await expect(async () => {
      const url = page.url();
      expect(
        url.includes("/dashboard") ||
          url.includes("/login") ||
          url.includes("/verify")
      ).toBeTruthy();
    }).toPass({ timeout: 15_000 });

    // If redirected to login, the registration succeeded but needs login
    // If redirected to dashboard, auto-login after registration
    // If redirected to verify, email confirmation is required

    // Clean up: find the user and delete
    const { createAdminClient } = await import("./helpers");
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers();
    const createdUser = data?.users?.find((u) => u.email === email);
    if (createdUser) {
      createdUserIds.push(createdUser.id);
    }
  });

  test("register new student account", async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-student-${timestamp}@e2e.test`;
    const password = "StrongP@ss123!";
    const name = "E2E Student";

    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    await page.getByLabel("이름").fill(name);
    await page.getByLabel("이메일").fill(email);

    const passwordInputs = page.getByLabel("비밀번호", { exact: false });
    await passwordInputs.first().fill(password);

    const confirmPw = page.getByLabel("비밀번호 확인");
    if (await confirmPw.isVisible()) {
      await confirmPw.fill(password);
    }

    // Select student role via radio/card
    const studentRole = page.getByRole("radio", { name: /학생/i });
    if (await studentRole.isVisible()) {
      await studentRole.click();
    } else {
      await page.getByText("학생").click();
    }

    await page.getByRole("button", { name: "계정 만들기" }).click();

    // Should redirect to dashboard or show success
    await expect(async () => {
      const url = page.url();
      expect(
        url.includes("/dashboard") ||
          url.includes("/login") ||
          url.includes("/verify")
      ).toBeTruthy();
    }).toPass({ timeout: 15_000 });

    // Clean up
    const { createAdminClient } = await import("./helpers");
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers();
    const createdUser = data?.users?.find((u) => u.email === email);
    if (createdUser) {
      createdUserIds.push(createdUser.id);
    }
  });

  test("register with duplicate email shows error", async ({ page }) => {
    // Use the seed instructor email which already exists
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    await page.getByLabel("이름").fill("Duplicate User");
    await page.getByLabel("이메일").fill(TEST_ACCOUNTS.instructor.email);

    const passwordInputs = page.getByLabel("비밀번호", { exact: false });
    await passwordInputs.first().fill("StrongP@ss123!");

    const confirmPw = page.getByLabel("비밀번호 확인");
    if (await confirmPw.isVisible()) {
      await confirmPw.fill("StrongP@ss123!");
    }

    const studentRole = page.getByRole("radio", { name: /학생/i });
    if (await studentRole.isVisible()) {
      await studentRole.click();
    } else {
      await page.getByText("학생").click();
    }

    await page.getByRole("button", { name: "계정 만들기" }).click();

    // Should show duplicate email error and stay on the register page
    await expect(page).toHaveURL(/\/register/, { timeout: 10_000 });
    await expect(
      page.getByText(
        /이미 사용|already|duplicate|존재|registered|등록/i
      )
    ).toBeVisible({ timeout: 10_000 });
  });

  test("register with weak password shows validation error", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    await page.getByLabel("이름").fill("Weak Password User");
    await page.getByLabel("이메일").fill("weak-pw@e2e.test");

    const passwordInputs = page.getByLabel("비밀번호", { exact: false });
    await passwordInputs.first().fill("123"); // Intentionally weak

    const confirmPw = page.getByLabel("비밀번호 확인");
    if (await confirmPw.isVisible()) {
      await confirmPw.fill("123");
    }

    const studentRole = page.getByRole("radio", { name: /학생/i });
    if (await studentRole.isVisible()) {
      await studentRole.click();
    } else {
      await page.getByText("학생").click();
    }

    await page.getByRole("button", { name: "계정 만들기" }).click();

    // Should show password validation error (from Supabase or client-side)
    await expect(
      page.getByText(
        /비밀번호.*짧|최소|자 이상|short|too weak|at least|minimum|문자|약합|오류/i
      )
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// 3. Navigation Tests
// ---------------------------------------------------------------------------
test.describe("Navigation", () => {
  test("navigate from login to register page", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("link", { name: "회원가입" }).click();

    await page.waitForURL("**/register", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/register/);

    // Verify the register form is present
    await expect(
      page.getByRole("button", { name: "계정 만들기" })
    ).toBeVisible();
  });

  test("navigate from register to login page", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("link", { name: "로그인" }).click();

    await page.waitForURL("**/login", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);

    // Verify the login form is present
    await expect(
      page.getByRole("button", { name: "로그인" })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Route Protection Tests
// ---------------------------------------------------------------------------
test.describe("Route Protection", () => {
  test("unauthenticated user accessing /dashboard redirects to /login", async ({
    page,
  }) => {
    // Navigate to protected route without auth; use "commit" to avoid
    // hanging on slow Supabase session checks during redirect
    await page.goto("/dashboard", { waitUntil: "commit" });

    // Middleware redirects to /login?callbackUrl=...
    await page.waitForURL(/\/login/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("authenticated user accessing /login redirects to /dashboard", async ({
    page,
  }) => {
    // First log in
    await loginAs(page, TEST_ACCOUNTS.instructor);
    await page.waitForURL("**/dashboard/instructor", { timeout: 15_000 });

    // Now try accessing /login while authenticated
    await page.goto("/login");

    // Should be redirected back to the dashboard
    await page.waitForURL("**/dashboard", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
