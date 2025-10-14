# HERA Developer Portal

## 🔐 Enterprise-Grade Documentation Portal

The HERA Developer Portal provides secure access to comprehensive technical documentation for the Universal API v2, Smart Code Engine, UI Library, and complete implementation details.

## 🚀 Quick Start

### 1. Generate Secure Password

```bash
# Install bcryptjs if not already installed
npm install bcryptjs

# Generate password hash
node scripts/generate-docs-password.js "YourSecurePassword123!"
```

### 2. Configure Environment

Add to your `.env.local` file:

```env
# Required: Password hash from step 1
DOCS_PASSWORD_HASH="$2a$12$..."

# Recommended: JWT secret (use generated value)
DOCS_JWT_SECRET="your-32-byte-hex-secret"

# Optional: IP whitelist (comma-separated)
DOCS_ALLOWED_IPS="123.456.789.0,987.654.321.0"
```

### 3. Access Portal

1. Navigate to `/docs/developer` (or `/docs/login` if not authenticated)
2. Enter your password
3. Access is granted for 8 hours

## 📚 Documentation Structure

```
/docs/developer/
├── work-summary/          # Complete implementation summary
├── api-v2/               # Universal API v2 documentation
│   ├── getting-started/
│   ├── guardrails/
│   ├── smart-code-engine/
│   ├── entity-builder/
│   └── rpc-endpoints/
├── smart-code/           # Smart Code system
│   ├── patterns/
│   ├── ucr-system/
│   └── examples/
├── ui-library/           # UI component documentation
│   ├── components/
│   ├── hooks/
│   ├── theme-system/
│   └── form-generation/
├── architecture/         # System architecture
│   ├── schema/
│   ├── multi-tenancy/
│   └── patterns/
├── integration/          # Integration guides
│   ├── oauth2/
│   ├── webhooks/
│   └── connectors/
└── security/            # Security documentation
    ├── authentication/
    ├── authorization/
    └── encryption/
```

## 🔒 Security Features

### Authentication

- **Bcrypt Hashing**: Industry-standard password hashing (12 salt rounds)
- **JWT Sessions**: Secure token-based authentication
- **HTTP-Only Cookies**: Prevents XSS attacks
- **8-Hour Sessions**: Automatic expiry for security

### Access Control

- **IP Whitelisting**: Optional IP-based access restriction
- **Secure Middleware**: All `/docs/developer/*` routes protected
- **Public Docs**: CivicFlow and other public docs remain accessible

### Best Practices

- Use strong passwords (minimum 12 characters, mixed case, numbers, symbols)
- Rotate JWT secret regularly in production
- Enable IP whitelisting for sensitive environments
- Monitor access logs for unauthorized attempts

## 🛠️ Development

### Local Development

```bash
# Default password for local development
# Password: HeraDocsSecure2024!
# Hash: $2a$12$K.gW.HW8HhV2rW.ZQZPYOOzH0qI0JvDMFhO5yM7PqB6cYwAk9B5K2

# Access locally
http://localhost:3000/docs/developer
```

### Adding New Documentation

1. Create new page in appropriate subdirectory
2. Follow the existing component structure
3. Update navigation in main portal page
4. Test authentication flow

## 📊 Portal Features

### Work Summary

- Complete list of all implementations
- File locations and descriptions
- Component relationships
- Quick reference guide

### Interactive Examples

- Live code snippets
- API testing interfaces
- Component playgrounds
- Theme customization demos

### Search Functionality

- Full-text search across documentation
- Smart Code pattern search
- Component name search
- API endpoint search

## 🚨 Troubleshooting

### Cannot Access Portal

1. Check if authenticated: `/docs/login`
2. Verify password hash in `.env.local`
3. Clear cookies and retry
4. Check middleware logs

### Session Expired

- Sessions last 8 hours
- Re-authenticate at `/docs/login`
- Consider extending `SESSION_DURATION` if needed

### IP Blocked

- Verify your IP is in `DOCS_ALLOWED_IPS`
- Remove IP restriction for development
- Check `x-forwarded-for` header configuration

## 🔗 Related Documentation

- [HERA Universal API v2](./api-v2/README.md)
- [Smart Code Engine](./smart-code/README.md)
- [UI Component Library](./ui-library/README.md)
- [System Architecture](./architecture/README.md)

## 📝 License

This documentation portal is part of the HERA ERP system and is protected under enterprise licensing.
