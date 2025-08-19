// ================================================================================
// HERA ERP GEOGRAPHIC ANALYTICS
// Enhanced user location tracking and analytics
// ================================================================================

import { NextRequest } from 'next/server';
import { heraMetrics } from './prometheus-metrics';

interface LocationData {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  latitude?: string;
  longitude?: string;
  asn?: string;
  isp?: string;
}

interface EnhancedGeoData {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isp: string;
  continent: string;
  isEU: boolean;
}

export class GeoAnalytics {
  
  /**
   * Extract comprehensive location data from request
   */
  static extractLocationData(req: NextRequest): LocationData {
    // Next.js Edge Runtime provides geo data
    const geo = req.geo;
    
    return {
      country: geo?.country || this.getCountryFromHeaders(req),
      city: geo?.city || 'Unknown',
      region: geo?.region || 'Unknown',
      timezone: this.getTimezoneFromHeaders(req),
      latitude: geo?.latitude,
      longitude: geo?.longitude,
      // Additional ISP/ASN data from Cloudflare headers
      asn: req.headers.get('cf-connecting-ip') ? this.getASNFromHeaders(req) : undefined,
      isp: req.headers.get('cf-ipcountry') ? 'Cloudflare' : 'Unknown'
    };
  }

  /**
   * Track user location with enhanced analytics
   */
  static trackUserLocation(req: NextRequest, page: string, businessType?: string) {
    const location = this.extractLocationData(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const deviceType = this.getDeviceType(userAgent);
    
    // Track page views with location
    heraMetrics.counter('hera_page_views_location', {
      page,
      country: location.country || 'unknown',
      country_code: this.getCountryCode(location.country),
      region: location.region || 'unknown',
      city: location.city || 'unknown',
      timezone: location.timezone || 'unknown',
      device_type: deviceType,
      business_type: businessType || 'general',
      continent: this.getContinent(location.country)
    });

    // Track ISP/Network analytics
    if (location.isp && location.asn) {
      heraMetrics.counter('hera_network_analytics', {
        country: location.country || 'unknown',
        isp: location.isp,
        asn: location.asn,
        device_type: deviceType
      });
    }

    // Track timezone distribution for optimal support hours
    heraMetrics.counter('hera_timezone_distribution', {
      timezone: location.timezone || 'unknown',
      business_type: businessType || 'general'
    });
  }

  /**
   * Track business conversion by geography
   */
  static trackGeoConversion(
    req: NextRequest, 
    conversionType: 'trial_started' | 'trial_completed' | 'production_converted',
    businessType: string,
    success: boolean
  ) {
    const location = this.extractLocationData(req);
    
    heraMetrics.counter('hera_geo_conversions', {
      conversion_type: conversionType,
      business_type: businessType,
      country: location.country || 'unknown',
      region: location.region || 'unknown',
      city: location.city || 'unknown',
      success: success.toString(),
      continent: this.getContinent(location.country)
    });

    // Track high-value geographic markets
    if (this.isHighValueMarket(location.country)) {
      heraMetrics.counter('hera_premium_market_activity', {
        country: location.country || 'unknown',
        business_type: businessType,
        conversion_type: conversionType,
        success: success.toString()
      });
    }
  }

  /**
   * Get country from various headers
   */
  private static getCountryFromHeaders(req: NextRequest): string {
    // Cloudflare country header
    const cfCountry = req.headers.get('cf-ipcountry');
    if (cfCountry && cfCountry !== 'XX') return cfCountry;
    
    // Accept-Language header as fallback
    const acceptLanguage = req.headers.get('accept-language');
    if (acceptLanguage) {
      const match = acceptLanguage.match(/[a-z]{2}-([A-Z]{2})/);
      if (match) return match[1];
    }
    
    return 'Unknown';
  }

  /**
   * Get timezone from headers
   */
  private static getTimezoneFromHeaders(req: NextRequest): string {
    // Try to get timezone from Cloudflare
    const cfTimezone = req.headers.get('cf-timezone');
    if (cfTimezone) return cfTimezone;
    
    // Fallback to geographic estimation
    const country = req.geo?.country;
    return this.estimateTimezone(country);
  }

  /**
   * Get ASN (Autonomous System Number) from headers
   */
  private static getASNFromHeaders(req: NextRequest): string {
    const cfASN = req.headers.get('cf-connecting-asn');
    return cfASN || 'unknown';
  }

  /**
   * Detect device type from user agent
   */
  private static getDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone/.test(userAgent)) return 'mobile';
    if (/iPad|Tablet/.test(userAgent)) return 'tablet';
    if (/Smart-TV|SMART-TV/.test(userAgent)) return 'tv';
    return 'desktop';
  }

  /**
   * Get country code from country name
   */
  private static getCountryCode(country?: string): string {
    const countryMap: Record<string, string> = {
      'United States': 'US',
      'United Kingdom': 'GB',
      'Canada': 'CA',
      'Germany': 'DE',
      'France': 'FR',
      'Australia': 'AU',
      'Japan': 'JP',
      'India': 'IN',
      'Brazil': 'BR',
      'Mexico': 'MX',
      'Spain': 'ES',
      'Italy': 'IT',
      'Netherlands': 'NL',
      'Switzerland': 'CH',
      'Singapore': 'SG'
    };
    
    return countryMap[country || ''] || country?.substring(0, 2).toUpperCase() || 'XX';
  }

  /**
   * Get continent from country
   */
  private static getContinent(country?: string): string {
    const continentMap: Record<string, string> = {
      'US': 'North America', 'CA': 'North America', 'MX': 'North America',
      'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'ES': 'Europe', 'IT': 'Europe', 'NL': 'Europe', 'CH': 'Europe',
      'JP': 'Asia', 'IN': 'Asia', 'SG': 'Asia', 'CN': 'Asia',
      'AU': 'Oceania', 'NZ': 'Oceania',
      'BR': 'South America', 'AR': 'South America', 'CO': 'South America',
      'ZA': 'Africa', 'NG': 'Africa', 'KE': 'Africa'
    };
    
    const countryCode = this.getCountryCode(country);
    return continentMap[countryCode] || 'Unknown';
  }

  /**
   * Estimate timezone from country
   */
  private static estimateTimezone(country?: string): string {
    const timezoneMap: Record<string, string> = {
      'US': 'America/New_York',
      'CA': 'America/Toronto', 
      'GB': 'Europe/London',
      'DE': 'Europe/Berlin',
      'FR': 'Europe/Paris',
      'AU': 'Australia/Sydney',
      'JP': 'Asia/Tokyo',
      'IN': 'Asia/Kolkata',
      'BR': 'America/Sao_Paulo',
      'SG': 'Asia/Singapore'
    };
    
    const countryCode = this.getCountryCode(country);
    return timezoneMap[countryCode] || 'UTC';
  }

  /**
   * Check if country is a high-value market
   */
  private static isHighValueMarket(country?: string): boolean {
    const highValueMarkets = [
      'US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'SG', 'CH', 'NL', 'SE', 'NO', 'DK'
    ];
    
    const countryCode = this.getCountryCode(country);
    return highValueMarkets.includes(countryCode);
  }

  /**
   * Get geographic analytics summary
   */
  static getGeoAnalyticsSummary() {
    return {
      metrics_collected: [
        'hera_page_views_location',
        'hera_network_analytics', 
        'hera_timezone_distribution',
        'hera_geo_conversions',
        'hera_premium_market_activity'
      ],
      data_points: [
        'Country & Country Code',
        'Region & City', 
        'Timezone',
        'ISP & Network (ASN)',
        'Device Type',
        'Continent',
        'High-Value Market Classification'
      ],
      business_intelligence: [
        'Geographic conversion rates',
        'Timezone-based support optimization',
        'Premium market identification',
        'Regional business type preferences',
        'Network performance by ISP'
      ]
    };
  }
}

// Export singleton instance
export const geoAnalytics = GeoAnalytics;