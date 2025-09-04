"use client";

import { useTransition, useState } from "react";
import { buildMySalon } from "@/app/actions/buildSalon";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Building, Globe, Loader2, MapPin, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SalonDemoPage() {
  const [salonName, setSalonName] = useState("Hair Talkz Dubai Marina");
  const [desiredSlug, setDesiredSlug] = useState("hair-talkz-marina");
  const [subdomainRouting, setSubdomainRouting] = useState(true);
  const [address, setAddress] = useState("Marina Walk, Dubai");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const base = process.env.NEXT_PUBLIC_TENANT_DOMAIN_BASE ?? "lvh.me:3000";

  const handleBuildSalon = () => {
    setError("");
    start(async () => {
      try {
        await buildMySalon({ 
          salonName, 
          desiredSlug, 
          useSubdomainRouting: subdomainRouting,
          location: {
            lat: 25.0765,
            lng: 55.1332,
            address
          }
        });
        // If we get here without an error, the redirect happened
      } catch (err: any) {
        // Check if error contains a redirect digest (which means success)
        if (err.digest?.includes('NEXT_REDIRECT')) {
          // Success - salon was created and redirect is happening
          return;
        }
        // Only show error for actual failures
        setError(err.message || "Failed to build salon");
      }
    });
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
                <MapPin className="inline w-4 h-4 mr-1" />
                Location
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter salon address"
                className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Subdomain Routing */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="subdomainRouting"
                checked={subdomainRouting}
                onCheckedChange={(checked) => setSubdomainRouting(!!checked)}
              />
              <Label
                htmlFor="subdomainRouting"
                className="!text-gray-700 dark:!text-gray-300 cursor-pointer"
              >
                Use subdomain routing (recommended)
              </Label>
            </div>

            {/* What You'll Get */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6">
                <h3 className="font-semibold !text-purple-900 dark:!text-purple-200 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  What You'll Get
                </h3>
                <ul className="space-y-2 !text-purple-700 dark:!text-purple-300 text-sm">
                  <li>✓ Complete salon organization with multi-tenant isolation</li>
                  <li>✓ 6 professional services (Cut & Finish, Color, Keratin, etc.)</li>
                  <li>✓ 4 skilled stylists with commission tracking</li>
                  <li>✓ 5 retail products with inventory management</li>
                  <li>✓ 3 sample customers with loyalty tracking</li>
                  <li>✓ Google Maps integration for your location</li>
                  <li>✓ Professional subdomain (e.g., {desiredSlug || 'my-salon'}.{base})</li>
                  <li>✓ Full appointment booking & POS system</li>
                </ul>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Build Button */}
            <Button
              onClick={handleBuildSalon}
              disabled={pending || !salonName || !desiredSlug}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 !text-white"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Building your salon...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Build My Salon Now
                </>
              )}
            </Button>

            {pending && (
              <div className="text-center">
                <p className="text-sm !text-gray-600 dark:!text-gray-400">
                  Please wait while we provision your salon. This usually takes 10-20 seconds...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg !text-gray-900 dark:!text-gray-100">
                🚀 Instant Deployment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm !text-gray-600 dark:!text-gray-400">
                Your salon will be live and accessible within seconds. No waiting for infrastructure, 
                no complex setup. Just click and go!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg !text-gray-900 dark:!text-gray-100">
                🧬 HERA DNA Powered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm !text-gray-600 dark:!text-gray-400">
                Built on HERA's universal 6-table architecture. Every feature works perfectly 
                with zero schema changes and infinite scalability.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}