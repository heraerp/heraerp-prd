# 🌐 Cloudflare Subdomain Configuration for HERA ERP

## Overview
HERA ERP creates unique subdomains for each business (e.g., `marinas-salon.heraerp.com`). This guide explains how to configure Cloudflare to support automatic subdomain creation.

## 🚀 Quick Setup (Recommended: Wildcard Method)

### Step 1: Login to Cloudflare Dashboard
1. Go to https://dash.cloudflare.com
2. Select your domain (heraerp.com)

### Step 2: Add Wildcard DNS Record
1. Navigate to **DNS** → **Records**
2. Click **Add record**
3. Configure as follows:
   - **Type**: `CNAME`
   - **Name**: `*` (asterisk for wildcard)
   - **Target**: `heraerp-production.up.railway.app`
   - **Proxy status**: ✅ Proxied (Orange cloud ON)
   - **TTL**: Auto
4. Click **Save**

### Step 3: Configure SSL for Wildcard (CRITICAL)
1. **Turn OFF Cloudflare proxying** on `_acme-challenge` record:
   - Navigate to **DNS** → **Records**
   - Find any `_acme-challenge` records
   - Click the orange cloud to turn it **gray** (DNS only)
   - If no `_acme-challenge` records exist, this step is automatic

2. **Enable Universal SSL**:
   - Navigate to **SSL/TLS** → **Overview**
   - Ensure **Universal SSL** is **ON**
   - Set encryption mode to **Full (strict)**

### Step 4: Configure Railway
```bash
# In your terminal with Railway CLI
railway domain add "*.heraerp.com"
```

## ✅ That's It! 
Your HERA ERP can now automatically create unlimited subdomains for businesses.

---

## 🔧 Alternative Methods

### Method 2: Individual Subdomain Creation

For specific subdomains without wildcard:

1. **In Cloudflare DNS:**
   ```
   Type: CNAME
   Name: marinas-salon
   Target: heraerp-production.up.railway.app
   Proxy: ✅ Enabled
   ```

2. **In Railway:**
   ```bash
   railway domain add "marinas-salon.heraerp.com"
   ```

### Method 3: Automated via API

1. **Get Cloudflare Credentials:**
   - Zone ID: Dashboard → Overview → Zone ID (right sidebar)
   - API Token: My Profile → API Tokens → Create Token
     - Template: "Edit zone DNS"
     - Permissions: Zone:DNS:Edit
     - Zone Resources: Include → Specific zone → heraerp.com

2. **Create .env.cloudflare:**
   ```env
   CLOUDFLARE_ZONE_ID=your_zone_id_here
   CLOUDFLARE_API_TOKEN=your_api_token_here
   ```

3. **Use the Script:**
   ```bash
   # Create wildcard (one-time setup)
   node scripts/create-subdomain.js wildcard
   
   # Or create individual subdomain
   node scripts/create-subdomain.js create "Marina's Salon"
   ```

---

## 🎯 How It Works

When a business completes production conversion:

1. **HERA generates subdomain**: `marinas-salon-x7k9`
2. **Cloudflare wildcard catches it**: `*.heraerp.com` → Railway
3. **Railway serves the app**: Multi-tenant isolation via organization_id
4. **Business accesses**: https://marinas-salon-x7k9.heraerp.com

---

## 🔒 Security Considerations

### SSL/TLS
- ✅ **Wildcard SSL**: Cloudflare automatically provides SSL for all subdomains
- ✅ **Full (strict) encryption**: Enable in SSL/TLS → Overview → Full (strict)

### Multi-Tenant Isolation
- ✅ **Application Level**: organization_id filtering (built into HERA)
- ✅ **Database Level**: Row Level Security (RLS) in Supabase
- ✅ **DNS Level**: Each subdomain is isolated

---

## 📊 Subdomain Examples

| Business Name | Generated Subdomain | Full URL |
|--------------|-------------------|----------|
| Marina's Salon | marinas-salon-x7k9 | https://marinas-salon-x7k9.heraerp.com |
| Dr. Smith Clinic | dr-smith-clinic-m3n2 | https://dr-smith-clinic-m3n2.heraerp.com |
| TechCorp Solutions | techcorp-solutions-p8q1 | https://techcorp-solutions-p8q1.heraerp.com |

---

## 🚨 Important Notes

1. **Wildcard Limitation**: 
   - Wildcard (`*.heraerp.com`) only covers one level
   - Won't match `sub.sub.heraerp.com`

2. **Propagation Time**:
   - DNS changes take 1-5 minutes typically
   - Maximum 48 hours globally (rare)

3. **Rate Limits**:
   - Cloudflare API: 1200 requests per 5 minutes
   - Sufficient for 1200 business deployments per 5 minutes

4. **Testing**:
   ```bash
   # Test DNS resolution
   nslookup test-subdomain.heraerp.com
   
   # Test with curl
   curl -I https://test-subdomain.heraerp.com
   ```

---

## 🆘 Troubleshooting

### Subdomain Not Working
1. Check DNS propagation: https://dnschecker.org
2. Verify wildcard record in Cloudflare
3. Check Railway domain configuration
4. Test with: `dig *.heraerp.com`

### SSL Certificate Issues (Wildcard Specific)
1. **Check Universal SSL Status**:
   - Go to SSL/TLS → Overview
   - Ensure "Universal SSL" shows as **Active**
   - If inactive, click "Enable Universal SSL"

2. **Verify _acme-challenge Configuration**:
   - Go to DNS → Records
   - Find `_acme-challenge` records (if any)
   - Ensure they are **NOT proxied** (gray cloud, DNS only)
   - If proxied, click orange cloud to turn gray

3. **SSL Mode Configuration**:
   - Go to SSL/TLS → Overview  
   - Set encryption mode to **"Full (strict)"**
   - Avoid "Flexible" mode for wildcard domains

4. **Certificate Generation Wait Time**:
   - Wildcard certificates take **5-15 minutes** to generate
   - Check SSL/TLS → Edge Certificates → Universal SSL
   - Status should show "Active Certificate"

5. **Test SSL for Wildcard**:
   ```bash
   # Test main domain
   curl -I https://heraerp.com
   
   # Test wildcard subdomain
   curl -I https://test-subdomain.heraerp.com
   
   # Both should return 200 OK with valid SSL
   ```

### 404 Errors
1. Verify Railway deployment is live
2. Check Next.js routing handles subdomains
3. Ensure multi-tenant logic uses host header

---

## 🎉 Success Metrics

With wildcard configuration:
- ✅ **Unlimited subdomains** without manual setup
- ✅ **Instant availability** for new businesses
- ✅ **Zero maintenance** after initial setup
- ✅ **Enterprise-grade SSL** for all subdomains
- ✅ **Global CDN** performance via Cloudflare

---

## 📞 Support

- **Cloudflare Support**: https://support.cloudflare.com
- **Railway Support**: https://railway.app/help
- **HERA Documentation**: https://heraerp.com/docs

---

**Configuration Status**: After wildcard setup, HERA ERP can create unlimited business subdomains automatically! 🚀