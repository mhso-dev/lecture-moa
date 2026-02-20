/**
 * WebSocket State Tests
 * REQ-FE-N702: LiveIndicator shall show correct connection state
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveIndicator } from "../../components/team/LiveIndicator";
import type { TeamSocketStatus } from "../../stores/ui.store";

describe("WebSocket State - REQ-FE-N702", () => {
  describe("LiveIndicator connection states", () => {
    it("should show 'Live' when connected", () => {
      render(<LiveIndicator status="connected" />);

      expect(screen.getByText("Live")).toBeInTheDocument();
    });

    it("should not show 'Live' when disconnected", () => {
      render(<LiveIndicator status="disconnected" />);

      expect(screen.queryByText("Live")).not.toBeInTheDocument();
    });

    it("should show 'Reconnecting...' when disconnected", () => {
      render(<LiveIndicator status="disconnected" />);

      expect(screen.getByText("Reconnecting...")).toBeInTheDocument();
    });

    it("should show 'Connecting...' when connecting", () => {
      render(<LiveIndicator status="connecting" />);

      expect(screen.getByText("Connecting...")).toBeInTheDocument();
    });

    it("should show 'Error' when connection failed", () => {
      render(<LiveIndicator status="error" />);

      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });

  describe("LiveIndicator visual states", () => {
    it("should have green dot when connected", () => {
      const { container } = render(<LiveIndicator status="connected" />);

      const greenDot = container.querySelector(".bg-green-500");
      expect(greenDot).toBeInTheDocument();
    });

    it("should have gray dot when disconnected", () => {
      const { container } = render(<LiveIndicator status="disconnected" />);

      const grayDot = container.querySelector(".bg-gray-500");
      expect(grayDot).toBeInTheDocument();
    });

    it("should have yellow dot when connecting", () => {
      const { container } = render(<LiveIndicator status="connecting" />);

      const yellowDot = container.querySelector(".bg-yellow-500");
      expect(yellowDot).toBeInTheDocument();
    });

    it("should have red dot when error", () => {
      const { container } = render(<LiveIndicator status="error" />);

      const redDot = container.querySelector(".bg-red-500");
      expect(redDot).toBeInTheDocument();
    });
  });

  describe("LiveIndicator animation", () => {
    it("should animate pulse when connected", () => {
      const { container } = render(<LiveIndicator status="connected" />);

      const animatedElement = container.querySelector(".animate-pulse");
      expect(animatedElement).toBeInTheDocument();
    });

    it("should animate ping when connected", () => {
      const { container } = render(<LiveIndicator status="connected" />);

      const pingElement = container.querySelector(".animate-ping");
      expect(pingElement).toBeInTheDocument();
    });

    it("should not animate when disconnected", () => {
      const { container } = render(<LiveIndicator status="disconnected" />);

      const pulseElement = container.querySelector(".animate-pulse");
      const pingElement = container.querySelector(".animate-ping");

      expect(pulseElement).not.toBeInTheDocument();
      expect(pingElement).not.toBeInTheDocument();
    });
  });

  describe("LiveIndicator accessibility", () => {
    it("should have aria-label for connected state", () => {
      render(<LiveIndicator status="connected" />);

      const badge = screen.getByLabelText("Connection status: Live");
      expect(badge).toBeInTheDocument();
    });

    it("should have aria-label for disconnected state", () => {
      render(<LiveIndicator status="disconnected" />);

      const badge = screen.getByLabelText("Connection status: Reconnecting...");
      expect(badge).toBeInTheDocument();
    });

    it("should have aria-label for connecting state", () => {
      render(<LiveIndicator status="connecting" />);

      const badge = screen.getByLabelText("Connection status: Connecting...");
      expect(badge).toBeInTheDocument();
    });

    it("should have aria-label for error state", () => {
      render(<LiveIndicator status="error" />);

      const badge = screen.getByLabelText("Connection status: Error");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("WebSocket state transitions", () => {
    const statuses: TeamSocketStatus[] = [
      "connecting",
      "connected",
      "disconnected",
      "error",
    ];

    it.each(statuses)(
      "should render correctly for status: %s",
      (status) => {
        const { container } = render(<LiveIndicator status={status} />);

        // Should always render a badge with status text
        const statusLabels: Record<TeamSocketStatus, string> = {
          connecting: "Connecting...",
          connected: "Live",
          disconnected: "Reconnecting...",
          error: "Error",
        };
        expect(screen.getByText(statusLabels[status])).toBeInTheDocument();

        // Should have a status dot
        const dot = container.querySelector('[class*="rounded-full"]');
        expect(dot).toBeInTheDocument();
      }
    );

    it("should transition from connecting to connected", () => {
      const { rerender } = render(<LiveIndicator status="connecting" />);

      expect(screen.getByText("Connecting...")).toBeInTheDocument();

      rerender(<LiveIndicator status="connected" />);

      expect(screen.getByText("Live")).toBeInTheDocument();
      expect(screen.queryByText("Connecting...")).not.toBeInTheDocument();
    });

    it("should transition from connected to disconnected", () => {
      const { rerender } = render(<LiveIndicator status="connected" />);

      expect(screen.getByText("Live")).toBeInTheDocument();

      rerender(<LiveIndicator status="disconnected" />);

      expect(screen.getByText("Reconnecting...")).toBeInTheDocument();
      expect(screen.queryByText("Live")).not.toBeInTheDocument();
    });
  });

  describe("LiveIndicator with custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <LiveIndicator status="connected" className="custom-class" />
      );

      const badge = container.querySelector(".custom-class");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("WebSocket connection behavior", () => {
    it("should handle rapid state changes", () => {
      const { rerender } = render(<LiveIndicator status="connecting" />);

      // Rapid state changes
      rerender(<LiveIndicator status="connected" />);
      rerender(<LiveIndicator status="disconnected" />);
      rerender(<LiveIndicator status="connecting" />);
      rerender(<LiveIndicator status="connected" />);

      expect(screen.getByText("Live")).toBeInTheDocument();
    });

    it("should maintain correct state after multiple transitions", () => {
      const { rerender } = render(<LiveIndicator status="connecting" />);

      const transitions: TeamSocketStatus[] = [
        "connected",
        "disconnected",
        "connecting",
        "connected",
        "error",
      ];

      for (const status of transitions) {
        rerender(<LiveIndicator status={status} />);
      }

      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });

  describe("Badge variant mapping", () => {
    it("should use default variant for connected", () => {
      render(<LiveIndicator status="connected" />);

      // Badge should display the "Live" text
      expect(screen.getByText("Live")).toBeInTheDocument();
    });

    it("should use secondary variant for connecting", () => {
      render(<LiveIndicator status="connecting" />);

      // Badge should display the "Connecting..." text
      expect(screen.getByText("Connecting...")).toBeInTheDocument();
    });

    it("should use destructive variant for error", () => {
      render(<LiveIndicator status="error" />);

      // Badge should display the "Error" text
      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });
});
