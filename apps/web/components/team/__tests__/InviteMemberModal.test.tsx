/**
 * InviteMemberModal Component Tests
 * TASK-026: Member invitation modal
 * REQ-FE-722: Email-based member invitation
 */

/* eslint-disable @typescript-eslint/require-await */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { InviteMemberModal } from "../InviteMemberModal";

// Use vi.hoisted to create a mutable ref accessible in the hoisted mock factory
const { mockInvite, mockIsPendingRef } = vi.hoisted(() => ({
  mockInvite: vi.fn(),
  mockIsPendingRef: { value: false },
}));

vi.mock("~/hooks/team/useTeamMembership", () => ({
  useTeamMembership: () => ({
    inviteMember: {
      mutate: mockInvite,
      get isPending() {
        return mockIsPendingRef.value;
      },
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
    mockIsPendingRef.value = false;
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

  it("should not submit with invalid email format", async () => {
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

    // Enter invalid email - HTML5 type="email" validation prevents form submission
    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    // mutate should not be called since the form doesn't submit
    expect(mockInvite).not.toHaveBeenCalled();
  });

  it("should call inviteMember with valid email", async () => {
    const user = userEvent.setup();
    mockInvite.mockImplementation((_data: unknown, options?: { onSuccess?: () => void }) => {
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
    mockInvite.mockImplementation((_data: unknown, options?: { onSuccess?: () => void }) => {
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
    mockInvite.mockImplementation((_data: unknown, options?: { onError?: () => void }) => {
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
    mockIsPendingRef.value = true;

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

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect((emailInput as HTMLInputElement).value).toBe("test@example.com");

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

    const newEmailInput = screen.getByLabelText(/email/i);
    expect((newEmailInput as HTMLInputElement).value).toBe("");
  });
});
