/**
 * Type declarations for @radix-ui/react-tabs
 * @see https://github.com/radix-ui/primitives
 */

declare module "@radix-ui/react-tabs" {
  import { ComponentPropsWithoutRef, ElementRef, ForwardRefExoticComponent, RefAttributes } from "react";

  // Base props shared across Radix primitives
  interface PrimitiveProps {
    asChild?: boolean;
    className?: string;
  }

  export interface TabsProps extends PrimitiveProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    orientation?: "horizontal" | "vertical";
    dir?: "ltr" | "rtl";
    activationMode?: "automatic" | "manual";
    children?: React.ReactNode;
  }

  export interface TabsListProps extends PrimitiveProps {
    loop?: boolean;
    children?: React.ReactNode;
  }

  export interface TabsTriggerProps extends PrimitiveProps {
    value: string;
    disabled?: boolean;
    children?: React.ReactNode;
  }

  export interface TabsContentProps extends PrimitiveProps {
    value: string;
    forceMount?: true;
    children?: React.ReactNode;
  }

  // Component types with displayName for forwardRef components
  interface TabsComponent<P, E extends HTMLElement>
    extends ForwardRefExoticComponent<P & RefAttributes<E>> {
    displayName?: string;
  }

  // Typed exports with proper element refs and displayName
  export const Root: TabsComponent<TabsProps, HTMLDivElement>;
  export const List: TabsComponent<TabsListProps, HTMLDivElement>;
  export const Trigger: TabsComponent<TabsTriggerProps, HTMLButtonElement>;
  export const Content: TabsComponent<TabsContentProps, HTMLDivElement>;

  // Named exports for convenience
  export const Tabs: typeof Root;
  export const TabsList: typeof List;
  export const TabsTrigger: typeof Trigger;
  export const TabsContent: typeof Content;

  // Export types for ComponentPropsWithoutRef and ElementRef usage
  export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps };
}
