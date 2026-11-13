# Template for the glc-works/tap Homebrew tap.
#
# `brew tap glc-works/tap` clones https://github.com/glc-works/homebrew-tap.
# Copy this file to Formula/open-tax.rb in that repository. It is not installed
# from this checkout.
#
# After the vX.Y.Z GitHub release exists, set `url` to that release's
# open-tax-X.Y.Z.tgz asset and set `sha256` to the digest in SHA256SUMS.
# The placeholder below will not install a bottle or a source build.

class OpenTax < Formula
  desc "Validate Open-Tax packs and resolve a treatment on a date"
  homepage "https://github.com/glc-works/open-tax"
  url "https://github.com/glc-works/open-tax/releases/download/v0.1.1/open-tax-0.1.1.tgz"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"
  license "Apache-2.0"

  # The CLI and the library require Node.js 20 or newer.
  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/open-tax --version")
    assert_match "validate", shell_output("#{bin}/open-tax --help")
  end
end
