import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "~/lib/auth";
import type { User, UserRole } from "@shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ProfileSection } from "~/components/profile/ProfileSection";
import { PasswordChangeForm } from "~/components/profile/PasswordChangeForm";

export const metadata: Metadata = {
  title: "Profile Settings | Lecture Moa",
};

/**
 * Profile Settings Page (Server Component)
 *
 * - Requires authentication (redirects to /login if no session)
 * - Passes initial user data from session to client components
 * - Two sections: Avatar + Profile info, Password change
 */
export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Map Supabase user to shared User type for client components
  const initialUser: User = {
    id: user.id,
    email: user.email ?? "",
    name: (user.user_metadata.name as string | undefined) ?? "",
    role: (user.user_metadata.role as UserRole | undefined) ?? "student",
    image: (user.user_metadata.avatar_url as string | undefined) ?? undefined,
    createdAt: new Date(user.created_at),
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-h1 font-semibold text-foreground">
          Profile Settings
        </h1>
        <p className="mt-2 text-body text-muted-foreground">
          Manage your account information and security settings.
        </p>
      </div>

      {/* Section 1: Avatar and Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your name and avatar. Your email address cannot be changed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSection initialData={initialUser} />
        </CardContent>
      </Card>

      {/* Section 2: Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>
    </div>
  );
}
