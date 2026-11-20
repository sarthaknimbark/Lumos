/**
 * Better Auth client for MyDay (Expo / React Native + Web)
 *
 * Uses the Expo client plugin to handle:
 *  - Native: Bearer token stored in SecureStore
 *  - Web: HTTP-only cookie (managed by browser)
 *
 * Usage:
 *   import { authClient } from '@/src/auth/client';
 *   const { data: session } = await authClient.getSession();
 *   await authClient.signIn.email({ email, password });
 *   await authClient.signIn.social({ provider: 'google' });
 *   await authClient.signOut();
 */

import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { storage } from "./storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/api/auth`,
  plugins: [
    expoClient({
      scheme: "myday",
      storagePrefix: "myday",
      storage,
    }),
  ],
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
