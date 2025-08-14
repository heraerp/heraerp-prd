#!/bin/bash

# HERA CRM Test Data Setup Script
# Creates a complete CRM demo with organizations, users, contacts, companies, and deals

echo "🚀 HERA CRM Test Data Setup"
echo "=========================="
echo ""

# Base URL - adjust if needed
BASE_URL="http://localhost:3000/api/v1"

echo "📊 Creating CRM Test Data..."
echo ""

# 1. Create test organization FIRST - this is critical!
echo "1️⃣ Creating Organization (REQUIRED FIRST STEP)..."
ORG_RESPONSE=$(curl -s -X POST "$BASE_URL/organizations" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "Acme Corp",
    "organization_code": "ACME001",
    "organization_type": "business",
    "industry": "Technology",
    "business_size": "medium",
    "email": "info@acmecorp.com",
    "phone": "+1-555-0100",
    "website": "www.acmecorp.com",
    "address": {
      "street": "123 Business Ave",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105",
      "country": "USA"
    },
    "status": "active",
    "subscription_tier": "professional"
  }')

echo "$ORG_RESPONSE" | jq '.'

# Extract the organization ID from response
ORG_ID=$(echo "$ORG_RESPONSE" | jq -r '.id')

if [ "$ORG_ID" = "null" ] || [ -z "$ORG_ID" ]; then
  echo "❌ Failed to create organization. Exiting..."
  exit 1
fi

echo ""
echo "✅ Organization created with ID: $ORG_ID"

echo ""
echo "2️⃣ Creating CRM Users..."

# Create Sales Manager
curl -X POST "$BASE_URL/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_type": "user",
    "entity_name": "John Smith",
    "entity_code": "USER_JOHN_SMITH",
    "entity_category": "staff",
    "entity_subcategory": "sales_manager",
    "status": "active",
    "metadata": {
      "email": "john@acmecorp.com",
      "title": "Sales Manager",
      "department": "Sales"
    }
  }' | jq '.'

# Create Sales Rep
curl -X POST "$BASE_URL/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_type": "user",
    "entity_name": "Emily Johnson",
    "entity_code": "USER_EMILY_JOHNSON",
    "entity_category": "staff",
    "entity_subcategory": "sales_rep",
    "status": "active",
    "metadata": {
      "email": "emily@acmecorp.com",
      "title": "Account Executive",
      "department": "Sales"
    }
  }' | jq '.'

echo ""
echo "3️⃣ Creating Companies..."

# Company 1: TechCorp
COMPANY1_ID=$(curl -X POST "$BASE_URL/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_type": "company",
    "entity_name": "TechCorp Solutions",
    "entity_code": "COMP_TECHCORP",
    "entity_category": "customer",
    "entity_subcategory": "enterprise",
    "status": "active",
    "metadata": {
      "industry": "Software",
      "size": "500-1000",
      "website": "www.techcorp.com",
      "annual_revenue": "50000000"
    }
  }' | jq -r '.id')

# Company 2: StartupCo
COMPANY2_ID=$(curl -X POST "$BASE_URL/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_type": "company",
    "entity_name": "StartupCo",
    "entity_code": "COMP_STARTUPCO",
    "entity_category": "customer",
    "entity_subcategory": "small_business",
    "status": "active",
    "metadata": {
      "industry": "E-commerce",
      "size": "10-50",
      "website": "www.startupco.com",
      "annual_revenue": "2000000"
    }
  }' | jq -r '.id')

echo ""
echo "4️⃣ Creating Contacts..."

# Contact 1
CONTACT1_ID=$(curl -X POST "$BASE_URL/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_type": "contact",
    "entity_name": "Sarah Chen",
    "entity_code": "CONT_SARAH_CHEN",
    "entity_category": "crm",
    "entity_subcategory": "customer",
    "status": "active",
    "metadata": {
      "title": "VP of Engineering",
      "company_id": "'$COMPANY1_ID'",
      "source": "linkedin"
    }
  }' | jq -r '.id')

# Add contact dynamic data
curl -X POST "$BASE_URL/dynamic-data" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_id": "'$CONTACT1_ID'",
    "field_name": "email",
    "field_value": "sarah.chen@techcorp.com",
    "field_type": "text",
    "field_category": "contact_info"
  }' | jq '.'

curl -X POST "$BASE_URL/dynamic-data" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_id": "'$CONTACT1_ID'",
    "field_name": "phone",
    "field_value": "+1-555-0123",
    "field_type": "text",
    "field_category": "contact_info"
  }' | jq '.'

# Contact 2
CONTACT2_ID=$(curl -X POST "$BASE_URL/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_type": "contact",
    "entity_name": "Mike Wilson",
    "entity_code": "CONT_MIKE_WILSON",
    "entity_category": "crm",
    "entity_subcategory": "prospect",
    "status": "active",
    "metadata": {
      "title": "CEO",
      "company_id": "'$COMPANY2_ID'",
      "source": "cold_call"
    }
  }' | jq -r '.id')

