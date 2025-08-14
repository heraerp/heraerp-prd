#!/usr/bin/env node

/**
 * HERA CRM Demo Data Setup
 * Generates realistic enterprise demo data for customer presentations
 */

const demoCompany = {
  name: 'TechVantage Solutions',
  industry: 'Technology Consulting',
  employees: 150,
  revenue: '$25M ARR',
  description: 'Leading digital transformation consultancy for enterprise clients'
}

const salesTeam = [
  {
    name: 'Jennifer Martinez',
    role: 'VP of Sales', 
    email: 'jmartinez@techvantage.com',
    quota: '$2.5M',
    achievement: '115%'
  },
  {
    name: 'Robert Kim',
    role: 'Senior Account Executive',
    email: 'rkim@techvantage.com', 
    quota: '$800K',
    achievement: '128%'
  },
  {
    name: 'Lisa Thompson',
    role: 'Sales Development Manager',
    email: 'lthompson@techvantage.com',
    quota: '$600K', 
    achievement: '97%'
  },
  {
    name: 'Carlos Rodriguez',
    role: 'Account Executive',
    email: 'crodriguez@techvantage.com',
    quota: '$500K',
    achievement: '108%'
  }
]

const targetCompanies = [
  {
    name: 'Global Manufacturing Inc',
    industry: 'Manufacturing',
    employees: '5,000+',
    revenue: '$850M',
    needsDescription: 'Digital transformation of production systems',
    keyContact: 'Michael Thompson - CTO',
    dealSize: '$750,000',
    probability: '85%',
    stage: 'Proposal Submitted',
    nextAction: 'Board presentation scheduled for next week'
  },
  {
    name: 'AI Innovations Corp', 
    industry: 'Artificial Intelligence',
    employees: '1,200',
    revenue: '$180M',
    needsDescription: 'Scaling customer data platform',
    keyContact: 'Sarah Chen - VP Engineering', 
    dealSize: '$450,000',
    probability: '45%',
    stage: 'Discovery',
    nextAction: 'Technical architecture review'
  },
  {
    name: 'Healthcare Systems LLC',
    industry: 'Healthcare',
    employees: '15,000+', 
    revenue: '$2.1B',
    needsDescription: 'Patient data integration project',
    keyContact: 'David Rodriguez - Chief Digital Officer',
    dealSize: '$320,000',
    probability: '90%',
    stage: 'Contract Negotiation',
    nextAction: 'Final pricing discussion'
  },
  {
    name: 'Retail Excellence Group',
    industry: 'Retail', 
    employees: '800',
    revenue: '$120M',
    needsDescription: 'Omnichannel customer experience platform',
    keyContact: 'Emma Wilson - Director of Digital',
    dealSize: '$180,000',
    probability: '60%',
    stage: 'Qualified Opportunity',
    nextAction: 'Demo scheduled for key stakeholders'
  }
]

console.log('🎯 Setting up TechVantage Solutions Demo Environment...')
console.log('')
console.log('Demo Company:', demoCompany.name)
console.log('Sales Team:', salesTeam.length, 'members')
console.log('Target Pipeline:', targetCompanies.length, 'companies')
console.log('Total Pipeline Value: $1.70M')
console.log('Weighted Pipeline Value: $1.31M')
console.log('')
console.log('✅ Demo data setup complete!')
console.log('🚀 Ready for customer presentations')

module.exports = {
  demoCompany,
  salesTeam, 
  targetCompanies
}