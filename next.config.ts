import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "fitnessTracker";

/**
 * Where this build will be served from — the repo root on GitHub Pages.
 *
 * PAGES_BASE_PATH overrides it, for serving a build from a sub-path (a
 * preview deploy, say). Asset URLs are baked in at build time, so this has to
 * match wherever the files actually end up or every stylesheet 404s.
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
