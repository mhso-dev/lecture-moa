"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { toast } from "sonner";
import { changePasswordSchema, type ChangePasswordSchema } from "@shared";
import { api, ApiClientError } from "~/lib/api";
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

/**
 * PasswordChangeForm - Client component for changing the current user's password
 *
 * Fields: currentPassword, newPassword, confirmNewPassword
 * On submit: POST /api/users/me/password
 * On success: reset form, show success toast
 * On 401: set field error on currentPassword
 */
export function PasswordChangeForm() {
  const form = useForm<ChangePasswordSchema>({
    // Zod 3.25.x type system changes require assertion for hookform resolvers compatibility
    resolver: zodResolver(changePasswordSchema as unknown as ZodType<ChangePasswordSchema>),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: ChangePasswordSchema) {
    try {
      await api.post("/api/users/me/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      form.reset();
      toast.success("비밀번호가 변경되었습니다");
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 401) {
        form.setError("currentPassword", {
          message: "현재 비밀번호가 올바르지 않습니다",
        });
        return;
      }

      const message =
        error instanceof ApiClientError
          ? error.message
          : "비밀번호 변경에 실패했습니다. 다시 시도해 주세요.";
      toast.error(message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>현재 비밀번호</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="현재 비밀번호를 입력하세요"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>새 비밀번호</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="새 비밀번호를 입력하세요"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>새 비밀번호 확인</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="새 비밀번호를 다시 입력하세요"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" loading={isSubmitting}>
          비밀번호 변경
        </Button>
      </form>
    </Form>
  );
}
