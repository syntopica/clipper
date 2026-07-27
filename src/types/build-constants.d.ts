// Injected at build time by esbuild (build.mjs) and by vitest
// (vitest.config.ts), both reading the installed defuddle package. A define
// rather than an import because defuddle's "exports" map does not expose its
// package.json, and a hand-copied literal would drift from the version that
// actually produced the clip.
declare const DEFUDDLE_VERSION: string
