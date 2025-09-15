# HERA ERP Readiness Questionnaire

**Smart Code**: `HERA.ERP.READINESS.MODULE.V1`

A comprehensive ERP readiness assessment questionnaire built with HERA's Sacred Six Tables architecture, featuring glassmorphism UI, one-question-at-a-time flow, and AI-powered insights.

## 🎯 Features

- **One-Question-at-a-Time Flow**: Focused UX with beautiful transitions
- **Glassmorphism UI**: Modern glass-like interface with backdrop blur effects
- **12 Business Sections**: Comprehensive coverage of all business areas
- **AI-Powered Insights**: Intelligent analysis and recommendations
- **Sacred Six Tables**: Built on HERA's universal architecture
- **TypeScript-First**: Complete type safety and validation
- **Framer Motion**: Smooth animations and transitions
- **Mobile Responsive**: Works perfectly on all devices

## 🏗️ Architecture

### Sacred Six Tables Integration

```typescript
// Questions stored as entities
core_entities: {
  entity_type: 'questionnaire_question',
  smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1'
}

// Sessions as transactions
universal_transactions: {
  transaction_type: 'questionnaire_session',
  smart_code: 'HERA.ERP.Readiness.Session.Transaction.V1'
}

// Answers as transaction lines
universal_transaction_lines: {
  response_value: userAnswer,
  smart_code: 'HERA.ERP.Readiness.Answer.Line.V1'
}
```

## 🚀 Quick Start

### 1. Basic Usage

```tsx
import { ReadinessWizard, createReadinessTemplate } from '@/modules/readiness-questionnaire'

export default function MyQuestionnairePage() {
  const template = createReadinessTemplate('your-org-id')

  return <ReadinessWizard template={template} session={session} api={api} />
}
```

### 2. With API Integration

```tsx
import { createReadinessServices } from '@/modules/readiness-questionnaire'

const { questionnaireService, aiService } = createReadinessServices('org-id')

// Create session
const session = await questionnaireService.createSession({
  organization_id: 'org-id',
  template_id: template.id,
  respondent_id: 'user-id'
})

// Use with wizard
const api = questionnaireService.createSessionAPI(session)
```

## 📋 Question Types

The system supports 6 different question types:

- **Text**: Short text responses
- **Textarea**: Long-form text responses
- **Select**: Single choice from options
- **Multiselect**: Multiple choices from options
- **YesNo**: Boolean questions with styled UI
- **Number**: Numeric input with validation

## 🧠 AI Analysis

The questionnaire includes AI-powered analysis that provides:

- **Overall Readiness Score**: 0-100 score based on responses
- **Section-Specific Insights**: Detailed analysis per business area
- **Risk Flags**: Identification of credit, compliance, and operational risks
- **Priority Recommendations**: Top 3 actionable recommendations
- **Integration Suggestions**: WhatsApp, CRM, accounting system recommendations

## 🎨 Glassmorphism Styling

The UI features advanced glassmorphism effects:

```css
background: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.25) 0%,
  rgba(255, 255, 255, 0.1) 50%,
  rgba(255, 255, 255, 0.05) 100%
);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.3);
box-shadow:
  0 8px 32px rgba(147, 51, 234, 0.15),
  0 4px 16px rgba(0, 0, 0, 0.1),
  inset 0 1px 0 rgba(255, 255, 255, 0.4);
```

## 📊 Business Sections

1. **Company Profile**: Basic organization information
2. **Sales Management**: Sales processes and channels
3. **Procurement**: Purchasing and vendor management
4. **Production**: Manufacturing and production processes
5. **Inventory**: Stock control and warehouse operations
6. **Projects**: Project-based business operations
7. **Finance**: Accounting and financial reporting
8. **HR & Payroll**: Human resources management
9. **Assets**: Fixed assets and maintenance
10. **IT Infrastructure**: Technology readiness
11. **AI & Automation**: Artificial intelligence readiness
12. **General Expectations**: Timeline and success criteria

## 🔧 API Endpoints

When implemented with the full API:

```
POST /api/v1/readiness/sessions        # Create session
GET  /api/v1/readiness/sessions/:id    # Get session
POST /api/v1/readiness/sessions/:id/answers  # Save answer
PUT  /api/v1/readiness/sessions/:id/progress # Update progress
POST /api/v1/readiness/sessions/:id/complete # Complete session
GET  /api/v1/readiness/sessions/:id/insights # Get AI insights
POST /api/v1/readiness/export         # Export results
```

## 🎭 Smart Codes

All components use HERA Smart Codes for intelligent classification:

```typescript
const SMART_CODES = {
  TEMPLATE: 'HERA.ERP.Readiness.Template.Questionnaire.V1',
  SESSION: 'HERA.ERP.Readiness.Session.Transaction.V1',
  QUESTION_YESNO: 'HERA.ERP.Readiness.Question.YesNo.V1',
  ANSWER_LINE: 'HERA.ERP.Readiness.Answer.Line.V1',
  AI_ANALYSIS: 'HERA.ERP.Readiness.AI.Analysis.V1'
}
```

## 🌟 Key Benefits

- **Zero Schema Changes**: Uses existing Sacred Six Tables
- **Universal Architecture**: Compatible with all HERA systems
- **Type-Safe**: Complete TypeScript coverage
- **Mobile-First**: Responsive design for all devices
- **AI-Enhanced**: Intelligent insights and recommendations
- **Enterprise-Ready**: Production-ready with proper error handling
- **Sacred Compliance**: Follows all HERA architectural principles

## 🚀 Deployment

The questionnaire is accessible at `/readiness-questionnaire` and includes:

- **Landing Page**: Introduction and overview
- **Interactive Wizard**: One-question-at-a-time flow
- **Results Page**: AI insights and recommendations
- **Export Options**: CSV, JSON, and PDF formats

Perfect for businesses evaluating their ERP readiness with HERA's revolutionary approach.