# Add contact dynamic data
curl -X POST "$BASE_URL/dynamic-data" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_id": "'$CONTACT2_ID'",
    "field_name": "email",
    "field_value": "mike@startupco.com",
    "field_type": "text",
    "field_category": "contact_info"
  }' | jq '.'

echo ""
echo "5️⃣ Creating Deals/Opportunities..."

# Deal 1: Enterprise Software Deal
DEAL1_ID=$(curl -X POST "$BASE_URL/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_type": "deal",
    "entity_name": "TechCorp Enterprise License",
    "entity_code": "DEAL_TC_ENT_2024",
    "entity_category": "opportunity",
    "entity_subcategory": "proposal",
    "status": "active",
    "metadata": {
      "value": "250000",
      "probability": "60",
      "close_date": "2024-03-31",
      "company_id": "'$COMPANY1_ID'",
      "contact_id": "'$CONTACT1_ID'",
      "owner": "John Smith"
    }
  }' | jq -r '.id')

# Deal 2: Startup Package
DEAL2_ID=$(curl -X POST "$BASE_URL/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_type": "deal",
    "entity_name": "StartupCo Growth Package",
    "entity_code": "DEAL_SC_GROWTH_2024",
    "entity_category": "opportunity",
    "entity_subcategory": "qualification",
    "status": "active",
    "metadata": {
      "value": "30000",
      "probability": "40",
      "close_date": "2024-02-28",
      "company_id": "'$COMPANY2_ID'",
      "contact_id": "'$CONTACT2_ID'",
      "owner": "Emily Johnson"
    }
  }' | jq -r '.id')

echo ""
echo "6️⃣ Creating Relationships..."

# Company-Contact relationships
curl -X POST "$BASE_URL/relationships" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "parent_entity_id": "'$COMPANY1_ID'",
    "child_entity_id": "'$CONTACT1_ID'",
    "relationship_type": "employs",
    "relationship_strength": 1.0
  }' | jq '.'

curl -X POST "$BASE_URL/relationships" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "parent_entity_id": "'$COMPANY2_ID'",
    "child_entity_id": "'$CONTACT2_ID'",
    "relationship_type": "employs",
    "relationship_strength": 1.0
  }' | jq '.'

# Deal-Company relationships
curl -X POST "$BASE_URL/relationships" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "parent_entity_id": "'$DEAL1_ID'",
    "child_entity_id": "'$COMPANY1_ID'",
    "relationship_type": "opportunity_for",
    "relationship_strength": 0.9
  }' | jq '.'

echo ""
echo "7️⃣ Creating Tasks..."

# Task 1: Follow up call
curl -X POST "$BASE_URL/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_type": "task",
    "entity_name": "Follow up call with Sarah Chen",
    "entity_code": "TASK_CALL_001",
    "entity_category": "activity",
    "entity_subcategory": "call",
    "status": "pending",
    "metadata": {
      "due_date": "2024-01-25",
      "priority": "high",
      "assigned_to": "John Smith",
      "related_to": "'$DEAL1_ID'"
    }
  }' | jq '.'

# Task 2: Send proposal
curl -X POST "$BASE_URL/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_type": "task",
    "entity_name": "Send proposal to StartupCo",
    "entity_code": "TASK_PROP_002",
    "entity_category": "activity",
    "entity_subcategory": "email",
    "status": "pending",
    "metadata": {
      "due_date": "2024-01-23",
      "priority": "medium",
      "assigned_to": "Emily Johnson",
      "related_to": "'$DEAL2_ID'"
    }
  }' | jq '.'

echo ""
echo "8️⃣ Creating Activities (Call logs, emails)..."

# Activity 1: Recent call
curl -X POST "$BASE_URL/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_type": "activity",
    "entity_name": "Discovery call with TechCorp",
    "entity_code": "ACT_CALL_001",
    "entity_category": "communication",
    "entity_subcategory": "call",
    "status": "completed",
    "metadata": {
      "date": "2024-01-20",
      "duration": "45 minutes",
      "contact_id": "'$CONTACT1_ID'",
      "deal_id": "'$DEAL1_ID'",
      "notes": "Discussed enterprise features and pricing. Very interested in Q1 implementation."
    }
  }' | jq '.'

echo ""
echo "✅ CRM Test Data Setup Complete!"
echo ""
echo "Summary:"
echo "- Organization: Acme Corp"
echo "- Users: 2 (John Smith, Emily Johnson)"
echo "- Companies: 2 (TechCorp, StartupCo)"
echo "- Contacts: 2 (Sarah Chen, Mike Wilson)"
echo "- Deals: 2 ($250k and $30k)"
echo "- Tasks: 2 pending"
echo "- Activities: 1 completed call"
echo ""
echo "🎯 Visit http://localhost:3000/crm to see your CRM in action!"