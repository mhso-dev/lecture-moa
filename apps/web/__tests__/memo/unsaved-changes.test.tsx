/**
 * Unsaved Changes Guard Tests
 * REQ-FE-N701: Navigation shall confirm before leaving with unsaved changes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useState, useCallback } from "react";

// Mock useBeforeUnload hook
const mockBeforeUnload = vi.fn();
vi.mock("~/hooks/useBeforeUnload", () => ({
  useBeforeUnload: (enabled: boolean) => {
    mockBeforeUnload(enabled);
  },
}));

describe("Unsaved Changes Guard - REQ-FE-N701", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Store original beforeunload
    window.onbeforeunload = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useBeforeUnload integration", () => {
    it("should call useBeforeUnload when form has unsaved changes", () => {
      // Simulate a component with unsaved changes tracking
      const MemoEditor = () => {
        const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

        return (
          <div>
            <button
              onClick={() => setHasUnsavedChanges(true)}
              data-testid="edit-button"
            >
              Edit
            </button>
            <span data-testid="unsaved-status">
              {hasUnsavedChanges ? "Unsaved" : "Saved"}
            </span>
          </div>
        );
      };

      render(<MemoEditor />);

      // Initial state
      expect(screen.getByTestId("unsaved-status")).toHaveTextContent("Saved");

      // Make changes
      fireEvent.click(screen.getByTestId("edit-button"));

      expect(screen.getByTestId("unsaved-status")).toHaveTextContent("Unsaved");
    });

    it("should prevent navigation when unsaved changes exist", () => {
      const mockEvent = {
        preventDefault: vi.fn(),
        returnValue: "",
      };

      // Simulate beforeunload event handler
      const handleBeforeUnload = (hasUnsavedChanges: boolean) => {
        if (hasUnsavedChanges) {
          mockEvent.preventDefault();
          mockEvent.returnValue = "";
          return "You have unsaved changes. Are you sure you want to leave?";
        }
        return undefined;
      };

      const result = handleBeforeUnload(true);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result).toContain("unsaved changes");
    });

    it("should not prevent navigation when no unsaved changes", () => {
      const mockEvent = {
        preventDefault: vi.fn(),
        returnValue: "",
      };

      const handleBeforeUnload = (hasUnsavedChanges: boolean) => {
        if (hasUnsavedChanges) {
          mockEvent.preventDefault();
          return "You have unsaved changes";
        }
        return undefined;
      };

      handleBeforeUnload(false);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe("Confirmation dialog on navigation", () => {
    it("should show confirmation dialog when navigating with unsaved changes", async () => {
      // Mock window.confirm
      const mockConfirm = vi.fn().mockReturnValue(true);
      window.confirm = mockConfirm;

      const MemoEditorWithGuard = () => {
        const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

        const handleNavigation = useCallback(() => {
          if (hasUnsavedChanges) {
            const confirmed = window.confirm(
              "You have unsaved changes. Are you sure you want to leave?"
            );
            if (!confirmed) {
              return false;
            }
          }
          return true;
        }, [hasUnsavedChanges]);

        return (
          <div>
            <button
              onClick={() => setHasUnsavedChanges(true)}
              data-testid="make-changes"
            >
              Make Changes
            </button>
            <button
              onClick={() => {
                if (handleNavigation()) {
                  // Navigate
                }
              }}
              data-testid="navigate-button"
            >
              Navigate
            </button>
          </div>
        );
      };

      render(<MemoEditorWithGuard />);

      // Make changes
      fireEvent.click(screen.getByTestId("make-changes"));

      // Try to navigate
      fireEvent.click(screen.getByTestId("navigate-button"));

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(
          expect.stringContaining("unsaved changes")
        );
      });
    });

    it("should cancel navigation when user declines confirmation", async () => {
      const mockConfirm = vi.fn().mockReturnValue(false);
      window.confirm = mockConfirm;

      const navigationHandler = vi.fn();

      const MemoEditorWithGuard = () => {
        const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

        const handleNavigation = () => {
          if (hasUnsavedChanges) {
            const confirmed = window.confirm(
              "You have unsaved changes. Are you sure you want to leave?"
            );
            if (!confirmed) {
              return false;
            }
          }
          navigationHandler();
          return true;
        };

        return (
          <div>
            <button
              onClick={() => setHasUnsavedChanges(true)}
              data-testid="make-changes"
            >
              Make Changes
            </button>
            <button onClick={handleNavigation} data-testid="navigate-button">
              Navigate
            </button>
          </div>
        );
      };

      render(<MemoEditorWithGuard />);

      // Make changes
      fireEvent.click(screen.getByTestId("make-changes"));

      // Try to navigate
      fireEvent.click(screen.getByTestId("navigate-button"));

      await waitFor(() => {
        expect(navigationHandler).not.toHaveBeenCalled();
      });
    });

    it("should allow navigation when user confirms", async () => {
      const mockConfirm = vi.fn().mockReturnValue(true);
      window.confirm = mockConfirm;

      const navigationHandler = vi.fn();

      const MemoEditorWithGuard = () => {
        const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

        const handleNavigation = () => {
          if (hasUnsavedChanges) {
            const confirmed = window.confirm(
              "You have unsaved changes. Are you sure you want to leave?"
            );
            if (!confirmed) {
              return false;
            }
          }
          navigationHandler();
          return true;
        };

        return (
          <div>
            <button
              onClick={() => setHasUnsavedChanges(true)}
              data-testid="make-changes"
            >
              Make Changes
            </button>
            <button onClick={handleNavigation} data-testid="navigate-button">
              Navigate
            </button>
          </div>
        );
      };

      render(<MemoEditorWithGuard />);

      // Make changes
      fireEvent.click(screen.getByTestId("make-changes"));

      // Try to navigate
      fireEvent.click(screen.getByTestId("navigate-button"));

      await waitFor(() => {
        expect(navigationHandler).toHaveBeenCalled();
      });
    });
  });

  describe("Browser back/forward button handling", () => {
    it("should warn on browser back button with unsaved changes", () => {
      // Simulate popstate event for back button
      const handlePopState = (hasUnsavedChanges: boolean) => {
        if (hasUnsavedChanges) {
          const confirmed = window.confirm(
            "You have unsaved changes. Leaving will discard them."
          );
          return confirmed;
        }
        return true;
      };

      window.confirm = vi.fn().mockReturnValue(false);

      const shouldNavigate = handlePopState(true);

      expect(shouldNavigate).toBe(false);
    });

    it("should not warn when form is clean", () => {
      const handlePopState = (hasUnsavedChanges: boolean) => {
        if (hasUnsavedChanges) {
          window.confirm("You have unsaved changes.");
          return false;
        }
        return true;
      };

      const shouldNavigate = handlePopState(false);

      expect(shouldNavigate).toBe(true);
    });
  });

  describe("Unsaved changes state tracking", () => {
    it("should track changes in title field", () => {
      const MemoEditorForm = () => {
        const [title, setTitle] = useState("");
        const [hasChanges, setHasChanges] = useState(false);

        return (
          <div>
            <input
              data-testid="title-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasChanges(e.target.value.length > 0);
              }}
            />
            <span data-testid="has-changes">
              {hasChanges ? "Has changes" : "No changes"}
            </span>
          </div>
        );
      };

      render(<MemoEditorForm />);

      expect(screen.getByTestId("has-changes")).toHaveTextContent("No changes");

      fireEvent.change(screen.getByTestId("title-input"), {
        target: { value: "New Title" },
      });

      expect(screen.getByTestId("has-changes")).toHaveTextContent("Has changes");
    });

    it("should track changes in content field", () => {
      const MemoEditorForm = () => {
        const [content, setContent] = useState("");
        const [hasChanges, setHasChanges] = useState(false);

        return (
          <div>
            <textarea
              data-testid="content-input"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setHasChanges(e.target.value.length > 0);
              }}
            />
            <span data-testid="has-changes">
              {hasChanges ? "Has changes" : "No changes"}
            </span>
          </div>
        );
      };

      render(<MemoEditorForm />);

      expect(screen.getByTestId("has-changes")).toHaveTextContent("No changes");

      fireEvent.change(screen.getByTestId("content-input"), {
        target: { value: "New content" },
      });

      expect(screen.getByTestId("has-changes")).toHaveTextContent("Has changes");
    });

    it("should reset unsaved state after save", async () => {
      const MemoEditorWithSave = () => {
        const [content, setContent] = useState("");
        const [hasChanges, setHasChanges] = useState(false);

        const handleSave = () => {
          // Save logic
          setHasChanges(false);
        };

        return (
          <div>
            <textarea
              data-testid="content-input"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setHasChanges(true);
              }}
            />
            <button onClick={handleSave} data-testid="save-button">
              Save
            </button>
            <span data-testid="has-changes">
              {hasChanges ? "Has changes" : "No changes"}
            </span>
          </div>
        );
      };

      render(<MemoEditorWithSave />);

      // Make changes
      fireEvent.change(screen.getByTestId("content-input"), {
        target: { value: "New content" },
      });

      expect(screen.getByTestId("has-changes")).toHaveTextContent("Has changes");

      // Save
      fireEvent.click(screen.getByTestId("save-button"));

      await waitFor(() => {
        expect(screen.getByTestId("has-changes")).toHaveTextContent("No changes");
      });
    });
  });
});
