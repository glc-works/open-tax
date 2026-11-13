# Homebrew

`open-tax` installs from the `glc-works/tap` tap:

```bash
brew tap glc-works/tap
brew install open-tax
```

`brew install glc-works/tap/open-tax` is the same install. `brew tap glc-works/tap` clones [glc-works/homebrew-tap](https://github.com/glc-works/homebrew-tap), and the formula there is `Formula/open-tax.rb`. This directory is the template for that file. Homebrew does not read it from the open-tax checkout.

The command needs Node.js 20 or newer. The formula depends on Homebrew's `node`.

## Publishing a formula update

1. Push a tag `vX.Y.Z` that matches `version` in `packages/open-tax/package.json`. [`.github/workflows/release.yml`](../../.github/workflows/release.yml) runs the test suite, builds the package, and attaches `open-tax-X.Y.Z.tgz` plus `SHA256SUMS` to the GitHub release. It publishes to npm only when the `NPM_TOKEN` secret is set.
2. Copy [`open-tax.rb`](open-tax.rb) to `Formula/open-tax.rb` in `glc-works/homebrew-tap`.
3. Point `url` at the release asset:

   ```
   https://github.com/glc-works/open-tax/releases/download/vX.Y.Z/open-tax-X.Y.Z.tgz
   ```

   The asset is the `npm pack` tarball, so `npm install` inside the formula installs the packed package and its `open-tax` bin.
4. Set `sha256` to the digest printed in `SHA256SUMS`. The all-zero digest in the template is a placeholder.
5. In the tap, run `brew install --build-from-source glc-works/tap/open-tax` and `brew test glc-works/tap/open-tax`.

`brew test` runs `open-tax --version` and `open-tax --help`.
