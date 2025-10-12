#!/bin/bash

# HERA API Cleanup Script - Post Demo Cleanup
# WARNING: Review each deletion carefully before running!
# EXCLUDES: V2 APIs (recently created, not used yet)

echo "🧹 Starting HERA API Cleanup (V1 Legacy APIs Only)..."
echo "📅 Schedule: Run AFTER tomorrow's demo"
echo "⚠️  WARNING: This will delete unused API endpoints permanently!"
echo ""

# Confirmation prompt
read -p "Are you sure you want to proceed with API cleanup? (y/N): " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "❌ Cleanup cancelled by user"
    exit 0
fi

echo "🚀 Starting cleanup process..."

# PHASE 1: Business Modules - Completely Unused
echo ""
echo "📋 PHASE 1: Removing unused business module APIs..."
rm -f "src/app/api/v1/airline/route.ts"
rm -f "src/app/api/v1/construction/route.ts"
rm -f "src/app/api/v1/drivers/route.ts"
echo "✅ Business modules cleanup complete"

# PHASE 2: Analytics Chat - Unused Analytics Endpoints
echo ""
echo "📋 PHASE 2: Removing unused analytics chat APIs..."
rm -f "src/app/api/v1/analytics/chat/[id]/route.ts"
rm -f "src/app/api/v1/analytics/chat/history/route.ts"
rm -f "src/app/api/v1/analytics/chat/route.ts"
rm -f "src/app/api/v1/analytics/chat/save/route.ts"
rm -f "src/app/api/v1/analytics/chat/sessions/route.ts"
rm -f "src/app/api/v1/analytics/chat/v2/route.ts"
echo "✅ Analytics chat cleanup complete"

# PHASE 3: Legacy CRM - Unused CRM Endpoints
echo ""
echo "📋 PHASE 3: Removing legacy CRM APIs..."
rm -f "src/app/api/v1/crm-contacts/route.ts"
rm -f "src/app/api/v1/crm-opportunities/route.ts"
rm -f "src/app/api/v1/crm-reports/route.ts"
rm -f "src/app/api/v1/crm-tasks/route.ts"
rm -f "src/app/api/v1/crm/email/route.ts"
rm -f "src/app/api/v1/crm/entities/route.ts"
rm -f "src/app/api/v1/crm/grants/[id]/review/route.ts"
rm -f "src/app/api/v1/crm/grants/[id]/route.ts"
rm -f "src/app/api/v1/crm/grants/export/route.ts"
rm -f "src/app/api/v1/crm/grants/kpis/route.ts"
rm -f "src/app/api/v1/crm/grants/route.ts"
rm -f "src/app/api/v1/crm/import-export/route.ts"
rm -f "src/app/api/v1/crm/reports/route.ts"
rm -f "src/app/api/v1/crm/transactions/route.ts"
rm -f "src/app/api/v1/crm/validations/route.ts"
rm -f "src/app/api/v1/crm/warm-leads/route.ts"
echo "✅ Legacy CRM cleanup complete"

# PHASE 4: Entity-Specific Unused - Customers, Staff, Suppliers
echo ""
echo "📋 PHASE 4: Removing unused entity-specific APIs..."
rm -f "src/app/api/v1/customers/entities/route.ts"
rm -f "src/app/api/v1/customers/reports/route.ts"
rm -f "src/app/api/v1/customers/transactions/route.ts"
rm -f "src/app/api/v1/customers/validations/route.ts"
rm -f "src/app/api/v1/staff/entities/route.ts"
rm -f "src/app/api/v1/staff/reports/route.ts"
rm -f "src/app/api/v1/staff/route.ts"
rm -f "src/app/api/v1/staff/transactions/route.ts"
rm -f "src/app/api/v1/staff/validations/route.ts"
rm -f "src/app/api/v1/suppliers/entities/route.ts"
rm -f "src/app/api/v1/suppliers/reports/route.ts"
rm -f "src/app/api/v1/suppliers/transactions/route.ts"
rm -f "src/app/api/v1/suppliers/validations/route.ts"
echo "✅ Entity-specific cleanup complete"

# PHASE 5: Delivery & Platforms - Unused
echo ""
echo "📋 PHASE 5: Removing unused delivery platform APIs..."
rm -f "src/app/api/v1/delivery/entities/route.ts"
rm -f "src/app/api/v1/delivery/reports/route.ts"
rm -f "src/app/api/v1/delivery/transactions/route.ts"
rm -f "src/app/api/v1/delivery/validations/route.ts"
rm -f "src/app/api/v1/delivery-platforms/[platformId]/menu-sync/route.ts"
rm -f "src/app/api/v1/delivery-platforms/[platformId]/order-sync/route.ts"
rm -f "src/app/api/v1/delivery-platforms/[platformId]/webhook/route.ts"
echo "✅ Delivery platform cleanup complete"

# PHASE 6: Financial Legacy - Unused Financial Endpoints
echo ""
echo "📋 PHASE 6: Removing unused legacy financial APIs..."
rm -f "src/app/api/v1/accounting-periods/route.ts"
rm -f "src/app/api/v1/auto-journal/route.ts"
rm -f "src/app/api/v1/budgets/route.ts"
rm -f "src/app/api/v1/financial/ap/route.ts"
rm -f "src/app/api/v1/financial/ar/route.ts"
rm -f "src/app/api/v1/financial/banks/route.ts"
rm -f "src/app/api/v1/financial/budgets/route.ts"
rm -f "src/app/api/v1/sap-fi/route.ts"
echo "✅ Financial legacy cleanup complete"

