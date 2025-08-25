/**
 * Low-level HTTP client for HERA SDK
 * Framework-agnostic (Node + Deno + Browser)
 */

export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  organizationId: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
}

export interface RequestOptions extends RequestInit {
  path: string;
  timeout?: number;
}

export interface HttpResponse<T = any> {
  status: number;
  json: T;
  headers: Headers;
}

export class HttpClient {
  constructor(private config: ClientConfig) {}

  /**
   * Make an HTTP request with automatic header injection and timeout
   */
  async request<T = any>(
    path: string,
    init?: RequestInit
  ): Promise<HttpResponse<T>> {
    const url = new URL(path, this.config.baseUrl);
    const timeout = this.config.timeoutMs || 30000;

    // Merge headers
    const headers = new Headers(init?.headers);
    
    // Set default headers
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('X-Organization-Id', this.config.organizationId);
    
    // Add API key if present
    if (this.config.apiKey) {
      headers.set('Authorization', `Bearer ${this.config.apiKey}`);
    }
    
    // Apply default headers
    if (this.config.defaultHeaders) {
      Object.entries(this.config.defaultHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url.toString(), {
        ...init,
        headers,
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type');
      let json: any;

      if (contentType?.includes('application/json')) {
        json = await response.json();
      } else {
        json = { error: 'Non-JSON response', body: await response.text() };
      }

      return {
        status: response.status,
        json,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
      }
      throw new Error('Unknown error during request');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * GET request helper
   */
  async get<T = any>(path: string, init?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(path, { ...init, method: 'GET' });
  }

  /**
   * POST request helper
   */
  async post<T = any>(
    path: string,
    body?: any,
    init?: RequestInit
  ): Promise<HttpResponse<T>> {
    return this.request<T>(path, {
      ...init,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request helper
   */
  async put<T = any>(
    path: string,
    body?: any,
    init?: RequestInit
  ): Promise<HttpResponse<T>> {
    return this.request<T>(path, {
      ...init,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request helper
   */
  async delete<T = any>(path: string, init?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(path, { ...init, method: 'DELETE' });
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<ClientConfig> {
    return { ...this.config };
  }

  /**
   * Update organization ID
   */
  setOrganizationId(organizationId: string): void {
    this.config.organizationId = organizationId;
  }
}