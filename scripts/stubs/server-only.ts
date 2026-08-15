// No-op stand-in for the `server-only` package.
//
// See tsconfig.scripts.json for why: scripts and the worker are plain Node
// processes, where the real package throws on import. The app build still uses
// the genuine package, so its client-bundle protection is unaffected.
export {};
