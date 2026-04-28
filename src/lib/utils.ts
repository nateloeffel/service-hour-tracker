import { randomBytes } from "crypto";

// Short, URL-safe invite token. 10 chars from a 62-char alphabet
// gives ~60 bits of entropy (~1 in a quintillion collision risk),
// which is plenty for an invite code that's also rotatable.
const INVITE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateInviteToken(length = 10): string {
  const bytes = randomBytes(length);
  let token = "";
  for (let i = 0; i < length; i++) {
    token += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  }
  return token;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
