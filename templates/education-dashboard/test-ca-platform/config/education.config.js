// Test CA Platform Configuration
export default {
  // Basic Configuration
  name: 'Test CA Platform',
  domain: 'accounting',
  subject: 'CA Final',
  examDate: null,
  
  // AI Configuration
  aiProvider: 'auto',
  difficulty: 'adaptive',
  
  // Gamification
  pointsSystem: true,
  achievements: true,
  leaderboards: true,
  
  // Learning Modes
  modes: ['concept', 'story', 'drill', 'mock'],
  
  // Branding
  primaryColor: '#3b82f6',
  secondaryColor: '#6366f1',
  logo: '/logo.png',
  
  // Smart Codes
  smartCodes: [
  "HERA.CA.EDU.TOPIC",
  "HERA.ACCOUNTING.EDU"
],
  
  // Topics Configuration
  topics: [
  {
    "id": "financial-accounting",
    "name": "Financial Accounting",
    "difficulty": "medium"
  },
  {
    "id": "taxation",
    "name": "Taxation",
    "difficulty": "hard"
  },
  {
    "id": "auditing",
    "name": "Auditing",
    "difficulty": "hard"
  },
  {
    "id": "corporate-law",
    "name": "Corporate Law",
    "difficulty": "medium"
  }
]
}
