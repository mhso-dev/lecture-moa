import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type Page, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Load .env.local for local Supabase keys (no external dependencies)
try {
  const envPath = resolve(__dirname, "../.env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    const key = match?.[1]?.trim();
    const value = match?.[2]?.trim();
    if (key && !process.env[key]) {
      process.env[key] = value ?? "";
    }
  }
} catch {
  // .env.local not found — rely on existing environment variables
}

// Local Supabase configuration (from environment)
const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Test accounts from seed data
export const TEST_ACCOUNTS = {
  instructor: {
    email: "instructor@test.com",
    password: "password123",
    displayName: "Kim Instructor",
    role: "instructor" as const,
  },
  student1: {
    email: "student1@test.com",
    password: "password123",
    displayName: "Lee Student",
    role: "student" as const,
  },
  student2: {
    email: "student2@test.com",
    password: "password123",
    displayName: "Park Student",
    role: "student" as const,
  },
} as const;

// Test data IDs from seed
export const TEST_IDS = {
  instructorId: "11111111-1111-1111-1111-111111111111",
  student1Id: "22222222-2222-2222-2222-222222222222",
  student2Id: "33333333-3333-3333-3333-333333333333",
  publishedCourseId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  draftCourseId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  material1Id: "dddddddd-dddd-dddd-dddd-dddddddddd01",
  material2Id: "dddddddd-dddd-dddd-dddd-dddddddddd02",
  quizId: "99887766-9988-7766-5544-332211009988",
  teamId: "aabbccdd-aabb-ccdd-eeff-aabbccddeeff",
} as const;

// Create admin Supabase client (bypasses RLS)
export function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Create anon Supabase client
export function createAnonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Login via the UI
 */
export async function loginAs(
  page: Page,
  account: (typeof TEST_ACCOUNTS)[keyof typeof TEST_ACCOUNTS]
) {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  // Use specific input selectors to avoid label ambiguity
  await page.locator('input[name="email"]').fill(account.email);
  await page.locator('input[name="password"]').fill(account.password);

  // Click submit and wait for Supabase auth API response
  const authResponse = page.waitForResponse(
    (resp) =>
      resp.url().includes("/auth/v1/token") && resp.request().method() === "POST",
    { timeout: 10_000 }
  );
  await page.locator('button[type="submit"]').click();
  const resp = await authResponse;
  expect(resp.status()).toBe(200);

  // Next.js App Router soft navigation may not include fresh auth cookies.
  // Force a full navigation to let middleware read the session cookies.
  await page.goto("/dashboard");
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

/**
 * Create a new user account via Supabase Admin API
 */
export async function createTestUser(
  email: string,
  password: string,
  displayName: string,
  role: "instructor" | "student"
) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: displayName },
  });
  if (error) throw new Error(`Failed to create user: ${error.message}`);

  // Update the profile role
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role, display_name: displayName })
    .eq("id", data.user.id);
  if (profileError)
    throw new Error(`Failed to update profile: ${profileError.message}`);

  return data.user;
}

/**
 * Delete a test user via Supabase Admin API
 */
export async function deleteTestUser(userId: string) {
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
}

/**
 * Register a new user via the UI
 */
export async function registerViaUI(
  page: Page,
  email: string,
  password: string,
  displayName: string,
  role: "instructor" | "student"
) {
  await page.goto("/register");
  await page.waitForLoadState("domcontentloaded");

  await page.getByLabel(/email|이메일/i).fill(email);
  await page.getByLabel(/password|비밀번호/i).first().fill(password);

  // Fill confirm password if present
  const confirmPw = page.getByLabel(/confirm|확인/i);
  if (await confirmPw.isVisible()) {
    await confirmPw.fill(password);
  }

  await page.getByLabel(/name|이름|닉네임/i).fill(displayName);

  // Select role
  const roleSelector = page.getByLabel(/role|역할/i);
  if (await roleSelector.isVisible()) {
    await roleSelector.selectOption(role);
  } else {
    // Try radio buttons or other role selection
    const roleRadio = page.getByRole("radio", {
      name: new RegExp(role, "i"),
    });
    if (await roleRadio.isVisible()) {
      await roleRadio.click();
    }
  }

  await page.getByRole("button", { name: /register|가입|sign up/i }).click();
}

/**
 * Assert current URL matches pattern
 */
export async function assertUrl(page: Page, pattern: RegExp) {
  await expect(page).toHaveURL(pattern);
}

/**
 * Wait for page to be fully loaded (no pending network)
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Logout the current user
 */
export async function logout(page: Page) {
  // Try to find logout button in various UI locations
  const userMenu = page.getByRole("button", { name: /profile|프로필|user/i });
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.getByRole("menuitem", { name: /logout|로그아웃/i }).click();
  } else {
    const logoutBtn = page.getByRole("button", {
      name: /logout|로그아웃/i,
    });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    }
  }

  await page.waitForURL(/\/(login)?$/);
}
