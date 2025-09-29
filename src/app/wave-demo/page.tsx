'use client'

import WaveBackground from '@/components/ui/WaveBackground'
import WaveSection, { WaveHero, WaveFeatures } from '@/components/ui/WaveSection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function WaveDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero with Wave */}
      <WaveHero className="bg-gradient-to-b from-background via-background to-muted/20">
        <h1 className="text-5xl font-bold ink mb-4">
          Wave Background Demo
        </h1>
        <p className="text-xl ink-muted max-w-2xl text-center mb-8">
          Theme-aware SVG wave backgrounds that adapt automatically to light and dark modes.
          GPU-optimized with smooth transitions and no layout thrashing.
        </p>
        <div className="flex gap-4">
          <Button size="lg" className="font-semibold">
            Get Started
          </Button>
          <Button size="lg" variant="outline" className="font-semibold">
            Learn More
          </Button>
        </div>
      </WaveHero>

      {/* Features Section with Waves */}
      <WaveFeatures className="bg-muted/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center ink mb-12">
            Wave Variations
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="ink">Top Wave</CardTitle>
                <CardDescription className="ink-muted">
                  Wave positioned at the top of the section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-40 bg-muted/20 rounded-lg overflow-hidden">
                  <WaveBackground height={120} className="opacity-60" position="top" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="ink">Bottom Wave</CardTitle>
                <CardDescription className="ink-muted">
                  Wave positioned at the bottom
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-40 bg-muted/20 rounded-lg overflow-hidden">
                  <WaveBackground height={120} className="opacity-60" position="bottom" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="ink">No Blur</CardTitle>
                <CardDescription className="ink-muted">
                  Sharp wave without blur effect
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-40 bg-muted/20 rounded-lg overflow-hidden">
                  <WaveBackground height={120} className="opacity-60" blur={false} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </WaveFeatures>

      {/* Color Showcase */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center ink mb-12">
            Theme-Aware Colors
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-xl bg-wave-1 mb-4" />
              <h3 className="font-semibold ink mb-2">Wave 1</h3>
              <p className="text-sm ink-muted">
                Light: Warm Blush<br />
                Dark: Plum Shadow
              </p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-xl bg-wave-2 mb-4" />
              <h3 className="font-semibold ink mb-2">Wave 2</h3>
              <p className="text-sm ink-muted">
                Light: Cool Mist<br />
                Dark: Deep Indigo
              </p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-xl bg-wave-3 mb-4" />
              <h3 className="font-semibold ink mb-2">Wave 3</h3>
              <p className="text-sm ink-muted">
                Light: Peach Veil<br />
                Dark: Teal Charcoal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <WaveSection wavePosition="top" className="py-24 bg-muted/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center ink mb-12">
            Usage Examples
          </h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="ink">Basic Wave Background</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm ink-muted">{`import WaveBackground from '@/components/ui/WaveBackground'

<div className="relative">
  <WaveBackground height={400} className="opacity-60" />
  <div className="relative z-10">Your content here</div>
</div>`}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="ink">Wave Section Wrapper</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm ink-muted">{`import { WaveSection } from '@/components/ui/WaveSection'

<WaveSection wavePosition="both" waveHeight={300}>
  <div className="container">
    Your section content
  </div>
</WaveSection>`}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="ink">Pre-configured Hero</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm ink-muted">{`import { WaveHero } from '@/components/ui/WaveSection'

<WaveHero>
  <h1>Your Hero Title</h1>
  <p>Your hero description</p>
</WaveHero>`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </WaveSection>
    </div>
  )
}