const fs = require('fs');
const path = require('path');

// Generate formatted price list for both branches
function generatePriceList() {
  const parkRegisPriceList = `
# HAIR TALKZ • PARK REGIS
## SALON PRICE LIST 2025

### HAIR CUTTING SERVICES
- Ladies' Hair Cut                    AED 120
- Ladies' Cut & Style                 AED 180
- Men's Hair Cut                      AED 80
- Children's Hair Cut (Under 12)      AED 60
- Fringe Trim                         AED 30

### HAIR COLORING SERVICES
- Full Head Color                     AED 280
- Root Touch Up                       AED 180
- Highlights (Full Head)              AED 380
- Highlights (Half Head)              AED 280
- Balayage                           AED 450
- Ombre                              AED 380
- Fashion Colors                      AED 500
- Color Correction                    from AED 600

### HAIR TREATMENTS
- Keratin Treatment                   AED 600
- Hair Botox Treatment                AED 400
- Olaplex Treatment                   AED 180
- Deep Conditioning                   AED 120
- Scalp Treatment                     AED 150
- Hair Spa                           AED 200

### HAIR STYLING
- Blow Dry                           AED 80
- Updo/Special Occasion              AED 200
- Bridal Hair                        AED 400
- Hair Extensions (Installation)      AED 800
- Hair Extensions (Removal)          AED 200

### FACIAL TREATMENTS
- Classic Facial                      AED 250
- Anti-Aging Facial                   AED 350
- Hydrating Facial                    AED 280
- Brightening Facial                  AED 300
- Express Facial                      AED 150

### MASSAGE THERAPY
- Swedish Massage (60 min)            AED 300
- Deep Tissue Massage (60 min)        AED 350
- Hot Stone Massage (75 min)          AED 400
- Aromatherapy Massage (60 min)       AED 320
- Head & Shoulder Massage (30 min)    AED 150

### MEN'S GROOMING
- Beard Trim & Shape                  AED 60
- Hot Towel Shave                     AED 100
- Men's Facial                        AED 200
- Men's Manicure                      AED 80

### SPECIAL PACKAGES
- Bridal Package (5 hours)            AED 1,500
- Mother-Daughter Pamper Day          AED 800
- Total Hair Transformation           AED 900
- Monthly Maintenance                 AED 500

*All prices include 5% VAT
*Prices subject to change
*Consultation is complimentary
`;

  const mercureGoldPriceList = `
# HAIR TALKZ • MERCURE GOLD
## PREMIUM SALON PRICE LIST 2025

### HAIR CUTTING SERVICES
- Ladies' Hair Cut                    AED 150
- Ladies' Cut & Style                 AED 220
- Men's Hair Cut                      AED 100
- Children's Hair Cut (Under 12)      AED 80
- Fringe Trim                         AED 40

### HAIR COLORING SERVICES
- Full Head Color                     AED 350
- Root Touch Up                       AED 220
- Highlights (Full Head)              AED 480
- Highlights (Half Head)              AED 350
- Balayage                           AED 550
- Ombre                              AED 480
- Fashion Colors                      AED 650
- Color Correction                    from AED 800

### HAIR TREATMENTS
- Keratin Treatment                   AED 750
- Hair Botox Treatment                AED 500
- Olaplex Treatment                   AED 220
- Deep Conditioning                   AED 150
- Scalp Treatment                     AED 180
- Hair Spa                           AED 250

### HAIR STYLING
- Blow Dry                           AED 100
- Updo/Special Occasion              AED 280
- Bridal Hair                        AED 500
- Hair Extensions (Installation)      AED 1,000
- Hair Extensions (Removal)          AED 250

### FACIAL TREATMENTS
- Classic Facial                      AED 300
- Anti-Aging Facial                   AED 420
- Hydrating Facial                    AED 350
- Brightening Facial                  AED 380
- Express Facial                      AED 180

### MASSAGE THERAPY
- Swedish Massage (60 min)            AED 380
- Deep Tissue Massage (60 min)        AED 420
- Hot Stone Massage (75 min)          AED 500
- Aromatherapy Massage (60 min)       AED 400
- Head & Shoulder Massage (30 min)    AED 180

### MEN'S GROOMING
- Beard Trim & Shape                  AED 80
- Hot Towel Shave                     AED 120
- Men's Facial                        AED 250
- Men's Manicure                      AED 100

### EXCLUSIVE PACKAGES
- Bridal Package (5 hours)            AED 2,000
- Mother-Daughter Pamper Day          AED 1,000
- Total Hair Transformation           AED 1,200
- Monthly Maintenance                 AED 650

*All prices include 5% VAT
*Prices subject to change
*Consultation is complimentary
*Valet parking available
`;

  // Save price lists
  fs.writeFileSync(
    path.join(__dirname, 'price-list-park-regis.md'),
    parkRegisPriceList.trim()
  );

  fs.writeFileSync(
    path.join(__dirname, 'price-list-mercure-gold.md'),
    mercureGoldPriceList.trim()
  );

  console.log('✅ Price lists generated successfully!');
  console.log('  - price-list-park-regis.md');
  console.log('  - price-list-mercure-gold.md');
}

