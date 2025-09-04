# Hair Talkz Salon Group - Employee Setup Guide

## Overview

This guide documents the complete employee structure for Hair Talkz Salon Group, including the head office and two branch locations. The setup includes employee entities, commission structures, and user access requirements.

## 🏢 Organization Structure

### Head Office
- **Organization ID**: `849b6efe-2bf0-438f-9c70-01835ac2fe15`
- **Employees**: 3 (CEO, CFO, Accountant)
- **Focus**: Strategic management and financial oversight

### Hair Talkz • Park Regis
- **Organization ID**: `e3a9ff9e-bb83-43a8-b062-b85e7a2b4258`
- **Employees**: 8 (Manager, stylists, therapist, support staff)
- **Services**: Full-service salon with hair and beauty treatments

### Hair Talkz • Mercure Gold
- **Organization ID**: `0b1b37cd-4096-4718-8cd4-e370f234005b`
- **Employees**: 8 (Manager, stylists, therapist, support staff)
- **Services**: Premium location with specialized services

## 👥 Employee Roster

### Head Office Team

| Name | Role | Code | Email | Salary (AED) |
|------|------|------|-------|--------------|
| Sarah Johnson | CEO | EMP-HO-001 | sarah.johnson@hairtalkz.ae | 45,000 |
| Michael Chen | CFO | EMP-HO-002 | michael.chen@hairtalkz.ae | 35,000 |
| Fatima Al-Rashid | Accountant | EMP-HO-003 | fatima.alrashid@hairtalkz.ae | 12,000 |

### Park Regis Branch Team

| Name | Role | Code | Email | Salary (AED) | Commission |
|------|------|------|-------|--------------|------------|
| Amanda Rodriguez | Branch Manager | EMP-PR-001 | amanda.rodriguez@hairtalkz.ae | 18,000 | 2% revenue |
| Jessica Martinez | Senior Stylist | EMP-PR-002 | jessica.martinez@hairtalkz.ae | 6,000 | 35% |
| Priya Sharma | Stylist | EMP-PR-003 | priya.sharma@hairtalkz.ae | 4,500 | 30% |
| Lily Wang | Colorist | EMP-PR-004 | lily.wang@hairtalkz.ae | 5,500 | 32% |
| Aisha Hassan | Therapist | EMP-PR-005 | aisha.hassan@hairtalkz.ae | 4,000 | 30% |
| Maya Patel | Junior Stylist | EMP-PR-006 | maya.patel@hairtalkz.ae | 3,500 | 25% |
| Sophie Kim | Receptionist | EMP-PR-007 | sophie.kim@hairtalkz.ae | 3,000 | - |
| Maria Santos | Cleaner | EMP-PR-008 | maria.santos@hairtalkz.ae | 2,200 | - |

### Mercure Gold Branch Team

| Name | Role | Code | Email | Salary (AED) | Commission |
|------|------|------|-------|--------------|------------|
| Rachel Thompson | Branch Manager | EMP-MG-001 | rachel.thompson@hairtalkz.ae | 18,000 | 2% revenue |
| Elena Volkov | Senior Stylist | EMP-MG-002 | elena.volkov@hairtalkz.ae | 6,500 | 35% |
| Natalie Brown | Stylist | EMP-MG-003 | natalie.brown@hairtalkz.ae | 4,500 | 30% |
| Isabella Garcia | Colorist | EMP-MG-004 | isabella.garcia@hairtalkz.ae | 5,500 | 32% |
| Yasmin Ali | Therapist | EMP-MG-005 | yasmin.ali@hairtalkz.ae | 4,000 | 30% |
| Chloe Davis | Stylist | EMP-MG-006 | chloe.davis@hairtalkz.ae | 4,500 | 30% |
| Emma Wilson | Receptionist | EMP-MG-007 | emma.wilson@hairtalkz.ae | 3,000 | - |
| Ana Rodriguez | Cleaner | EMP-MG-008 | ana.rodriguez@hairtalkz.ae | 2,200 | - |

## 💰 Commission Structure

### Service-Based Commissions

| Service Category | Senior Stylist | Stylist | Junior Stylist | Colorist | Therapist |
|-----------------|----------------|---------|----------------|----------|-----------|
| Hair Cutting | 35% | 30% | 25% | - | - |
| Hair Coloring | 35% | 28% | - | 32% | - |
| Treatments | 32% | - | - | - | 30% |
| Product Sales | 10% | 10% | 10% | 10% | 10% |

### Management Bonuses

- **Branch Managers**: 2% of monthly revenue exceeding 100,000 AED
- **Example**: Revenue 150,000 AED = 3,000 AED bonus

### Special Incentives

1. **New Client Bonus**: 25 AED per new client
2. **Upsell Bonus**: 5% on additional services sold
3. **Perfect Attendance**: 500 AED monthly bonus

## 🔐 User Access Requirements

### System Access Levels

| Role | Access Level | Permissions |
|------|-------------|------------|
| Owner (CEO) | Full Admin | All modules, all branches |
| Admin (CFO) | Finance Admin | Financial modules, reports |
| Accountant | Finance User | Accounting, payroll, reports |
| Branch Manager | Branch Admin | Branch operations, reports |
| Receptionist | Staff User | Appointments, POS, customers |

### User Accounts to Create

