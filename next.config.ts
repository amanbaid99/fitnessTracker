import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "fitnessTracker";

/**
 * Where this build will be served from.
 *
 * Normally the repo root on GitHub Pages. The deploy workflow also builds the
 * design branch into a sub-path so both can be live on the one Pages site a
 * repository gets — that build sets PAGES_BASE_PATH explicitly.
 */
const basePath =
  process.env.PAGES_BASE_PATH ?? (isGithubPages ? `/${repoName}` : "");

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : "",
};

export default nextConfig;