// Generate service duration guide
function generateServiceGuide() {
  const serviceGuide = `
# HAIR TALKZ SERVICE DURATION GUIDE

## Quick Services (15-30 minutes)
- Fringe Trim: 15 min
- Men's Hair Cut: 30 min
- Children's Hair Cut: 30 min
- Express Facial: 30 min
- Head & Shoulder Massage: 30 min
- Men's Manicure: 30 min
- Beard Trim & Shape: 30 min

## Standard Services (45-60 minutes)
- Ladies' Hair Cut: 45 min
- Blow Dry: 45 min
- Hot Towel Shave: 45 min
- Men's Facial: 45 min
- Olaplex Treatment: 45 min
- Scalp Treatment: 45 min
- Ladies' Cut & Style: 60 min
- Updo/Special Occasion: 60 min
- Classic Facial: 60 min
- Swedish Massage: 60 min
- Deep Tissue Massage: 60 min
- Aromatherapy Massage: 60 min
- Hair Spa: 60 min

## Extended Services (75-90 minutes)
- Anti-Aging Facial: 75 min
- Hot Stone Massage: 75 min
- Bridal Hair: 90 min
- Root Touch Up: 90 min
- Hair Extensions (Removal): 90 min

## Long Services (2-3 hours)
- Full Head Color: 2 hours
- Hair Botox Treatment: 2 hours
- Highlights (Half Head): 2 hours
- Highlights (Full Head): 2.5 hours
- Ombre: 2.5 hours
- Balayage: 3 hours
- Keratin Treatment: 3 hours
- Fashion Colors: 3 hours
- Hair Extensions (Installation): 3 hours

## Ultra-Long Services (4+ hours)
- Color Correction: 4+ hours
- Bridal Package: 5 hours
- Mother-Daughter Pamper Day: 4 hours (for 2 people)
- Total Hair Transformation: 5 hours

## BOOKING TIPS
- Book color services early in the day
- Allow extra time for consultations
- Package services may be split across stylists
- Patch tests required 48 hours before first color service
- Bridal trials recommended 4-6 weeks before event
`;

  fs.writeFileSync(
    path.join(__dirname, 'service-duration-guide.md'),
    serviceGuide.trim()
  );

  console.log('✅ Service duration guide generated!');
}

// Generate retail product catalog
function generateProductCatalog() {
  const productCatalog = `
# HAIR TALKZ RETAIL PRODUCTS

## PROFESSIONAL HAIR CARE

### Shampoos
| Product | Size | Park Regis | Mercure Gold |
|---------|------|------------|--------------|
| L'Oreal Professional Shampoo | 300ml | AED 120 | AED 140 |
| Kerastase Nutritive Shampoo | 250ml | AED 220 | AED 260 |
| Wella Color Brilliance Shampoo | 250ml | AED 100 | AED 120 |

### Conditioners
| Product | Size | Park Regis | Mercure Gold |
|---------|------|------------|--------------|
| L'Oreal Professional Conditioner | 300ml | AED 125 | AED 145 |
| Kerastase Nutritive Conditioner | 250ml | AED 230 | AED 270 |

### Treatments
| Product | Size | Park Regis | Mercure Gold |
|---------|------|------------|--------------|
| Olaplex No.3 Hair Perfector | 100ml | AED 240 | AED 280 |
| L'Oreal Hair Mask | 200ml | AED 140 | AED 165 |

## STYLING PRODUCTS

| Product | Size | Park Regis | Mercure Gold |
|---------|------|------------|--------------|
| GHD Heat Protect Spray | 120ml | AED 160 | AED 190 |
| L'Oreal Tecni Art Hairspray | 250ml | AED 90 | AED 110 |
| Wella EIMI Hair Mousse | 300ml | AED 105 | AED 125 |

## TOOLS & ACCESSORIES

| Product | Type | Park Regis | Mercure Gold |
|---------|------|------------|--------------|
| GHD Paddle Brush | Professional | AED 220 | AED 260 |
| Wide-Tooth Comb | Standard | AED 25 | AED 30 |

## PRODUCT BENEFITS

### L'Oreal Professional
- Salon-grade quality
- Suitable for all hair types
- Color protection technology

### Kerastase
- Luxury hair care
- Intensive nourishment
- Premium ingredients

### Olaplex
- Patented bond-building technology
- Repairs damaged hair
- Professional results at home

### GHD
- Heat protection up to 230°C
- Professional styling tools
- Long-lasting results

*All prices include 5% VAT
*10% commission on all retail sales for stylists
`;

  fs.writeFileSync(
    path.join(__dirname, 'retail-product-catalog.md'),
    productCatalog.trim()
  );

  console.log('✅ Product catalog generated!');
}

// Main execution
function main() {
  console.log('📋 Generating Hair Talkz documentation...\n');
  
  generatePriceList();
  generateServiceGuide();
  generateProductCatalog();
  
  console.log('\n✅ All documentation generated successfully!');
}

main();