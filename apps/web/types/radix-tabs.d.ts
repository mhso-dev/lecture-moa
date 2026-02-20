/**
 * Type declarations for @radix-ui/react-tabs
 */

declare module "@radix-ui/react-tabs" {
  import { ReactNode, ForwardRefExoticComponent, RefAttributes } from "react";

  interface TabsProps {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    orientation?: "horizontal" | "vertical";
    dir?: "ltr" | "rtl";
    activationMode?: "automatic" | "manual";
    children?: ReactNode;
    className?: string;
  }

  interface TabsListProps {
    children?: ReactNode;
    className?: string;
    loop?: boolean;
  }

  interface TabsTriggerProps {
    value: string;
    children?: ReactNode;
    className?: string;
    disabled?: boolean;
  }

  interface TabsContentProps {
    value: string;
    children?: ReactNode;
    className?: string;
    forceMount?: boolean;
  }

  const Root: ForwardRefExoticComponent<TabsProps & RefAttributes<HTMLDivElement>>;
  const List: ForwardRefExoticComponent<TabsListProps & RefAttributes<HTMLDivElement>>;
  const Trigger: ForwardRefExoticComponent<TabsTriggerProps & RefAttributes<HTMLButtonElement>>;
  const Content: ForwardRefExoticComponent<TabsContentProps & RefAttributes<HTMLDivElement>>;

  export { Root, List, Trigger, Content };
}
