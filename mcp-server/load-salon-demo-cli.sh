#!/bin/bash
# Load Salon ERP Demo Data using HERA CLI

echo "🚀 Loading Salon ERP Demo Data..."
echo ""

# Set organization
export DEFAULT_ORGANIZATION_ID="519d9c67-6fa4-4c73-9c56-6d132a6649c1"
echo "Organization: Demo Hair Salon ($DEFAULT_ORGANIZATION_ID)"
echo ""

# Create entities
echo "📦 Creating entities..."

# Customer
node hera-cli.js create-entity customer "Sarah Johnson"
CUST_ID=$(node hera-cli.js query core_entities entity_name:"Sarah Johnson" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)
echo "Customer ID: $CUST_ID"

# Stylist
node hera-cli.js create-entity stylist "Emma Wilson"
STYLIST_ID=$(node hera-cli.js query core_entities entity_name:"Emma Wilson" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)
echo "Stylist ID: $STYLIST_ID"

# Service
node hera-cli.js create-entity service "Premium Hair Color"
SERVICE_ID=$(node hera-cli.js query core_entities entity_name:"Premium Hair Color" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)
echo "Service ID: $SERVICE_ID"

# Product
node hera-cli.js create-entity product "Professional Hair Color"
PRODUCT_ID=$(node hera-cli.js query core_entities entity_name:"Professional Hair Color" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)
echo "Product ID: $PRODUCT_ID"

echo ""
echo "📝 Adding dynamic data..."

# Customer fields
node hera-cli.js set-field "$CUST_ID" phone "+971555123456"
node hera-cli.js set-field "$CUST_ID" email "sarah.johnson@email.com"

# Service fields
node hera-cli.js set-field "$SERVICE_ID" duration_minutes "90"
node hera-cli.js set-field "$SERVICE_ID" base_price "250"

# Product fields
node hera-cli.js set-field "$PRODUCT_ID" cost_price "20"

echo ""
echo "💸 Creating transactions..."

# Appointment
node hera-cli.js create-transaction appointment 0
APPT_ID=$(node hera-cli.js query universal_transactions transaction_type:appointment | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | tail -1)
echo "Appointment ID: $APPT_ID"

# POS Sale
node hera-cli.js create-transaction pos_sale 262.50
POS_ID=$(node hera-cli.js query universal_transactions transaction_type:pos_sale | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | tail -1)
echo "POS Sale ID: $POS_ID"

echo ""
echo "🎉 Salon ERP Demo Data Loaded!"
echo ""
echo "📊 Summary:"
node hera-query.js summary