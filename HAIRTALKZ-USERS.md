# HairTalkz Salon - User Credentials

## 🔐 Test User Accounts

Below are the 4 test users created for the HairTalkz salon system. Each user has a different role with specific permissions.

### 1. 👑 Owner Account
- **Name:** Michele Rodriguez
- **Email:** `owner@hairtalkz.ae`
- **Password:** `HairTalkz@2025`
- **Role:** Owner
- **Access:** Full system access including:
  - Financial overview dashboard
  - All reports (P&L, Balance Sheet, etc.)
  - Staff management
  - System settings
  - All other features

### 2. 📞 Receptionist Account
- **Name:** Sarah Johnson
- **Email:** `receptionist@hairtalkz.ae`
- **Password:** `Reception@2025`
- **Role:** Receptionist
- **Access:** Front desk operations including:
  - Reception dashboard
  - Appointment management
  - Customer check-in/out
  - POS system
  - WhatsApp communications

### 3. 💰 Accountant Account
- **Name:** Michael Chen
- **Email:** `accountant@hairtalkz.ae`
- **Password:** `Finance@2025`
- **Role:** Accountant
- **Access:** Financial management including:
  - Financial dashboard
  - Revenue and expense reports
  - VAT reports
  - P&L statements
  - Balance sheets
  - Payroll reports

### 4. 🛡️ Administrator Account
- **Name:** David Thompson
- **Email:** `admin@hairtalkz.ae`
- **Password:** `Admin@2025`
- **Role:** Admin
- **Access:** System administration including:
  - User management
  - System settings
  - Database backups
  - Integration settings
  - Security configuration
  - Audit logs

## 🚀 How to Create These Users

1. **Run the creation script:**
   ```bash
   cd /Users/san/Documents/PRD/heraerp-prd
   node scripts/create-hairtalkz-users.js
   ```

2. **Test the logins:**
   ```bash
   node scripts/test-hairtalkz-login.js
   ```

## 🌐 Access the System

1. Go to: http://localhost:3001/salon/auth
2. Enter the email and password for any user
3. Select the corresponding role from the dropdown
4. Click "Secure Login"

## 📝 Notes

- All users belong to Michele's HairTalkz salon (Organization ID: `378f24fb-d496-4ff7-8afa-ea34895a0eb8`)
- Passwords follow a secure pattern with special characters
- Users are automatically confirmed and ready to use
- Each role has specific dashboard access and permissions

## 🔄 Role-Based Routing

After login, users are automatically redirected to their role-specific dashboard:
- **Owner** → `/salon/dashboard` (or `/salon/owner`)
- **Receptionist** → `/salon/receptionist`
- **Accountant** → `/salon/accountant`
- **Admin** → `/salon/admin`

## ⚠️ Important

These are test accounts for development/demo purposes. For production:
- Change all passwords to more secure ones
- Use real email addresses
- Enable two-factor authentication
- Regular password rotation policy