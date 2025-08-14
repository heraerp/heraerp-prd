// Enterprise Retail Solution Demo Data
// Generated using HERA DNA from jewelry-progressive

export const enterprise_retail_demo_data = {
  "products": [
    {
      "name": "Premium Denim Jacket",
      "sku": "CLO-DJ-001",
      "article_number": "ART001",
      "season": "FW2025",
      "collection": "Urban Collection",
      "color_code": "INDIGO",
      "size": "M",
      "cost_price": 45,
      "price": 89.99,
      "margin_percent": 50,
      "category": "Outerwear"
    },
    {
      "name": "Classic White Sneakers",
      "sku": "SHO-SNE-002",
      "article_number": "ART002",
      "season": "SS2025",
      "collection": "Essential Collection",
      "color_code": "WHITE",
      "size": "42",
      "cost_price": 25,
      "price": 79.99,
      "margin_percent": 68.8,
      "category": "Footwear"
    },
    {
      "name": "Silk Blend Scarf",
      "sku": "ACC-SCA-003",
      "article_number": "ART003",
      "season": "FW2025",
      "collection": "Luxury Collection",
      "color_code": "NAVY",
      "size": "OS",
      "cost_price": 15,
      "price": 49.99,
      "margin_percent": 70,
      "category": "Accessories"
    }
  ],
  "stores": [
    {
      "name": "Downtown Flagship",
      "store_code": "STR001",
      "format": "Flagship",
      "size_sqft": 5000,
      "region": "Urban",
      "performance_tier": "A"
    },
    {
      "name": "Mall Location",
      "store_code": "STR002",
      "format": "Standard",
      "size_sqft": 2500,
      "region": "Suburban",
      "performance_tier": "B"
    },
    {
      "name": "Outlet Store",
      "store_code": "STR003",
      "format": "Outlet",
      "size_sqft": 3000,
      "region": "Outlet",
      "performance_tier": "C"
    }
  ],
  "customers": [
    {
      "name": "Sarah Williams",
      "customer_number": "CUST001",
      "loyalty_points": 2500,
      "tier": "Gold",
      "preferred_store": "STR001",
      "lifetime_value": 1850
    },
    {
      "name": "Michael Zhang",
      "customer_number": "CUST002",
      "loyalty_points": 750,
      "tier": "Silver",
      "preferred_store": "STR002",
      "lifetime_value": 650
    },
    {
      "name": "Emma Rodriguez",
      "customer_number": "CUST003",
      "loyalty_points": 5200,
      "tier": "Platinum",
      "preferred_store": "STR001",
      "lifetime_value": 3200
    }
  ]
};

// Smart Codes for Enterprise Retail Solution
export const enterprise_retail_smart_codes = {
  MERCHANDISING: 'HERA.ENTERPRISERETAIL.MERCHANDISING.PROGRESSIVE.v1',
  PLANNING: 'HERA.ENTERPRISERETAIL.PLANNING.PROGRESSIVE.v1',
  PROCUREMENT: 'HERA.ENTERPRISERETAIL.PROCUREMENT.PROGRESSIVE.v1',
  POS: 'HERA.ENTERPRISERETAIL.POS.PROGRESSIVE.v1',
  INVENTORY: 'HERA.ENTERPRISERETAIL.INVENTORY.PROGRESSIVE.v1',
  ANALYTICS: 'HERA.ENTERPRISERETAIL.ANALYTICS.PROGRESSIVE.v1',
  PROMOTIONS: 'HERA.ENTERPRISERETAIL.PROMOTIONS.PROGRESSIVE.v1',
  CUSTOMERS: 'HERA.ENTERPRISERETAIL.CUSTOMERS.PROGRESSIVE.v1'
};
