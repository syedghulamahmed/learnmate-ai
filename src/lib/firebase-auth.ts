"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function registerWithEmail(email: string, password: string) {
  if (!auth) throw new Error("Firebase is not configured yet.");
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email: string, password: string) {
  if (!auth) throw new Error("Firebase is not configured yet.");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  if (!auth) throw new Error("Firebase is not configured yet.");
  return signOut(auth);
}

export type AuthUser = User;
