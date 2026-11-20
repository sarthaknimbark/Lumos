/**
 * Unified Offline Storage Adapter
 *
 * Implemented platform-specifically via:
 *   - storage.native.ts (Android / iOS)
 *   - storage.web.ts (Web browsers)
 */

import { storage as webStorage } from "./storage.web";
export * from "./storage.types";

export const offlineStorage = webStorage;
