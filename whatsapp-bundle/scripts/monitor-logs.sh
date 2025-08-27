#!/bin/bash

# Monitor WhatsApp Integration Logs
echo "📊 WhatsApp Integration Monitor"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "Install with: npm install -g @railway/cli"
    exit 1
fi

echo "Monitoring Railway logs for WhatsApp activity..."
echo "Press Ctrl+C to stop"
echo ""
echo -e "${YELLOW}Filters applied:${NC}"
echo "- WhatsApp webhook calls"
echo "- Message processing"
echo "- Errors and warnings"
echo ""
echo "-------------------------------------------"
echo ""

# Monitor logs with grep for WhatsApp-related entries
railway logs | while IFS= read -r line; do
    # Highlight WhatsApp-related logs
    if echo "$line" | grep -qi "whatsapp"; then
        # Color code based on content
        if echo "$line" | grep -qi "error\|fail"; then
            echo -e "${RED}[ERROR]${NC} $line"
        elif echo "$line" | grep -qi "webhook received"; then
            echo -e "${GREEN}[WEBHOOK]${NC} $line"
        elif echo "$line" | grep -qi "processed\|stored"; then
            echo -e "${BLUE}[SUCCESS]${NC} $line"
        else
            echo -e "${YELLOW}[INFO]${NC} $line"
        fi
    fi
done