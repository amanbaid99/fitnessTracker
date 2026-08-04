import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves a path in /public against the deployment's base path.
 *
 * The site is served from a sub-path on GitHub Pages, and next/image does not
 * rewrite the src of an unoptimized image — so a bare "/images/x.jpg" resolves
 * to the domain root and 404s in production while working perfectly in local
 * dev. Every reference to a public asset from client code goes through here.
 */
export function assetPath(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
