# brain clipper

Manifest V3 Chrome extension that clips the current web page to markdown and
commits it to the private `brain-clips` GitHub repo.

## Development

```bash
pnpm install
pnpm build       # bundles the extension into dist/
pnpm test        # runs the Vitest suite
pnpm typecheck   # runs tsc --noEmit
```

## Signing key

The extension id must stay stable across machines and unpacked loads from
different paths. The private key lives outside version control:

- Canonical copy: `~/p/vault` (see the vault's secrets index).
- Local working copy: `key.pem` at the repo root, ignored by git.
- The corresponding public key (base64 DER) is embedded in
  `src/manifest.json` as the `key` field.

## Loading unpacked

1. Run `pnpm build`.
2. Open `chrome://extensions`, enable Developer mode.
3. Click "Load unpacked" and select the `dist/` directory.
