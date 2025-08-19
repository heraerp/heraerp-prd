# Salon Module - Production User Onboarding Flow

## Overview
This document outlines the complete user journey from registration to using the HERA Salon module in production.

## 🚀 User Registration & Onboarding Flow

### Step 1: Registration (5 minutes)
**URL**: `https://heraerp.com/auth/register`

1. **Account Creation**
   - User enters email and password
   - Password validation (min 6 characters)
   - Email verification (optional in development)

2. **Business Information**
   - Salon name
   - Owner name
   - Contact phone number
   - Location (optional)

3. **Behind the Scenes** (Automatic)
   - Supabase user account created
   - Organization created in `core_organizations`
   - User entity created in `core_entities`
   - Default salon setup initiated

### Step 2: Initial Salon Setup (Automatic)
When a new salon registers, the system automatically creates:

1. **Default Services** (5-10 common services)
   ```
   - Haircut & Style
   - Hair Color
   - Manicure
   - Pedicure
   - Facial Treatment
   ```

2. **Service Categories**
   ```
   - Hair Services
   - Nail Services
   - Spa & Wellness
   - Makeup & Beauty
   ```

3. **Staff Roles**
   ```
   - Owner (the registering user)
   - Senior Stylist
   - Junior Stylist
   - Receptionist
   ```

4. **Loyalty Tiers**
   ```
   - Bronze (0-499 points)
   - Silver (500-999 points)
   - Gold (1000-1999 points)
   - Platinum (2000+ points)
   ```

5. **Basic Settings**
   ```
   - Operating hours: 9 AM - 7 PM
   - Currency: AED (configurable)
   - Time zone: Asia/Dubai (configurable)
   - Appointment slots: 30 minutes
   ```

### Step 3: First Login Experience
**URL**: `https://heraerp.com/salon`

1. **Welcome Dashboard**
   - Personalized welcome message
   - Quick setup checklist
   - Demo data option
   - Video tutorials

2. **Setup Checklist** (Progressive)
   - [ ] Add your services and pricing
   - [ ] Add staff members
   - [ ] Configure operating hours
   - [ ] Set up payment methods
   - [ ] Import existing clients (optional)
   - [ ] Configure loyalty program
   - [ ] Set up online booking (optional)

### Step 4: Core Setup Tasks

#### A. Services Configuration
1. Review default services
2. Edit prices and duration
3. Add custom services
4. Set service categories
5. Configure booking rules

#### B. Staff Management
1. Add staff members
2. Set working hours
3. Assign specialties
4. Configure commission rates
5. Set access permissions

#### C. Client Import
1. Download CSV template
2. Format existing client data
3. Upload client list
4. Verify import results
5. Send welcome emails (optional)

### Step 5: Go Live Checklist
- [ ] Services and pricing finalized
- [ ] Staff schedules configured
- [ ] Payment methods set up
- [ ] Test appointment booking
- [ ] Review reports access
- [ ] Configure notifications
- [ ] Set up backups

## 🔐 Security & Multi-Tenancy

### Organization Isolation
- Each salon gets a unique `organization_id`
- All data is filtered by organization
- Staff can only see their salon's data
- No data leakage between salons

### User Roles & Permissions
1. **Owner** - Full access to all features
2. **Manager** - All features except billing
3. **Staff** - Appointments, clients, services
4. **Receptionist** - Appointments and clients only

## 📱 Progressive vs Production

### Progressive Mode (Trial)
- 30-day free trial
- Local browser storage
- Single user
- No login required
- Limited to one device

### Production Mode (Paid)
- Cloud storage (Supabase)
- Multi-user support
- Login required
- Access from any device
- API access
- Integrations enabled

## 🎯 Best Practices for New Users

### Week 1: Setup & Learn
- Complete initial setup
- Add 2-3 staff members
- Import top 20 clients
- Book test appointments
- Explore reports

### Week 2: Optimize
- Fine-tune services
- Set up loyalty program
- Configure marketing templates
- Train staff on system
- Set up integrations

### Week 3: Scale
- Import all clients
- Launch online booking
- Start email campaigns
- Use inventory tracking
- Monitor analytics

### Week 4: Review & Adjust
- Review business metrics
- Adjust pricing if needed
- Gather staff feedback
- Plan expansion features
- Consider add-ons

## 🛠️ Technical Implementation

### API Endpoints for Onboarding
```typescript
// Create new organization
POST /api/v1/organizations
{
  name: "Glamour Beauty Salon",
  type: "salon",
  owner_email: "owner@salon.com"
}

// Setup salon defaults
POST /api/v1/salon/setup
{
  organization_id: "xxx",
  include_demo_data: true,
  currency: "AED",
  timezone: "Asia/Dubai"
}

// Import clients
POST /api/v1/salon/clients/import
{
  organization_id: "xxx",
  csv_data: "..."
}
```

### Database Operations
1. Create organization in `core_organizations`
2. Create user entity in `core_entities`
3. Create default services as entities
4. Create loyalty tiers
5. Set up relationships
6. Configure dynamic fields

## 📊 Success Metrics

### Activation Metrics
- Account created → First login: 90% conversion
- First login → Complete setup: 75% conversion
- Setup → First real appointment: 85% conversion
- Trial → Paid conversion: 40% target

### Time to Value
- Registration to first appointment: < 24 hours
- Full setup completion: < 7 days
- Team onboarded: < 14 days
- ROI positive: < 30 days

## 🆘 Support Resources

### Self-Service
- In-app tutorials
- Knowledge base articles
- Video walkthroughs
- Community forum

### Assisted Support
- Email support (24-48h response)
- Live chat (business hours)
- Phone support (premium)
- Onboarding specialist (enterprise)

## 🚨 Common Issues & Solutions

### Issue: Can't add staff
**Solution**: Check organization limits, verify email addresses

### Issue: Services not showing
**Solution**: Ensure services are marked active, check categories

### Issue: Login problems
**Solution**: Password reset, check email verification

### Issue: Data not syncing
**Solution**: Check internet connection, clear cache, re-login

## 🎉 Post-Onboarding

### Month 1
- Weekly check-ins
- Feature discovery emails
- Usage analytics review
- Optimization suggestions

### Month 2-3
- Advanced feature training
- Integration opportunities
- Growth planning session
- Success story collection

### Ongoing
- Quarterly business reviews
- New feature announcements
- Industry best practices
- Peer networking events