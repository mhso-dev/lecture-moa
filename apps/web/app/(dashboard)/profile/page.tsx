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
  title: "프로필 설정 | Lecture Moa",
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
          프로필 설정
        </h1>
        <p className="mt-2 text-body text-muted-foreground">
          계정 정보 및 보안 설정을 관리하세요.
        </p>
      </div>

      {/* Section 1: Avatar and Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>프로필 정보</CardTitle>
          <CardDescription>
            이름과 프로필 사진을 변경할 수 있습니다. 이메일 주소는 변경할 수 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSection initialData={initialUser} />
        </CardContent>
      </Card>

      {/* Section 2: Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>비밀번호 변경</CardTitle>
          <CardDescription>
            계정 보안을 위해 비밀번호를 변경하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>
    </div>
  );
}
