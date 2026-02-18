"use client";

import type { User } from "@shared";
import { AvatarUpload } from "./AvatarUpload";
import { ProfileForm } from "./ProfileForm";

interface ProfileSectionProps {
  /** Initial user data from server-side session */
  initialData: User;
}

/**
 * ProfileSection - Client wrapper that combines AvatarUpload and ProfileForm
 *
 * Needed because AvatarUpload requires an onAvatarChange callback,
 * which cannot be passed directly from a Server Component.
 */
export function ProfileSection({ initialData }: ProfileSectionProps) {
  return (
    <div className="space-y-6">
      <AvatarUpload
        currentAvatar={initialData.image}
        userName={initialData.name}
        onAvatarChange={() => {
          // Avatar URL is persisted by the upload endpoint.
          // Session update on next request will reflect the new avatar.
        }}
      />
      <ProfileForm initialData={initialData} />
    </div>
  );
}
