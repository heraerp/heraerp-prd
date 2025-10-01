// Enterprise-grade documentation portal authentication
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// Secure environment variables (set these in .env.local)
const DOCS_PASSWORD_HASH = process.env.DOCS_PASSWORD_HASH || '$2a$12$K.gW.HW8HhV2rW.ZQZPYOOzH0qI0JvDMFhO5yM7PqB6cYwAk9B5K2'; // Default: "HeraDocsSecure2024!"
const JWT_SECRET = process.env.DOCS_JWT_SECRET || 'hera-docs-secret-key-change-in-production';
const COOKIE_NAME = 'hera-docs-auth';
const SESSION_DURATION = 8 * 60 * 60; // 8 hours

// IP whitelist for additional security (optional)
const ALLOWED_IPS = process.env.DOCS_ALLOWED_IPS?.split(',') || [];

export interface DocsAuthResult {
  authenticated: boolean;
  error?: string;
  requiresAuth?: boolean;
}

export async function verifyDocsAccess(req: NextRequest): Promise<DocsAuthResult> {
  // Check IP whitelist if configured
  if (ALLOWED_IPS.length > 0) {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!ALLOWED_IPS.includes(clientIp)) {
      return { authenticated: false, error: 'Access denied from this IP address' };
    }
  }

  // Check for auth cookie
  const authCookie = req.cookies.get(COOKIE_NAME);
  if (!authCookie) {
    return { authenticated: false, requiresAuth: true };
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(authCookie.value, JWT_SECRET) as any;
    
    // Check token expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return { authenticated: false, requiresAuth: true };
    }

    return { authenticated: true };
  } catch (error) {
    return { authenticated: false, requiresAuth: true };
  }
}

export async function authenticateDocs(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // Verify password against hash
    const isValid = await bcrypt.compare(password, DOCS_PASSWORD_HASH);
    
    if (!isValid) {
      return { success: false, error: 'Invalid password' };
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        type: 'docs-access',
        timestamp: Date.now(),
      },
      JWT_SECRET,
      { expiresIn: SESSION_DURATION }
    );

    return { success: true, token };
  } catch (error) {
    console.error('Docs auth error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// Middleware for docs routes
export async function docsAuthMiddleware(req: NextRequest): Promise<NextResponse | null> {
  // Skip auth for login page
  if (req.nextUrl.pathname === '/docs/login') {
    return null;
  }

  const authResult = await verifyDocsAccess(req);
  
  if (!authResult.authenticated) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/docs/login', req.url));
  }

  return null;
}