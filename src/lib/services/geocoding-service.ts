/**
 * 🌍 HERA Geocoding Service
 *
 * Enterprise-grade geocoding service to convert addresses to GPS coordinates
 * Uses OpenStreetMap Nominatim (free, no API key) with fallback support
 */

export interface GeocodingResult {
  latitude: number
  longitude: number
  accuracy?: number
  displayName?: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
}

export interface GeocodingError {
  message: string
  code: 'NO_RESULTS' | 'INVALID_ADDRESS' | 'API_ERROR' | 'NETWORK_ERROR'
}

class GeocodingService {
  private nominatimBaseUrl = 'https://nominatim.openstreetmap.org'
  private requestDelay = 1000 // Nominatim requires 1 second between requests
  private lastRequestTime = 0

  /**
   * Convert address to GPS coordinates using OpenStreetMap Nominatim
   */
  async geocodeAddress(address: string): Promise<GeocodingResult> {
    console.log('[GeocodingService] Geocoding address:', address)

    if (!address || address.trim().length === 0) {
      throw {
        message: 'Address cannot be empty',
        code: 'INVALID_ADDRESS'
      } as GeocodingError
    }

    // Respect rate limiting
    await this.respectRateLimit()

    try {
      const response = await fetch(
        `${this.nominatimBaseUrl}/search?` +
          new URLSearchParams({
            q: address,
            format: 'json',
            limit: '1',
            addressdetails: '1'
          }),
        {
          headers: {
            'User-Agent': 'HERA-ERP-Salon-Management/1.0' // Required by Nominatim
          }
        }
      )

      if (!response.ok) {
        throw {
          message: `Geocoding API error: ${response.status}`,
          code: 'API_ERROR'
        } as GeocodingError
      }

      const data = await response.json()

      if (!data || data.length === 0) {
        throw {
          message: 'No results found for this address',
          code: 'NO_RESULTS'
        } as GeocodingError
      }

      const result = data[0]

      const geocodingResult: GeocodingResult = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
        address: {
          street: result.address?.road || result.address?.street,
          city: result.address?.city || result.address?.town || result.address?.village,
          state: result.address?.state,
          country: result.address?.country,
          postalCode: result.address?.postcode
        }
      }

      console.log('[GeocodingService] Geocoding successful:', {
        latitude: geocodingResult.latitude,
        longitude: geocodingResult.longitude,
        displayName: geocodingResult.displayName
      })

      return geocodingResult
    } catch (error: any) {
      // Enterprise-grade error logging with full context
      console.error('[GeocodingService] Geocoding error details:', {
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorStack: error?.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      })

      // If it's already a GeocodingError, throw it
      if (error.code && error.message) {
        console.log('[GeocodingService] Re-throwing existing GeocodingError:', error.code, error.message)
        throw error
      }

      // Create a proper GeocodingError with detailed context
      const geocodingError: GeocodingError = {
        message: error?.message || error?.toString() || 'Failed to geocode address',
        code: 'NETWORK_ERROR'
      }

      console.error('[GeocodingService] Created GeocodingError:', geocodingError)
      throw geocodingError
    }
  }

  /**
   * Reverse geocode: Convert GPS coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    console.log('[GeocodingService] Reverse geocoding:', { latitude, longitude })

    if (
      !latitude ||
      !longitude ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw {
        message: 'Invalid coordinates',
        code: 'INVALID_ADDRESS'
      } as GeocodingError
    }

    // Respect rate limiting
    await this.respectRateLimit()

    try {
      const response = await fetch(
        `${this.nominatimBaseUrl}/reverse?` +
          new URLSearchParams({
            lat: latitude.toString(),
            lon: longitude.toString(),
            format: 'json',
            addressdetails: '1'
          }),
        {
          headers: {
            'User-Agent': 'HERA-ERP-Salon-Management/1.0'
          }
        }
      )

      if (!response.ok) {
        throw {
          message: `Reverse geocoding API error: ${response.status}`,
          code: 'API_ERROR'
        } as GeocodingError
      }

      const result = await response.json()

      if (!result || result.error) {
        throw {
          message: 'No address found for these coordinates',
          code: 'NO_RESULTS'
        } as GeocodingError
      }

      const geocodingResult: GeocodingResult = {
        latitude,
        longitude,
        displayName: result.display_name,
        address: {
          street: result.address?.road || result.address?.street,
          city: result.address?.city || result.address?.town || result.address?.village,
          state: result.address?.state,
          country: result.address?.country,
          postalCode: result.address?.postcode
        }
      }

      console.log('[GeocodingService] Reverse geocoding successful:', {
        displayName: geocodingResult.displayName
      })

      return geocodingResult
    } catch (error: any) {
      // Enterprise-grade error logging with full context
      console.error('[GeocodingService] Reverse geocoding error details:', {
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorStack: error?.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      })

      // If it's already a GeocodingError, throw it
      if (error.code && error.message) {
        console.log('[GeocodingService] Re-throwing existing GeocodingError:', error.code, error.message)
        throw error
      }

      // Create a proper GeocodingError with detailed context
      const geocodingError: GeocodingError = {
        message: error?.message || error?.toString() || 'Failed to reverse geocode coordinates',
        code: 'NETWORK_ERROR'
      }

      console.error('[GeocodingService] Created GeocodingError:', geocodingError)
      throw geocodingError
    }
  }

  /**
   * Validate and format address for better geocoding results
   */
  formatAddress(parts: {
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }): string {
    const addressParts = [
      parts.street,
      parts.city,
      parts.state,
      parts.postalCode,
      parts.country
    ].filter(Boolean)

    return addressParts.join(', ')
  }

  /**
   * Respect Nominatim's rate limiting (1 request per second)
   */
  private async respectRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.requestDelay) {
      const waitTime = this.requestDelay - timeSinceLastRequest
      console.log(`[GeocodingService] Rate limiting: waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime = Date.now()
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService()

// Helper function to check if geocoding is available
export function isGeocodingAvailable(): boolean {
  return typeof fetch !== 'undefined'
}

// Helper function to validate coordinates
export function isValidCoordinates(lat?: number, lon?: number): boolean {
  if (lat === undefined || lon === undefined) return false
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}
