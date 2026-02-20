/**
 * Supabase Storage Layer Tests
 *
 * Tests for course image and material image upload/delete operations,
 * public URL generation, filename sanitization, and content type detection.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  uploadCourseImage,
  deleteCourseImage,
  uploadMaterialImage,
  deleteMaterialImage,
  getStoragePublicUrl,
} from "~/lib/supabase/storage";

// --- Mock setup ---

const mockStorageBucket = {
  upload: vi.fn(),
  remove: vi.fn(),
  getPublicUrl: vi.fn(),
};

const mockStorage = {
  from: vi.fn(() => mockStorageBucket),
};

const mockSupabaseClient = {
  storage: mockStorage,
};

vi.mock("~/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// --- Helpers ---

const PUBLIC_URL_BASE = "https://example.supabase.co/storage/v1/object/public";

function makePublicUrl(bucket: string, path: string): string {
  return `${PUBLIC_URL_BASE}/${bucket}/${path}`;
}

function createMockFile(
  name: string,
  sizeInBytes: number,
  type = "image/png",
): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: sizeInBytes });
  return file;
}

// --- Tests ---

describe("Supabase Storage Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(1234567890);

    // Default: getPublicUrl returns a well-formed URL
    mockStorageBucket.getPublicUrl.mockImplementation((path: string) => {
      // Derive bucket from the last mockStorage.from call
      const bucket = (mockStorage.from.mock.calls.at(-1) as string[] | undefined)?.[0] ?? "unknown";
      return { data: { publicUrl: makePublicUrl(bucket, path) } };
    });
  });

  // ----------------------------------------------------------------
  // uploadCourseImage
  // ----------------------------------------------------------------
  describe("uploadCourseImage", () => {
    it("should upload a file and return the public URL", async () => {
      mockStorageBucket.upload.mockResolvedValue({
        data: { path: "course-1/1234567890-photo.png" },
        error: null,
      });

      const file = createMockFile("photo.png", 1024);
      const url = await uploadCourseImage("course-1", file);

      // Verify storage.from was called with the correct bucket
      expect(mockStorage.from).toHaveBeenCalledWith("course-images");

      // Verify upload was called with correct path, file, and options
      expect(mockStorageBucket.upload).toHaveBeenCalledWith(
        "course-1/1234567890-photo.png",
        file,
        {
          contentType: "image/png",
          upsert: true,
        },
      );

      // Verify the returned URL
      expect(url).toBe(
        makePublicUrl(
          "course-images",
          "course-1/1234567890-photo.png",
        ),
      );
    });

    it("should throw when file exceeds 5MB limit", async () => {
      const oversizedFile = createMockFile(
        "huge.png",
        6 * 1024 * 1024, // 6MB
      );

      await expect(
        uploadCourseImage("course-1", oversizedFile),
      ).rejects.toThrow("File size exceeds the 5MB limit for course images");

      // Must NOT call supabase at all
      expect(mockStorageBucket.upload).not.toHaveBeenCalled();
    });

    it("should allow a file exactly at the 5MB limit", async () => {
      mockStorageBucket.upload.mockResolvedValue({
        data: { path: "c/1234567890-exact.png" },
        error: null,
      });

      const exactFile = createMockFile("exact.png", 5 * 1024 * 1024);
      await expect(
        uploadCourseImage("c", exactFile),
      ).resolves.toBeDefined();

      expect(mockStorageBucket.upload).toHaveBeenCalled();
    });

    it("should throw when Supabase returns an upload error", async () => {
      mockStorageBucket.upload.mockResolvedValue({
        data: null,
        error: { message: "Bucket not found" },
      });

      const file = createMockFile("test.png", 1024);

      await expect(
        uploadCourseImage("course-1", file),
      ).rejects.toThrow(
        "Failed to upload course image to course-images/course-1/1234567890-test.png: Bucket not found",
      );
    });

    it("should construct path as {courseId}/{timestamp}-{sanitized-name}", async () => {
      mockStorageBucket.upload.mockResolvedValue({
        data: { path: "" },
        error: null,
      });

      const file = createMockFile("My Photo (1).PNG", 1024);
      await uploadCourseImage("abc-123", file);

      const callArgs = mockStorageBucket.upload.mock.calls[0]!;
      expect(callArgs[0]).toBe("abc-123/1234567890-my-photo-1-.png");
    });

    it("should detect content type for jpg files", async () => {
      mockStorageBucket.upload.mockResolvedValue({
        data: { path: "" },
        error: null,
      });

      const file = createMockFile("photo.jpg", 512);
      await uploadCourseImage("c", file);

      expect(mockStorageBucket.upload).toHaveBeenCalledWith(
        expect.any(String),
        file,
        expect.objectContaining({ contentType: "image/jpeg" }),
      );
    });

    it("should detect content type for webp files", async () => {
      mockStorageBucket.upload.mockResolvedValue({
        data: { path: "" },
        error: null,
      });

      const file = createMockFile("image.webp", 512);
      await uploadCourseImage("c", file);

      expect(mockStorageBucket.upload).toHaveBeenCalledWith(
        expect.any(String),
        file,
        expect.objectContaining({ contentType: "image/webp" }),
      );
    });

    it("should fall back to application/octet-stream for unknown extensions", async () => {
      mockStorageBucket.upload.mockResolvedValue({
        data: { path: "" },
        error: null,
      });

      const file = createMockFile("document.bmp", 512);
      await uploadCourseImage("c", file);

      expect(mockStorageBucket.upload).toHaveBeenCalledWith(
        expect.any(String),
        file,
        expect.objectContaining({ contentType: "application/octet-stream" }),
      );
    });
  });

  // ----------------------------------------------------------------
  // deleteCourseImage
  // ----------------------------------------------------------------
  describe("deleteCourseImage", () => {
    it("should delete a course image successfully", async () => {
      mockStorageBucket.remove.mockResolvedValue({
        data: [{ name: "course-1/photo.png" }],
        error: null,
      });

      await expect(
        deleteCourseImage("course-1", "photo.png"),
      ).resolves.toBeUndefined();

      expect(mockStorage.from).toHaveBeenCalledWith("course-images");
      expect(mockStorageBucket.remove).toHaveBeenCalledWith([
        "course-1/photo.png",
      ]);
    });

    it("should throw when Supabase returns a delete error", async () => {
      mockStorageBucket.remove.mockResolvedValue({
        data: null,
        error: { message: "Object not found" },
      });

      await expect(
        deleteCourseImage("course-1", "missing.png"),
      ).rejects.toThrow(
        "Failed to delete course image at course-images/course-1/missing.png: Object not found",
      );
    });
  });

  // ----------------------------------------------------------------
  // uploadMaterialImage
  // ----------------------------------------------------------------
  describe("uploadMaterialImage", () => {
    it("should upload a material image and return the public URL", async () => {
      mockStorageBucket.upload.mockResolvedValue({
        data: { path: "c1/m1/1234567890-diagram.png" },
        error: null,
      });

      const file = createMockFile("diagram.png", 2048);
      const url = await uploadMaterialImage("c1", "m1", file);

      expect(mockStorage.from).toHaveBeenCalledWith("material-images");
      expect(mockStorageBucket.upload).toHaveBeenCalledWith(
        "c1/m1/1234567890-diagram.png",
        file,
        {
          contentType: "image/png",
          upsert: true,
        },
      );
      expect(url).toBe(
        makePublicUrl("material-images", "c1/m1/1234567890-diagram.png"),
      );
    });

    it("should throw when file exceeds 10MB limit", async () => {
      const oversizedFile = createMockFile(
        "large.png",
        11 * 1024 * 1024, // 11MB
      );

      await expect(
        uploadMaterialImage("c1", "m1", oversizedFile),
      ).rejects.toThrow("File size exceeds the 10MB limit for material images");

      expect(mockStorageBucket.upload).not.toHaveBeenCalled();
    });

    it("should allow a file exactly at the 10MB limit", async () => {
      mockStorageBucket.upload.mockResolvedValue({
        data: { path: "" },
        error: null,
      });

      const exactFile = createMockFile("exact.png", 10 * 1024 * 1024);
      await expect(
        uploadMaterialImage("c1", "m1", exactFile),
      ).resolves.toBeDefined();

      expect(mockStorageBucket.upload).toHaveBeenCalled();
    });

    it("should throw when Supabase returns an upload error", async () => {
      mockStorageBucket.upload.mockResolvedValue({
        data: null,
        error: { message: "Storage limit exceeded" },
      });

      const file = createMockFile("img.png", 1024);

      await expect(
        uploadMaterialImage("c1", "m1", file),
      ).rejects.toThrow(
        "Failed to upload material image to material-images/c1/m1/1234567890-img.png: Storage limit exceeded",
      );
    });

    it("should construct path as {courseId}/{materialId}/{timestamp}-{sanitized-name}", async () => {
      mockStorageBucket.upload.mockResolvedValue({
        data: { path: "" },
        error: null,
      });

      const file = createMockFile("Screen Shot 2024.png", 1024);
      await uploadMaterialImage("course-x", "mat-y", file);

      const callArgs = mockStorageBucket.upload.mock.calls[0]!;
      expect(callArgs[0]).toBe(
        "course-x/mat-y/1234567890-screen-shot-2024.png",
      );
    });

    it("should detect content type for svg files", async () => {
      mockStorageBucket.upload.mockResolvedValue({
        data: { path: "" },
        error: null,
      });

      const file = createMockFile("icon.svg", 512);
      await uploadMaterialImage("c", "m", file);

      expect(mockStorageBucket.upload).toHaveBeenCalledWith(
        expect.any(String),
        file,
        expect.objectContaining({ contentType: "image/svg+xml" }),
      );
    });
  });

  // ----------------------------------------------------------------
  // deleteMaterialImage
  // ----------------------------------------------------------------
  describe("deleteMaterialImage", () => {
    it("should delete a material image successfully", async () => {
      mockStorageBucket.remove.mockResolvedValue({
        data: [{ name: "c1/m1/diagram.png" }],
        error: null,
      });

      await expect(
        deleteMaterialImage("c1", "m1", "diagram.png"),
      ).resolves.toBeUndefined();

      expect(mockStorage.from).toHaveBeenCalledWith("material-images");
      expect(mockStorageBucket.remove).toHaveBeenCalledWith([
        "c1/m1/diagram.png",
      ]);
    });

    it("should throw when Supabase returns a delete error", async () => {
      mockStorageBucket.remove.mockResolvedValue({
        data: null,
        error: { message: "Permission denied" },
      });

      await expect(
        deleteMaterialImage("c1", "m1", "secret.png"),
      ).rejects.toThrow(
        "Failed to delete material image at material-images/c1/m1/secret.png: Permission denied",
      );
    });

    it("should construct the correct path with all three segments", async () => {
      mockStorageBucket.remove.mockResolvedValue({
        data: [],
        error: null,
      });

      await deleteMaterialImage("course-abc", "material-xyz", "file.jpg");

      expect(mockStorageBucket.remove).toHaveBeenCalledWith([
        "course-abc/material-xyz/file.jpg",
      ]);
    });
  });

  // ----------------------------------------------------------------
  // getStoragePublicUrl
  // ----------------------------------------------------------------
  describe("getStoragePublicUrl", () => {
    it("should return publicUrl from Supabase response", () => {
      const url = getStoragePublicUrl(
        "course-images",
        "course-1/photo.png",
      );

      expect(mockStorage.from).toHaveBeenCalledWith("course-images");
      expect(mockStorageBucket.getPublicUrl).toHaveBeenCalledWith(
        "course-1/photo.png",
      );
      expect(url).toBe(
        makePublicUrl("course-images", "course-1/photo.png"),
      );
    });

    it("should pass any bucket and path through to Supabase", () => {
      getStoragePublicUrl("custom-bucket", "some/deep/path/file.webp");

      expect(mockStorage.from).toHaveBeenCalledWith("custom-bucket");
      expect(mockStorageBucket.getPublicUrl).toHaveBeenCalledWith(
        "some/deep/path/file.webp",
      );
    });
  });

  // ----------------------------------------------------------------
  // Filename sanitization edge cases
  // ----------------------------------------------------------------
  describe("Filename Sanitization (via upload functions)", () => {
    beforeEach(() => {
      mockStorageBucket.upload.mockResolvedValue({
        data: { path: "" },
        error: null,
      });
    });

    it("should replace spaces and special characters with hyphens", async () => {
      const file = createMockFile("My File (copy) [2].png", 100);
      await uploadCourseImage("c", file);

      const uploadedPath = mockStorageBucket.upload.mock.calls[0]![0] as string;
      // Spaces become hyphens, parentheses/brackets become hyphens, consecutive hyphens collapsed
      expect(uploadedPath).toBe("c/1234567890-my-file-copy-2-.png");
    });

    it("should convert uppercase to lowercase", async () => {
      const file = createMockFile("UPPERCASE.PNG", 100);
      await uploadCourseImage("c", file);

      const uploadedPath = mockStorageBucket.upload.mock.calls[0]![0] as string;
      expect(uploadedPath).toBe("c/1234567890-uppercase.png");
    });

    it("should preserve dots and hyphens in filenames", async () => {
      const file = createMockFile("my-file.v2.0.png", 100);
      await uploadCourseImage("c", file);

      const uploadedPath = mockStorageBucket.upload.mock.calls[0]![0] as string;
      expect(uploadedPath).toBe("c/1234567890-my-file.v2.0.png");
    });

    it("should collapse consecutive hyphens into one", async () => {
      const file = createMockFile("a   b___c.png", 100);
      await uploadCourseImage("c", file);

      const uploadedPath = mockStorageBucket.upload.mock.calls[0]![0] as string;
      // "a   b___c" -> lowercase "a   b___c" -> replace non-alnum: "a---b---c" -> collapse: "a-b-c"
      expect(uploadedPath).toBe("c/1234567890-a-b-c.png");
    });
  });
});
