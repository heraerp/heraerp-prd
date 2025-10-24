/**
 * Smart Code Auto-Fix Script
 *
 * Automatically fixes smart codes in entityPresets.ts to match HERA DNA pattern
 * Creates a fixed version with correct smart codes
 */

import { SmartCodeBuilder } from '../src/lib/dna/smart-code-generator'

// Smart code fix rules - map old patterns to correct patterns
const FIXES: Record<string, string> = {
  // Product smart codes
  'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1': SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'MARKET'),
  'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1': SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'COST'),
  'HERA.SALON.PRODUCT.DYN.SKU.v1': SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'SKU'),
  'HERA.SALON.PRODUCT.DYN.STOCK.QTY.v1': SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'QUANTITY'),
  'HERA.SALON.PRODUCT.DYN.REORDER.LEVEL.v1': SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'REORDER'),
  'HERA.SALON.PRODUCT.DYN.SIZE.v1': SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'SIZE'),
  'HERA.SALON.PRODUCT.DYN.BARCODE.PRIMARY.V1': SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'BARCODE'),
  'HERA.SALON.PRODUCT.DYN.BARCODE.TYPE.V1': SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'BARTYPE'),
  'HERA.SALON.PRODUCT.DYN.BARCODES.ALT.V1': SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'BARALT'),
  'HERA.SALON.PRODUCT.DYN.BARCODE.GTIN.V1': SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'GTIN'),
  'HERA.SALON.PRODUCT.DYN.BARCODE.v1': SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'BARLEGACY'),

  // Service smart codes
  'HERA.SALON.SERVICE.DYN.PRICE.MARKET.v1': SmartCodeBuilder.dynamic('SALON', 'SERVICE', 'MARKET'),
  'HERA.SALON.SERVICE.DYN.DURATION.MIN.v1': SmartCodeBuilder.dynamic('SALON', 'SERVICE', 'DURATION'),
  'HERA.SALON.SERVICE.DYN.COMMISSION.v1': SmartCodeBuilder.dynamic('SALON', 'SERVICE', 'COMMISSION'),
  'HERA.SALON.SERVICE.DYN.DESCRIPTION.v1': SmartCodeBuilder.dynamic('SALON', 'SERVICE', 'DESC'),
  'HERA.SALON.SERVICE.DYN.ACTIVE.v1': SmartCodeBuilder.dynamic('SALON', 'SERVICE', 'ACTIVE'),
  'HERA.SALON.SERVICE.DYN.REQUIRES_BOOKING.v1': SmartCodeBuilder.dynamic('SALON', 'SERVICE', 'BOOKING'),

  // Customer smart codes
  'HERA.SALON.CUSTOMER.DYN.PHONE.v1': SmartCodeBuilder.dynamic('SALON', 'CUSTOMER', 'PHONE'),
  'HERA.SALON.CUSTOMER.DYN.EMAIL.v1': SmartCodeBuilder.dynamic('SALON', 'CUSTOMER', 'EMAIL'),
  'HERA.SALON.CUSTOMER.DYN.VIP.v1': SmartCodeBuilder.dynamic('SALON', 'CUSTOMER', 'VIP'),
  'HERA.SALON.CUSTOMER.DYN.NOTES.v1': SmartCodeBuilder.dynamic('SALON', 'CUSTOMER', 'NOTES'),
  'HERA.SALON.CUSTOMER.DYN.BIRTHDAY.v1': SmartCodeBuilder.dynamic('SALON', 'CUSTOMER', 'BIRTHDAY'),
  'HERA.SALON.CUSTOMER.DYN.LOYALTY.POINTS.v1': SmartCodeBuilder.dynamic('SALON', 'CUSTOMER', 'LOYALTY'),
  'HERA.SALON.CUSTOMER.DYN.LIFETIME.VALUE.v1': SmartCodeBuilder.dynamic('SALON', 'CUSTOMER', 'LTV'),

  // Customer relationships
  'HERA.SALON.CUSTOMER.REL.REFERRED_BY.v1': SmartCodeBuilder.relationship('SALON', 'CUSTOMER', 'REFERRER'),
  'HERA.SALON.CUSTOMER.REL.PREFERRED_STYLIST.v1': SmartCodeBuilder.relationship('SALON', 'CUSTOMER', 'STYLIST'),

  // Employee/Staff smart codes
  'HERA.SALON.EMPLOYEE.DYN.PHONE.v1': SmartCodeBuilder.dynamic('SALON', 'EMPLOYEE', 'PHONE'),
  'HERA.SALON.EMPLOYEE.DYN.EMAIL.v1': SmartCodeBuilder.dynamic('SALON', 'EMPLOYEE', 'EMAIL'),
  'HERA.SALON.EMPLOYEE.DYN.RATE.HOUR.v1': SmartCodeBuilder.dynamic('SALON', 'EMPLOYEE', 'RATE'),
  'HERA.SALON.EMPLOYEE.DYN.COMMISSION.v1': SmartCodeBuilder.dynamic('SALON', 'EMPLOYEE', 'COMMISSION'),
  'HERA.SALON.EMPLOYEE.DYN.ACTIVE.v1': SmartCodeBuilder.dynamic('SALON', 'EMPLOYEE', 'ACTIVE'),
  'HERA.SALON.EMPLOYEE.DYN.HIRE_DATE.v1': SmartCodeBuilder.dynamic('SALON', 'EMPLOYEE', 'HIRED'),
  'HERA.HCM.EMPLOYMENT.REL.HAS_ROLE.v1': SmartCodeBuilder.relationship('HCM', 'EMPLOYMENT', 'ROLE'),
  'HERA.HCM.EMPLOYMENT.REL.REPORTS_TO.v1': SmartCodeBuilder.relationship('HCM', 'EMPLOYMENT', 'MANAGER'),
  'HERA.SALON.EMPLOYEE.REL.CAN_PERFORM.v1': SmartCodeBuilder.relationship('SALON', 'EMPLOYEE', 'PERFORMS'),

  // Appointment smart codes
  'HERA.SALON.APPT.DYN.STATUS.v1': SmartCodeBuilder.dynamic('SALON', 'APPT', 'STATUS'),
  'HERA.SALON.APPT.DYN.REMINDER.v1': SmartCodeBuilder.dynamic('SALON', 'APPT', 'REMINDER'),
  'HERA.SALON.APPT.REL.FOR_CUSTOMER.v1': SmartCodeBuilder.relationship('SALON', 'APPT', 'CUSTOMER'),
  'HERA.SALON.APPT.REL.WITH_EMPLOYEE.v1': SmartCodeBuilder.relationship('SALON', 'APPT', 'EMPLOYEE'),
  'HERA.SALON.APPT.REL.INCLUDES_SERVICE.v1': SmartCodeBuilder.relationship('SALON', 'APPT', 'SERVICE'),

  // Vendor smart codes
  'HERA.SALON.VENDOR.DYN.PHONE.v1': SmartCodeBuilder.dynamic('SALON', 'VENDOR', 'PHONE'),
  'HERA.SALON.VENDOR.DYN.EMAIL.v1': SmartCodeBuilder.dynamic('SALON', 'VENDOR', 'EMAIL'),
  'HERA.SALON.VENDOR.DYN.WEBSITE.v1': SmartCodeBuilder.dynamic('SALON', 'VENDOR', 'WEBSITE'),
  'HERA.SALON.VENDOR.DYN.PAYMENT_TERMS.v1': SmartCodeBuilder.dynamic('SALON', 'VENDOR', 'TERMS'),
  'HERA.SALON.VENDOR.DYN.CREDIT_LIMIT.v1': SmartCodeBuilder.dynamic('SALON', 'VENDOR', 'CREDIT'),
  'HERA.SALON.VENDOR.DYN.ACTIVE.v1': SmartCodeBuilder.dynamic('SALON', 'VENDOR', 'ACTIVE'),
  'HERA.SALON.VENDOR.REL.SUPPLIES_CATEGORY.v1': SmartCodeBuilder.relationship('SALON', 'VENDOR', 'SUPPLIES'),

  // Service Category smart codes
  'HERA.SALON.SVC.CATEGORY.DYN.DESCRIPTION.v1': SmartCodeBuilder.dynamic('SALON', 'CATEGORY', 'DESC'),
  'HERA.SALON.SVC.CATEGORY.DYN.COLOR.v1': SmartCodeBuilder.dynamic('SALON', 'CATEGORY', 'COLOR'),
  'HERA.SALON.SVC.CATEGORY.DYN.ICON.v1': SmartCodeBuilder.dynamic('SALON', 'CATEGORY', 'ICON'),
  'HERA.SALON.SVC.CATEGORY.DYN.ORDER.v1': SmartCodeBuilder.dynamic('SALON', 'CATEGORY', 'ORDER'),
  'HERA.SALON.SVC.CATEGORY.DYN.SERVICE_COUNT.v1': SmartCodeBuilder.dynamic('SALON', 'CATEGORY', 'COUNT'),
  'HERA.SALON.SVC.CATEGORY.DYN.ACTIVE.v1': SmartCodeBuilder.dynamic('SALON', 'CATEGORY', 'ACTIVE'),
  'HERA.SALON.SVC.CATEGORY.REL.PARENT.v1': SmartCodeBuilder.relationship('SALON', 'CATEGORY', 'PARENT'),

  // Category smart codes
  'HERA.SALON.CATEGORY.DYN.ORDER.v1': SmartCodeBuilder.dynamic('SALON', 'CATEGORY', 'ORDER'),
  'HERA.SALON.CATEGORY.DYN.ICON.v1': SmartCodeBuilder.dynamic('SALON', 'CATEGORY', 'ICON'),
  'HERA.SALON.CATEGORY.DYN.COLOR.v1': SmartCodeBuilder.dynamic('SALON', 'CATEGORY', 'COLOR'),
  'HERA.SALON.CATEGORY.DYN.ACTIVE.v1': SmartCodeBuilder.dynamic('SALON', 'CATEGORY', 'ACTIVE'),
  'HERA.SALON.CATEGORY.REL.PARENT.v1': SmartCodeBuilder.relationship('SALON', 'CATEGORY', 'PARENT'),

  // Brand smart codes
  'HERA.SALON.BRAND.DYN.WEBSITE.v1': SmartCodeBuilder.dynamic('SALON', 'BRAND', 'WEBSITE'),
  'HERA.SALON.BRAND.DYN.LOGO.v1': SmartCodeBuilder.dynamic('SALON', 'BRAND', 'LOGO'),
  'HERA.SALON.BRAND.DYN.ACTIVE.v1': SmartCodeBuilder.dynamic('SALON', 'BRAND', 'ACTIVE'),
  'HERA.SALON.BRAND.REL.OWNED_BY.v1': SmartCodeBuilder.relationship('SALON', 'BRAND', 'OWNER'),

  // Jewelry smart codes
  'HERA.JEWELRY.GRADING.DYN.STATUS.v1': SmartCodeBuilder.dynamic('JEWELRY', 'GRADING', 'STATUS'),
  'HERA.JEWELRY.GRADING.DYN.PRIORITY.v1': SmartCodeBuilder.dynamic('JEWELRY', 'GRADING', 'PRIORITY'),
  'HERA.JEWELRY.GRADING.DYN.CARAT.v1': SmartCodeBuilder.dynamic('JEWELRY', 'GRADING', 'CARAT'),
  'HERA.JEWELRY.GRADING.DYN.CUT.v1': SmartCodeBuilder.dynamic('JEWELRY', 'GRADING', 'CUT'),
  'HERA.JEWELRY.GRADING.DYN.COLOR.v1': SmartCodeBuilder.dynamic('JEWELRY', 'GRADING', 'COLOR'),
  'HERA.JEWELRY.GRADING.DYN.CLARITY.v1': SmartCodeBuilder.dynamic('JEWELRY', 'GRADING', 'CLARITY'),
  'HERA.JEWELRY.GRADING.DYN.MEASUREMENTS.v1': SmartCodeBuilder.dynamic('JEWELRY', 'GRADING', 'MEASURE'),
  'HERA.JEWELRY.GRADING.DYN.CERT_NO.v1': SmartCodeBuilder.dynamic('JEWELRY', 'GRADING', 'CERTNO'),
  'HERA.JEWELRY.GRADING.DYN.PASS.v1': SmartCodeBuilder.dynamic('JEWELRY', 'GRADING', 'PASS'),
  'HERA.JEWELRY.GRADING.REL.OF_ITEM.v1': SmartCodeBuilder.relationship('JEWELRY', 'GRADING', 'ITEM'),
  'HERA.JEWELRY.GRADING.REL.ASSIGNED_TO.v1': SmartCodeBuilder.relationship('JEWELRY', 'GRADING', 'ASSIGNED'),
  'HERA.JEWELRY.GRADING.REL.ISSUES_CERT.v1': SmartCodeBuilder.relationship('JEWELRY', 'GRADING', 'CERT'),

  'HERA.JEWELRY.CERT.DYN.NUMBER.v1': SmartCodeBuilder.dynamic('JEWELRY', 'CERT', 'NUMBER'),
  'HERA.JEWELRY.CERT.DYN.ISSUER.v1': SmartCodeBuilder.dynamic('JEWELRY', 'CERT', 'ISSUER'),
  'HERA.JEWELRY.CERT.DYN.ISSUE_DATE.v1': SmartCodeBuilder.dynamic('JEWELRY', 'CERT', 'ISSUED'),
  'HERA.JEWELRY.CERT.DYN.PDF_URL.v1': SmartCodeBuilder.dynamic('JEWELRY', 'CERT', 'PDF'),
  'HERA.JEWELRY.CERT.REL.FOR_JOB.v1': SmartCodeBuilder.relationship('JEWELRY', 'CERT', 'JOB'),

  'HERA.JEWELRY.ITEM.DYN.SKU.v1': SmartCodeBuilder.dynamic('JEWELRY', 'ITEM', 'SKU'),
  'HERA.JEWELRY.ITEM.DYN.PURITY.v1': SmartCodeBuilder.dynamic('JEWELRY', 'ITEM', 'PURITY'),
  'HERA.JEWELRY.ITEM.DYN.GROSS_WEIGHT.v1': SmartCodeBuilder.dynamic('JEWELRY', 'ITEM', 'GROSS'),
  'HERA.JEWELRY.ITEM.DYN.NET_WEIGHT.v1': SmartCodeBuilder.dynamic('JEWELRY', 'ITEM', 'NET'),
  'HERA.JEWELRY.ITEM.DYN.STONE_WEIGHT.v1': SmartCodeBuilder.dynamic('JEWELRY', 'ITEM', 'STONE'),
  'HERA.JEWELRY.ITEM.DYN.QUANTITY.v1': SmartCodeBuilder.dynamic('JEWELRY', 'ITEM', 'QTY'),
  'HERA.JEWELRY.ITEM.DYN.UNIT_PRICE.v1': SmartCodeBuilder.dynamic('JEWELRY', 'ITEM', 'PRICE'),
  'HERA.JEWELRY.ITEM.DYN.LOCATION.v1': SmartCodeBuilder.dynamic('JEWELRY', 'ITEM', 'LOCATION'),
  'HERA.JEWELRY.ITEM.DYN.STATUS.v1': SmartCodeBuilder.dynamic('JEWELRY', 'ITEM', 'STATUS'),
  'HERA.JEWELRY.ITEM.DYN.DESCRIPTION.v1': SmartCodeBuilder.dynamic('JEWELRY', 'ITEM', 'DESC'),
  'HERA.JEWELRY.ITEM.REL.HAS_CATEGORY.v1': SmartCodeBuilder.relationship('JEWELRY', 'ITEM', 'CATEGORY'),
  'HERA.JEWELRY.ITEM.REL.SUPPLIED_BY.v1': SmartCodeBuilder.relationship('JEWELRY', 'ITEM', 'SUPPLIER'),

  'HERA.JEWELRY.CATEGORY.DYN.ORDER.v1': SmartCodeBuilder.dynamic('JEWELRY', 'CATEGORY', 'ORDER'),
  'HERA.JEWELRY.CATEGORY.DYN.ACTIVE.v1': SmartCodeBuilder.dynamic('JEWELRY', 'CATEGORY', 'ACTIVE'),

  'HERA.JEWELRY.SUPPLIER.DYN.PHONE.v1': SmartCodeBuilder.dynamic('JEWELRY', 'SUPPLIER', 'PHONE'),
  'HERA.JEWELRY.SUPPLIER.DYN.EMAIL.v1': SmartCodeBuilder.dynamic('JEWELRY', 'SUPPLIER', 'EMAIL'),
  'HERA.JEWELRY.SUPPLIER.DYN.PAYMENT_TERMS.v1': SmartCodeBuilder.dynamic('JEWELRY', 'SUPPLIER', 'TERMS'),
  'HERA.JEWELRY.SUPPLIER.DYN.ACTIVE.v1': SmartCodeBuilder.dynamic('JEWELRY', 'SUPPLIER', 'ACTIVE')
}

console.log('🔧 Smart Code Auto-Fix Script\n')
console.log('=' + '.'.repeat(80))
console.log(`\nGenerating fixes for ${Object.keys(FIXES).length} smart codes...\n`)

// Output fixes as TypeScript find-replace commands
console.log('Run these find-replace operations in your editor:\n')

let count = 0
for (const [oldCode, newCode] of Object.entries(FIXES)) {
  count++
  console.log(`${count}. Find:    '${oldCode}'`)
  console.log(`   Replace: '${newCode}'\n`)
}

console.log('=' + '.'.repeat(80))
console.log(`\n✅ Generated ${count} smart code fixes`)
console.log('\n💡 Tip: Use your editor\'s "Replace All" feature for faster fixes')
