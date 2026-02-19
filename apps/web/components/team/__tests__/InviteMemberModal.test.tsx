/**
 * InviteMemberModal Component Tests
 * TASK-026: Member invitation modal
 * REQ-FE-722: Email-based member invitation
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { InviteMemberModal } from "../InviteMemberModal";

// Mock dependencies
const mockInvite = vi.fn();
vi.mock("~/hooks/team/useTeamMembership", () => ({
  useTeamMembership: () => ({
    inviteMember: {
      mutate: mockInvite,
      isPending: false,
    },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("InviteMemberModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render modal when open", () => {
    render(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/invite member/i)).toBeInTheDocument();
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

  it("should have email input field", () => {
    render(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter email/i)).toBeInTheDocument();
  });

  it("should validate email format", async () => {
    const user = userEvent.setup();
    render(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /send invite/i });

    // Enter invalid email
    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    expect(mockInvite).not.toHaveBeenCalled();
  });

  it("should call inviteMember with valid email", async () => {
    const user = userEvent.setup();
    mockInvite.mockImplementation((data, options) => {
      options?.onSuccess?.();
    });

    render(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /send invite/i });

    // Enter valid email
    await user.type(emailInput, "valid@example.com");
    await user.click(submitButton);

    expect(mockInvite).toHaveBeenCalledWith(
      { email: "valid@example.com" },
      expect.any(Object)
    );
  });

  it("should close modal after successful invite", async () => {
    const user = userEvent.setup();
    mockInvite.mockImplementation((data, options) => {
      options?.onSuccess?.();
    });

    render(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /send invite/i });

    await user.type(emailInput, "valid@example.com");
    await user.click(submitButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should show error toast on failure", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    mockInvite.mockImplementation((data, options) => {
      options?.onError?.();
    });

    render(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /send invite/i });

    await user.type(emailInput, "valid@example.com");
    await user.click(submitButton);

    expect(toast.error).toHaveBeenCalledWith("Failed to send invitation");
  });

  it("should disable submit button while inviting", () => {
    vi.mock("~/hooks/team/useTeamMembership", () => ({
      useTeamMembership: () => ({
        inviteMember: {
          mutate: vi.fn(),
          isPending: true,
        },
      }),
    }));

    render(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    const submitButton = screen.getByRole("button", { name: /sending/i });
    expect(submitButton).toBeDisabled();
  });

  it("should close on cancel button click", async () => {
    const user = userEvent.setup();
    render(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should clear email input when modal reopens", async () => {
    const { rerender } = render(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput.value).toBe("test@example.com");

    // Close and reopen
    rerender(
      <InviteMemberModal
        teamId="team-1"
        open={false}
        onClose={mockOnClose}
      />
    );
    rerender(
      <InviteMemberModal
        teamId="team-1"
        open={true}
        onClose={mockOnClose}
      />
    );

    const newEmailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(newEmailInput.value).toBe("");
  });
});
