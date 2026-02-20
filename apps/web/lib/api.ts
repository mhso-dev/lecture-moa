/**
 * API Client Re-export
 * This file maintains backward compatibility by re-exporting from the new location.
 * New imports should use: import { api } from "~/lib/api"
 */

export {
  api,
  ApiClient,
  ApiClientError,
  setApiAuthToken,
  getApiAuthToken,
  // Re-export domain-specific API modules
  getMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  toggleMaterialStatus,
  uploadMaterialImage,
} from "./api/index";

// Quiz API functions
export * from "./api/quiz.api";