1. **sarah.johnson@hairtalkz.ae** - Owner role
2. **michael.chen@hairtalkz.ae** - Admin role
3. **fatima.alrashid@hairtalkz.ae** - Accountant role
4. **amanda.rodriguez@hairtalkz.ae** - Manager role (Park Regis)
5. **rachel.thompson@hairtalkz.ae** - Manager role (Mercure Gold)
6. **sophie.kim@hairtalkz.ae** - Staff role (Park Regis)
7. **emma.wilson@hairtalkz.ae** - Staff role (Mercure Gold)

## 📊 Reporting Structure

```
Sarah Johnson (CEO)
├── Michael Chen (CFO)
│   └── Fatima Al-Rashid (Accountant)
├── Amanda Rodriguez (Park Regis Manager)
│   ├── Jessica Martinez (Senior Stylist)
│   ├── Priya Sharma (Stylist)
│   ├── Lily Wang (Colorist)
│   ├── Aisha Hassan (Therapist)
│   ├── Maya Patel (Junior Stylist)
│   ├── Sophie Kim (Receptionist)
│   └── Maria Santos (Cleaner)
└── Rachel Thompson (Mercure Gold Manager)
    ├── Elena Volkov (Senior Stylist)
    ├── Natalie Brown (Stylist)
    ├── Isabella Garcia (Colorist)
    ├── Yasmin Ali (Therapist)
    ├── Chloe Davis (Stylist)
    ├── Emma Wilson (Receptionist)
    └── Ana Rodriguez (Cleaner)
```

## 🎯 Employee Specialties

### Park Regis Specialties
- **Jessica Martinez**: Hair Coloring, Balayage, Hair Extensions
- **Priya Sharma**: Hair Cutting, Blow Dry, Hair Treatment
- **Lily Wang**: Hair Coloring, Highlights, Color Correction
- **Aisha Hassan**: Facials, Massage, Body Treatments
- **Maya Patel**: Hair Washing, Basic Cuts, Styling

### Mercure Gold Specialties
- **Elena Volkov**: Bridal Hair, Updos, Hair Extensions
- **Natalie Brown**: Hair Cutting, Keratin Treatment, Hair Spa
- **Isabella Garcia**: Ombre, Balayage, Fashion Colors
- **Yasmin Ali**: Anti-Aging Facials, Deep Tissue Massage, Aromatherapy
- **Chloe Davis**: Men's Cuts, Beard Grooming, Hair Styling

## 📈 Payroll Summary

### Monthly Payroll Costs

| Branch | Base Salaries | Est. Commissions | Total |
|--------|---------------|------------------|-------|
| Head Office | 92,000 AED | - | 92,000 AED |
| Park Regis | 36,700 AED | ~25,000 AED | ~61,700 AED |
| Mercure Gold | 37,200 AED | ~26,000 AED | ~63,200 AED |
| **Total** | **165,900 AED** | **~51,000 AED** | **~216,900 AED** |

## 🔧 Technical Implementation

### Database Structure

```typescript
// Employee Entity
{
  entity_type: 'employee',
  entity_code: 'EMP-XX-XXX',
  entity_name: 'Employee Name',
  smart_code: 'HERA.HRM.EMP.{ROLE_CODE}.v1'
}

// Employee Dynamic Data
{
  role_code: 'MGT-BM',
  email: 'email@hairtalkz.ae',
  phone: '+971-50-XXX-XXXX',
  hire_date: '2021-01-01',
  employment_status: 'active',
  monthly_salary: 5000,
  commission_rate: 30,
  specialties: 'Hair Cutting, Coloring'
}

// Employment Relationship
{
  from_entity_id: employee_id,
  to_entity_id: organization_id,
  relationship_type: 'employed_by',
  smart_code: 'HERA.HRM.REL.EMPLOYMENT.v1'
}
```

### Smart Codes Used

```
HERA.HRM.EMP.MGT-CEO.v1     - CEO Employee
HERA.HRM.EMP.MGT-BM.v1      - Branch Manager
HERA.HRM.EMP.OPS-SS.v1      - Senior Stylist
HERA.HRM.EMP.OPS-ST.v1      - Stylist
HERA.HRM.EMP.OPS-CL.v1      - Colorist
HERA.HRM.EMP.OPS-TH.v1      - Therapist
HERA.HRM.EMP.SUP-RC.v1      - Receptionist
HERA.SALON.COMM.HAIRCUT.SR.v1  - Hair Cut Commission
HERA.SALON.COMM.COLOR.SPEC.v1  - Color Commission
HERA.SALON.COMM.TREATMENT.v1    - Treatment Commission
```

## 📋 Next Steps

1. **Create User Accounts** in Supabase Auth for the 7 key personnel
2. **Link User IDs** to employee entities for system access
3. **Configure Permissions** based on roles and branch assignments
4. **Set Up Schedules** for each employee's working hours
5. **Create Service Menu** and link to employee specialties
6. **Configure POS** to track services by employee
7. **Test Commission Calculations** with sample transactions
8. **Train Staff** on system usage based on their roles

## 📞 Support Contacts

- **System Admin**: sarah.johnson@hairtalkz.ae
- **Financial Queries**: michael.chen@hairtalkz.ae
- **Park Regis Operations**: amanda.rodriguez@hairtalkz.ae
- **Mercure Gold Operations**: rachel.thompson@hairtalkz.ae

---

*This employee setup provides the foundation for operating Hair Talkz Salon Group with proper staff management, commission tracking, and organizational hierarchy.*