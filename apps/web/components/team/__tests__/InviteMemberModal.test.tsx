/**
 * InviteMemberModal Component Tests
 * TASK-026: Member invitation modal (deprecated stub)
 * SPEC-BE-006: Email invitation replaced by invite code sharing
 */

/* eslint-disable @typescript-eslint/no-deprecated */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { InviteMemberModal } from "../InviteMemberModal";

describe("InviteMemberModal (deprecated stub)", () => {
  const mockOnClose = vi.fn();

  it("should render modal with 'Share Invite Code' title when open", () => {
    render(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Share Invite Code")).toBeInTheDocument();
  });

  it("should show description about invite code sharing", () => {
    render(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText(/invite code sharing/i)
    ).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(
      <InviteMemberModal
        teamId="team-1"
        open={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should call onClose when Close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    // Use getAllByRole since Radix Dialog also renders an X close button with sr-only "Close"
    const closeButtons = screen.getAllByRole("button", { name: /close/i });
    // Click the explicit "Close" button in DialogFooter (last one)
    const lastButton = closeButtons[closeButtons.length - 1];
    if (lastButton) {
      await user.click(lastButton);
    }

    expect(mockOnClose).toHaveBeenCalled();
  });
});
