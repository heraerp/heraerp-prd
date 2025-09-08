// Simple restaurant seeder
console.log("Creating restaurant data for Mario's Restaurant...")

// Create menu categories
console.log(`
Run these commands in mcp-server:

# Create menu categories
node hera-cli.js create-entity menu_category "Antipasti" --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --code CAT-ANTIPASTI
node hera-cli.js create-entity menu_category "Pasta" --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --code CAT-PASTA
node hera-cli.js create-entity menu_category "Pizza" --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --code CAT-PIZZA
node hera-cli.js create-entity menu_category "Dolci" --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --code CAT-DOLCI

# Create menu items
node hera-cli.js create-entity menu_item "Bruschetta" --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --code ITEM-001
node hera-cli.js create-entity menu_item "Spaghetti Carbonara" --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --code ITEM-002
node hera-cli.js create-entity menu_item "Margherita Pizza" --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --code ITEM-003
node hera-cli.js create-entity menu_item "Tiramisu" --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --code ITEM-004

# Create tables
node hera-cli.js create-entity table "Table 1" --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --code TABLE-01
node hera-cli.js create-entity table "Table 2" --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --code TABLE-02
node hera-cli.js create-entity table "Table 3" --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --code TABLE-03
node hera-cli.js create-entity table "Table 4" --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --code TABLE-04

# Create a sample order
node hera-cli.js create-transaction sale 125.50 --org 6f591f1a-ea86-493e-8ae4-639d28a7e3c8 --smart-code HERA.RESTAURANT.FOH.POS.SALE.v1
`)