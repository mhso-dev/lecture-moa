"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";

/** Maximum avatar file size in bytes (5 MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Accepted image MIME types */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AvatarUploadProps {
  /** Current avatar URL */
  currentAvatar?: string;
  /** User display name for fallback initials */
  userName: string;
  /** Callback when avatar is successfully uploaded */
  onAvatarChange: (url: string) => void;
}

/**
 * AvatarUpload - Client component for uploading a user avatar
 *
 * - Displays current avatar with fallback initials
 * - Hidden file input triggered by "Change avatar" button
 * - Client-side validation: max 5 MB, image/jpeg | image/png | image/webp
 * - Preview selected image before upload
 * - Upload via FormData POST /api/users/me/avatar
 */
export function AvatarUpload({
  currentAvatar,
  userName,
  onAvatarChange,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  /** Derive initials from the user's name */
  const initials = userName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /** Determine the displayed image URL: preview > current avatar */
  const displayUrl = previewUrl ?? currentAvatar;

  function handleButtonClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WebP image.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }

    // Show local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload to server
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = (await response.json()) as { data: { url: string } };
      onAvatarChange(data.data.url);
      toast.success("Avatar updated");
    } catch {
      // Revert preview on failure
      setPreviewUrl(null);
      toast.error("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploading(false);
      // Revoke the object URL to free memory
      URL.revokeObjectURL(objectUrl);

      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <Avatar className="h-20 w-20">
          {displayUrl ? (
            <AvatarImage src={displayUrl} alt={userName} />
          ) : null}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          disabled={isUploading}
        >
          <Camera className="mr-2 h-4 w-4" />
          Change avatar
        </Button>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, or WebP. Max 5 MB.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload avatar image"
      />
    </div>
  );
}
