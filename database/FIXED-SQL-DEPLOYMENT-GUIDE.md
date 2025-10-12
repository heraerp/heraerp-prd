# 🔧 HERA Finance DNA v2 - Fixed SQL Deployment Guide

## 🚨 **Issues Fixed**

### 1. **Materialized Views File** 
- **File**: `database/views/materialized-financial-views-v2.sql`
- **Issue**: `\echo` commands causing syntax errors
- **Fix**: ✅ Converted to SQL comments

### 2. **Workforce Master File**
- **File**: `database/views/workforce/all_workforce_views_v3.sql` 
- **Issue**: `\i` (include) commands not supported in Supabase
- **Solution**: Deploy individual files instead

## 🚀 **CORRECTED Deployment Sequence**

### ✅ **Phase 1: Core Financial Views (READY TO DEPLOY)**
```bash
# These should now work without errors:
psql -f database/views/materialized-financial-views-v2.sql    # ✅ FIXED
psql -f database/views/coa-v2-views.sql
psql -f database/views/costcenter-v2-views.sql
psql -f database/views/profitcenter-v2-views.sql  
psql -f database/views/productcosting-v2-views.sql
```

### ✅ **Phase 2: Advanced Analytics (READY TO DEPLOY)**
```bash
psql -f database/views/fact_consolidated_v3.sql
psql -f database/views/fact_plan_actual_v3.sql
psql -f database/views/vw_consol_segment_note_v3.sql
psql -f database/views/vw_fx_translation_diff_v3.sql
psql -f database/views/vw_policy_effectiveness_v3.sql
psql -f database/views/vw_policy_variance_v3.sql
psql -f database/views/vw_workforce_optimization_v3.sql
```

### ✅ **Phase 3: Workforce Functions (READY TO DEPLOY)**
```bash
psql -f database/functions/workforce/hera_work_sched_run_v3.sql
psql -f database/functions/workforce/hera_work_time_post_v3.sql
psql -f database/functions/workforce/hera_work_payroll_accrue_v3.sql
psql -f database/functions/workforce/hera_work_opt_suggest_v3.sql
psql -f database/functions/workforce/hera_work_opt_apply_v3.sql
```

### ✅ **Phase 4: Workforce Views (Deploy Individually)**
```bash
# DEPLOY THESE INDIVIDUAL FILES (NOT the master file):
psql -f database/views/workforce/fact_work_cost_v3.sql
psql -f database/views/workforce/vw_work_roster_v3.sql
psql -f database/views/workforce/vw_work_timesheet_v3.sql
psql -f database/views/workforce/vw_work_kpi_v3.sql

# DO NOT USE: all_workforce_views_v3.sql (has \i commands)
```

## 🎯 **Supabase CLI Commands**
```bash
# For Supabase deployment:
supabase db execute database/views/materialized-financial-views-v2.sql
supabase db execute database/views/coa-v2-views.sql
supabase db execute database/views/costcenter-v2-views.sql
supabase db execute database/views/profitcenter-v2-views.sql  
supabase db execute database/views/productcosting-v2-views.sql

# Continue with other phases...
```

## 📋 **Quick Reference: All Deployable Files**

### **Core Finance Views (5 files)**
- ✅ `materialized-financial-views-v2.sql` (FIXED - no more \echo)
- ✅ `coa-v2-views.sql`
- ✅ `costcenter-v2-views.sql`
- ✅ `profitcenter-v2-views.sql`
- ✅ `productcosting-v2-views.sql`

### **Advanced Analytics (7 files)**
- ✅ `fact_consolidated_v3.sql`
- ✅ `fact_plan_actual_v3.sql`
- ✅ `vw_consol_segment_note_v3.sql`
- ✅ `vw_fx_translation_diff_v3.sql`
- ✅ `vw_policy_effectiveness_v3.sql`
- ✅ `vw_policy_variance_v3.sql`
- ✅ `vw_workforce_optimization_v3.sql`

### **Workforce Functions (5 files)**
- ✅ `hera_work_sched_run_v3.sql`
- ✅ `hera_work_time_post_v3.sql`
- ✅ `hera_work_payroll_accrue_v3.sql`
- ✅ `hera_work_opt_suggest_v3.sql`
- ✅ `hera_work_opt_apply_v3.sql`

### **Workforce Views (4 individual files)**
- ✅ `fact_work_cost_v3.sql`
- ✅ `vw_work_roster_v3.sql`
- ✅ `vw_work_timesheet_v3.sql`
- ✅ `vw_work_kpi_v3.sql`

## 🚨 **Files to AVOID**
- ❌ `all_workforce_views_v3.sql` (contains \i commands)
- ❌ Any file with `\echo` or `\i` commands

## ✅ **Status: Ready for Deployment**
All SQL syntax issues have been resolved. You can now proceed with the remaining deployment phases! 🚀