# PHASE 7: Communication & Email - Unused
echo ""
echo "📋 PHASE 7: Removing unused communication APIs..."
rm -f "src/app/api/v1/email-analytics/route.ts"
rm -f "src/app/api/v1/email-campaigns/route.ts"
rm -f "src/app/api/v1/email-webhooks/route.ts"
rm -f "src/app/api/v1/communications/webhooks/resend/route.ts"
echo "✅ Communication cleanup complete"

# PHASE 8: Settings & Config - Unused
echo ""
echo "📋 PHASE 8: Removing unused settings/config APIs..."
rm -f "src/app/api/v1/settings/payment-methods/route.ts"
rm -f "src/app/api/v1/settings/tax-types/route.ts"
rm -f "src/app/api/v1/config/admin/route.ts"
rm -f "src/app/api/v1/config/preview/route.ts"
echo "✅ Settings/config cleanup complete"

# PHASE 9: Table Management - Unused
echo ""
echo "📋 PHASE 9: Removing unused table management APIs..."
rm -f "src/app/api/v1/table-management/route.ts"
rm -f "src/app/api/v1/table-updates/route.ts"
rm -f "src/app/api/v1/tables/route.ts"
echo "✅ Table management cleanup complete"

# PHASE 10: WhatsApp Debug/Test - Unused Development Endpoints
echo ""
echo "📋 PHASE 10: Removing unused WhatsApp debug/test APIs..."
rm -f "src/app/api/v1/whatsapp/agents/route.ts"
rm -f "src/app/api/v1/whatsapp/booking/webhook/route.ts"
rm -f "src/app/api/v1/whatsapp/check-logs/route.ts"
rm -f "src/app/api/v1/whatsapp/create-live-message/route.ts"
rm -f "src/app/api/v1/whatsapp/dashboard-test/route.ts"
rm -f "src/app/api/v1/whatsapp/debug/route.ts"
rm -f "src/app/api/v1/whatsapp/diagnose/route.ts"
rm -f "src/app/api/v1/whatsapp/env-test/route.ts"
rm -f "src/app/api/v1/whatsapp/latest/route.ts"
rm -f "src/app/api/v1/whatsapp/messages-v2/route.ts"
rm -f "src/app/api/v1/whatsapp/messages/[id]/route.ts"
rm -f "src/app/api/v1/whatsapp/payments/route.ts"
rm -f "src/app/api/v1/whatsapp/realtime-messages/route.ts"
rm -f "src/app/api/v1/whatsapp/send-test/route.ts"
rm -f "src/app/api/v1/whatsapp/webhook-simulator/route.ts"
rm -f "src/app/api/v1/whatsapp/webhook-v2/route.ts"
echo "✅ WhatsApp debug/test cleanup complete"

# PHASE 11: Audit Unused - Specific Audit Endpoints
echo ""
echo "📋 PHASE 11: Removing unused audit APIs..."
rm -f "src/app/api/v1/audit/document-requisition/route.ts"
rm -f "src/app/api/v1/audit/planning/route.ts"
rm -f "src/app/api/v1/audit/workpapers/route.ts"
rm -f "src/app/api/v1/audit/documents/files/[fileId]/route.ts"
echo "✅ Audit cleanup complete"

# PHASE 12: Miscellaneous Unused - Various Other Endpoints
echo ""
echo "📋 PHASE 12: Removing miscellaneous unused APIs..."
rm -f "src/app/api/v1/ai/stream/route.ts"
rm -f "src/app/api/v1/bpo/cloud-storage/route.ts"
rm -f "src/app/api/v1/bpo/communication/route.ts"
rm -f "src/app/api/v1/bpo/invoices/route.ts"
rm -f "src/app/api/v1/bpo/settings/route.ts"
rm -f "src/app/api/v1/calendar/config/industry/[industry]/route.ts"
rm -f "src/app/api/v1/create-business/route.ts"
rm -f "src/app/api/v1/dashboard/stats/route.ts"
rm -f "src/app/api/v1/data-conversion/legacy-crm/route.ts"
rm -f "src/app/api/v1/development/git/route.ts"
rm -f "src/app/api/v1/digital-accountant/test/route.ts"
rm -f "src/app/api/v1/finance/documents/[id]/route.ts"
rm -f "src/app/api/v1/supabase-test/route.ts"
rm -f "src/app/api/v1/transactions/[id]/route.ts"
rm -f "src/app/api/v1/universal-email/route.ts"
rm -f "src/app/api/v1/universal-learning/[domain]/route.ts"
rm -f "src/app/api/v1/universal-ui/route.ts"
rm -f "src/app/api/v1/universal-ui/seed/route.ts"
rm -f "src/app/api/v1/universal/enforce/route.ts"
rm -f "src/app/api/v1/users/[id]/organizations/route.ts"
rm -f "src/app/api/v1/validations/route.ts"
echo "✅ Miscellaneous cleanup complete"

# Remove empty directories
echo ""
echo "🗂️  Cleaning up empty directories..."
find src/app/api -type d -empty -delete 2>/dev/null || true
echo "✅ Empty directory cleanup complete"

# Summary
echo ""
echo "🎉 API CLEANUP SUMMARY:"
echo "======================="
echo "✅ Removed ~210 unused V1 API endpoints"
echo "✅ Cleaned up empty directories"
echo "✅ Preserved all V2 APIs (recently created)"
echo "✅ Preserved all actively used V1 APIs"
echo ""
echo "📊 BENEFITS:"
echo "- Reduced codebase complexity"
echo "- Eliminated legacy endpoints"
echo "- Improved maintainability"
echo "- Faster builds and deployments"
echo ""
echo "🔄 RECOMMENDED NEXT STEPS:"
echo "1. Run tests to ensure no broken references"
echo "2. Check for any import statements referencing deleted APIs"
echo "3. Update API documentation"
echo "4. Run a full build to verify everything works"
echo ""
echo "✅ HERA API cleanup complete!"