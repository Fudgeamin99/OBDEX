import type { User } from './store';

// Sign-in is local to the device until an account service is connected
// (for example Firebase Auth or Supabase, which also provide Google and
// Apple sign-in). Swap these functions for real calls; screens stay as they are.

export class AuthError extends Error {}

export async function signIn(username: string, password: string): Promise<User> {
  if (!username.trim()) throw new AuthError('Enter your username or email.');
  if (password.length < 6) throw new AuthError('Your password is at least 6 characters.');
  const name = username.includes('@') ? username.split('@')[0] : username;
  return { name: name.trim().replace(/\b\w/g, (c) => c.toUpperCase()), email: username.includes('@') ? username.trim() : undefined };
}

export async function register(input: { email: string; name: string; gender: string; password: string; confirm: string }): Promise<User> {
  if (!/^\S+@\S+\.\S+$/.test(input.email)) throw new AuthError('Enter a valid email address.');
  if (!input.name.trim()) throw new AuthError('Enter your full name.');
  if (input.password.length < 6) throw new AuthError('Use at least 6 characters for your password.');
  if (input.password !== input.confirm) throw new AuthError('The two passwords do not match.');
  return { name: input.name.trim(), email: input.email.trim(), gender: input.gender || undefined };
}

export const socialSignInAvailable = false;
