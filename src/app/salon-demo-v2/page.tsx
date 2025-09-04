"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Building, Globe, Loader2, MapPin, Sparkles, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export default function SalonDemoV2Page() {
  const [salonName, setSalonName] = useState("Hair Talkz Dubai Marina");
  const [desiredSlug, setDesiredSlug] = useState("hair-talkz-marina");
  const [subdomainRouting, setSubdomainRouting] = useState(true);
  const [address, setAddress] = useState("Marina Walk, Dubai");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const base = process.env.NEXT_PUBLIC_TENANT_DOMAIN_BASE ?? "lvh.me:3000";

  const handleBuildSalon = async () => {
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/v1/salon-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salonName, 
          desiredSlug, 
          useSubdomainRouting: subdomainRouting,
          location: {
            lat: 25.0765,
            lng: 55.1332,
            address
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to build salon');
      }

      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        if (data.redirectUrl.startsWith('http')) {
          window.location.href = data.redirectUrl;
        } else {
          router.push(data.redirectUrl);
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Failed to build salon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Build Your Own Salon
          </h1>
          <p className="text-lg !text-gray-600 dark:!text-gray-300 max-w-2xl mx-auto">
            Experience the power of HERA's universal architecture. Create a fully-functional salon management system 
            in under 30 seconds with real data, real features, and real-time deployment.
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
              <Building className="w-5 h-5 !text-purple-600 dark:!text-purple-400" />
              Create Your Salon
            </CardTitle>
            <CardDescription className="!text-gray-600 dark:!text-gray-400">
              Fill in the details below and we'll provision a complete salon management system for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Salon Name */}
            <div className="space-y-2">
              <Label htmlFor="salonName" className="!text-gray-700 dark:!text-gray-300">
                Salon Name
              </Label>
              <Input
                id="salonName"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                placeholder="Enter your salon name"
                className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                disabled={loading}
              />
            </div>

            {/* Subdomain */}
            <div className="space-y-2">
              <Label htmlFor="desiredSlug" className="!text-gray-700 dark:!text-gray-300">
                Desired Subdomain
              </Label>
              <Input
                id="desiredSlug"
                value={desiredSlug}
                onChange={(e) => setDesiredSlug(e.target.value.toLowerCase())}
                placeholder="my-salon"
                className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                disabled={loading}
              />
              <p className="text-xs !text-gray-500 dark:!text-gray-400">
                Preview: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded !text-gray-900 dark:!text-gray-100">
                  http://{desiredSlug || 'my-salon'}.{base}/salon-data
                </code>
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="address" className="!text-gray-700 dark:!text-gray-300">
                Salon Location
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 !text-gray-500 dark:!text-gray-400" />
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter salon address"
                  className="pl-10 !text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Subdomain Routing Option */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="subdomain"
                checked={subdomainRouting}
                onCheckedChange={(checked) => setSubdomainRouting(checked as boolean)}
                disabled={loading}
              />
              <Label 
                htmlFor="subdomain" 
                className="!text-gray-700 dark:!text-gray-300 cursor-pointer"
              >
                <Globe className="inline w-4 h-4 mr-1 !text-gray-500 dark:!text-gray-400" />
                Use subdomain routing (recommended)
              </Label>
            </div>

            {/* Features Preview */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 !text-gray-900 dark:!text-gray-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 !text-purple-600 dark:!text-purple-400" />
                What You'll Get
              </h3>
              <ul className="space-y-1 text-sm !text-gray-600 dark:!text-gray-300">
                <li>✓ Complete salon management dashboard</li>
                <li>✓ 3 pre-configured services with pricing</li>
                <li>✓ 2 professional stylists with specializations</li>
                <li>✓ Appointment booking system</li>
                <li>✓ Client management & history tracking</li>
                <li>✓ Beautiful purple-pink themed UI</li>
                <li>✓ Mobile-responsive Progressive Web App</li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 !text-green-600 dark:!text-green-400" />
                <AlertDescription className="!text-green-800 dark:!text-green-200">
                  Salon created successfully! Redirecting to your new salon...
                </AlertDescription>
              </Alert>
            )}

            {/* Build Button */}
            <Button
              onClick={handleBuildSalon}
              disabled={loading || !salonName || !desiredSlug}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 !text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Building Your Salon...
                </>
              ) : (
                <>
                  <Building className="w-4 h-4 mr-2" />
                  Build My Salon Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm !text-gray-500 dark:!text-gray-400">
          <p>Powered by HERA Universal Architecture</p>
          <p>6 Tables. Infinite Business Complexity. Zero Schema Changes.</p>
        </div>
      </div>
    </div>
  );
}