import { BackgroundGradientDemo } from "@/components/demo/BackgroundGradientDemo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Background Gradient Demo - HERA Design System",
  description: "Interactive demonstration of HERA's BackgroundGradient component with multiple variants and enterprise features."
};

export default function BackgroundGradientDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">

      {/* Header */}
      <section className="section py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold ink mb-4">
            Background Gradient Demo
          </h1>
          <p className="text-lg ink-muted max-w-2xl mx-auto">
            Experience HERA's enhanced BackgroundGradient component with universal design tokens,
            multiple variants, and enterprise-grade styling.
          </p>
        </div>
      </section>

      {/* Demo Component */}
      <BackgroundGradientDemo />

      {/* Code Examples */}
      <section className="section py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold ink mb-8 text-center">Usage Examples</h2>

          <div className="space-y-8">
            {/* Basic Usage */}
            <div className="card-glass p-6">
              <h3 className="text-lg font-semibold ink mb-4">Basic Usage</h3>
              <pre className="bg-[var(--surface-veil)] p-4 rounded-lg text-sm ink-muted overflow-x-auto">
{`<BackgroundGradient variant="hera" className="p-6">
  <div className="text-center">
    <h3 className="ink mb-2">Your Content</h3>
    <p className="ink-muted">Beautiful gradient border with glassmorphism background</p>
  </div>
</BackgroundGradient>`}
              </pre>
            </div>

            {/* Variants */}
            <div className="card-glass p-6">
              <h3 className="text-lg font-semibold ink mb-4">Available Variants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium ink mb-2">Design Variants:</p>
                  <ul className="space-y-1 ink-muted">
                    <li><code className="bg-[var(--surface-veil)] px-2 py-1 rounded">hera</code> - Brand gradient</li>
                    <li><code className="bg-[var(--surface-veil)] px-2 py-1 rounded">enterprise</code> - Professional styling</li>
                    <li><code className="bg-[var(--surface-veil)] px-2 py-1 rounded">aurora</code> - Nature-inspired</li>
                    <li><code className="bg-[var(--surface-veil)] px-2 py-1 rounded">rainbow</code> - Vibrant spectrum</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium ink mb-2">Size Options:</p>
                  <ul className="space-y-1 ink-muted">
                    <li><code className="bg-[var(--surface-veil)] px-2 py-1 rounded">sm</code> - 1px border</li>
                    <li><code className="bg-[var(--surface-veil)] px-2 py-1 rounded">md</code> - 2px border (default)</li>
                    <li><code className="bg-[var(--surface-veil)] px-2 py-1 rounded">lg</code> - 3px border</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="card-glass p-6">
              <h3 className="text-lg font-semibold ink mb-4">Enhanced Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium ink mb-2">🎨 HERA Integration</h4>
                  <ul className="text-sm ink-muted space-y-1">
                    <li>• Universal design tokens</li>
                    <li>• Glassmorphism backgrounds</li>
                    <li>• Light/dark mode support</li>
                    <li>• Consistent with HERA branding</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium ink mb-2">⚡ Interactive Effects</h4>
                  <ul className="text-sm ink-muted space-y-1">
                    <li>• Animated gradient rotation</li>
                    <li>• Mouse tracking highlights</li>
                    <li>• Hover state transitions</li>
                    <li>• Performance optimized</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}