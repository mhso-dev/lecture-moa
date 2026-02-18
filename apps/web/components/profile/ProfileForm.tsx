"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { updateProfileSchema, type UpdateProfileSchema, type User } from "@shared";
import { api, ApiClientError } from "~/lib/api";
import { useAuthStore } from "~/stores/auth.store";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "~/components/ui/form";

interface ProfileFormProps {
  /** Initial user data from server-side session */
  initialData: User;
}

/**
 * ProfileForm - Client component for editing user profile
 *
 * Fields:
 * - name: Editable text input (pre-filled from session)
 * - email: Read-only display field
 *
 * On submit: PATCH /api/users/me, refresh next-auth session, update Zustand store
 */
export function ProfileForm({ initialData }: ProfileFormProps) {
  const { update } = useSession();
  const setUser = useAuthStore((state) => state.setUser);

  const form = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: initialData.name,
    },
  });

  const {
    formState: { isDirty, isSubmitting },
  } = form;

  async function onSubmit(data: UpdateProfileSchema) {
    try {
      await api.patch("/api/users/me", data);

      // Refresh next-auth session to reflect updated user data
      await update();

      // Update Zustand auth store with new values
      const updatedUser: User = {
        ...initialData,
        ...(data.name !== undefined && { name: data.name }),
      };
      setUser(updatedUser);

      // Reset form dirty state with new default values
      form.reset({ name: data.name });

      toast.success("Profile updated successfully");
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Failed to update profile. Please try again.";
      toast.error(message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Email (read-only) */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Email</label>
          <Input
            type="email"
            value={initialData.email}
            disabled
            className="bg-muted"
          />
        </div>

        {/* Name (editable) */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={!isDirty || isSubmitting}
          loading={isSubmitting}
        >
          Save changes
        </Button>
      </form>
    </Form>
  );
}
