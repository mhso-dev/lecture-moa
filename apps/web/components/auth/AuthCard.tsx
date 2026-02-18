import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

/**
 * AuthCard - Common card wrapper for authentication pages
 *
 * Provides a consistent layout for login, register, and password reset forms
 * with optional title, description, and footer.
 */
interface AuthCardProps {
  /** Card heading */
  title: string;
  /** Optional subheading below the title */
  description?: string;
  /** Main content (form fields, etc.) */
  children: ReactNode;
  /** Optional footer content (links, etc.) */
  footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter className="justify-center">{footer}</CardFooter>}
    </Card>
  );
}
