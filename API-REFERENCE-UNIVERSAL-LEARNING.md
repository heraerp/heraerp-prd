# 🔧 **HERA Universal Learning System - API Reference**

## 📋 **Base URL & Authentication**

```
Base URL: http://localhost:3002/api/v1/learning/ca-final
Content-Type: application/json
Authentication: Bearer token (when implemented)
```

---

## 🎯 **Core API Endpoints**

### **1. Save Educational Content with Smart Code Classification**

**Endpoint**: `POST /api/v1/learning/ca-final`

**Action**: `save_generated_content`

**Purpose**: Save educational content with automatic Smart Code classification and cross-domain reuse detection.

#### **Request Body**:
```json
{
  "action": "save_generated_content",
  "data": {
    "title": "Content Title",
    "subject_domain": "MEDICINE|ENGINEERING|BUSINESS|MATHEMATICS|etc.",
    "educational_context": "K12|UNI|PROF|CORP|LIFE",
    "topic_id": "specific_topic_identifier",
    "difficulty_level": "easy|medium|hard",
    "question": "Educational question content",
    "answer": "Comprehensive answer",
    "explanation": "Educational explanation and context",
    "tags": ["tag1", "tag2", "tag3"],
    "bloom_level": "remember|understand|apply|analyze|evaluate|create"
  }
}
```

#### **Response**:
```json
{
  "success": true,
  "data": {
    "saved_entity": {
      "entity_id": "SAVED_CONTENT_1234567890",
      "smart_code": "HERA.PROF.MED.ETHICS.MEDIUM.v1",
      "entity_type": "saved_question",
      "entity_name": "Medical Ethics Content",
      "status": "active",
      "created_at": "2024-08-04T12:00:00Z"
    },
    "smart_code_classification": {
      "primary": "HERA.PROF.MED.ETHICS.MEDIUM.v1",
      "secondary": ["HERA.UNI.CONCEPT.ETHICS.v1"],
      "crossSubject": true,
      "reuseDomains": ["Medicine", "Law", "Business", "Engineering"],
      "universalConcepts": ["ethics", "medicine", "philosophy"],
      "context": "PROF",
      "applicabilityScore": 0.95
    },
    "reuse_potential": {
      "cross_subject": true,
      "applicable_domains": ["Medicine", "Law", "Business", "Engineering"],
      "secondary_classifications": ["HERA.UNI.CONCEPT.ETHICS.v1"]
    },
    "message": "Content saved with Smart Code HERA.PROF.MED.ETHICS.MEDIUM.v1 for multi-domain reuse"
  },
  "smart_code": "HERA.PROF.MED.ETHICS.MEDIUM.v1",
  "timestamp": "2024-08-04T12:00:00Z"
}
```

#### **Subject Domain Options**:
- **STEM**: `MATHEMATICS`, `PHYSICS`, `CHEMISTRY`, `BIOLOGY`, `ENGINEERING`, `COMPUTER_SCIENCE`
- **Medical**: `MEDICINE`, `NURSING`, `PHARMACY`, `HEALTHCARE`
- **Business**: `BUSINESS`, `FINANCE`, `ACCOUNTING`, `MANAGEMENT`, `MARKETING`
- **Legal**: `LAW`, `COMPLIANCE`, `REGULATORY`
- **Languages**: `ENGLISH`, `SPANISH`, `MANDARIN`, `FRENCH`
- **Arts**: `VISUAL_ARTS`, `MUSIC`, `CREATIVE_WRITING`, `DESIGN`
- **Universal**: `UNIVERSAL` (for cross-domain content)

---

### **2. Retrieve Cross-Subject Questions**

**Endpoint**: `POST /api/v1/learning/ca-final`

**Action**: `get_saved_questions`

**Purpose**: Retrieve educational questions with cross-subject filtering and Smart Code matching.

#### **Request Body**:
```json
{
  "action": "get_saved_questions",
  "data": {
    "subject_domain": "MEDICINE",
    "topic_id": "ethics",
    "difficulty_level": "medium",
    "cross_subject_reuse": true,
    "applicability_threshold": 0.7,
    "bloom_level": "analyze",
    "limit": 10
  }
}
```

#### **Response**:
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "entity_id": "UNIVERSAL_ETHICS_001",
        "question": "What are the core principles of professional ethics?",
        "answer": "Integrity, Responsibility, Respect, and Fairness form the foundation of professional conduct across all disciplines.",
        "explanation": "These ethical principles are universal and apply to medical practice, legal work, engineering, and business.",
        "topic_id": "professional_ethics",
        "subject_domain": "UNIVERSAL",
        "difficulty_level": "medium",
        "tags": ["ethics", "professional conduct", "integrity", "responsibility"],
        "primary_smart_code": "HERA.UNI.CONCEPT.ETHICS.v1",
        "secondary_smart_codes": [],
        "cross_subject_applicable": true,
        "reuse_domains": ["Medicine", "Law", "Business", "Engineering", "Psychology", "Education"],
        "applicability_score": 1.0,
        "usage_count": 70,
        "created_by_ai": true,
        "source": "chatgpt_generated_universal"
      }
    ],
    "primary_matches": 2,
    "cross_subject_matches": 8,
    "total_available": 10,
    "filters_applied": {
      "subject_domain": "MEDICINE",
      "difficulty_level": "medium",
      "cross_subject_reuse": true,
      "applicability_threshold": 0.7
    },
    "source": "smart_code_database_reuse",
    "reuse_strategy": "multi_domain"
  },
  "smart_code": "HERA.UNI.EDU.QUESTION.REUSABLE.v1",
  "timestamp": "2024-08-04T12:00:00Z"
}
```

---

### **3. Generate Universal Mock Test**

**Endpoint**: `POST /api/v1/learning/ca-final`

**Action**: `create_mock_test`

**Purpose**: Create comprehensive mock tests using Smart Code-based question selection with cross-domain options.

#### **Request Body**:
```json
{
  "action": "create_mock_test",
  "data": {
    "subject_domain": "UNIVERSAL",
    "topic_ids": ["critical_thinking", "communication", "ethics", "problem_solving"],
    "difficulty_mix": { "easy": 25, "medium": 50, "hard": 25 },
    "total_questions": 15,
    "time_limit_minutes": 45,
    "include_cross_subject": true,
    "universal_skills_weight": 0.4,
    "smart_code_filters": [
      "HERA.UNI.SKILL.CRITICAL_THINKING.v1",
      "HERA.UNI.CONCEPT.ETHICS.v1",
      "HERA.UNI.SKILL.COMMUNICATION.v1"
    ]
  }
}
```

#### **Response**:
```json
{
  "success": true,
  "data": {
    "mock_test": {
      "entity_id": "MOCK_TEST_1234567890",
      "smart_code": "HERA.UNI.EDU.TXN.MOCK.v1",
      "entity_type": "mock_test",
      "entity_name": "Universal Skills Mock Test - 2024-08-04",
      "status": "active",
      "created_at": "2024-08-04T12:00:00Z",
      "config": {
        "test_id": "MOCK_TEST_1234567890",
        "subject_domain": "UNIVERSAL",
        "topic_ids": ["critical_thinking", "communication", "ethics"],
        "difficulty_mix": { "easy": 25, "medium": 50, "hard": 25 },
        "total_questions": 15,
        "time_limit_minutes": 45,
        "include_cross_subject": true,
        "universal_skills_weight": 0.4
      },
      "questions": [
        {
          "id": "MT_UNI_001",
          "question": "What is the primary purpose of a SWOT analysis in business strategy?",
          "options": [
            "Financial forecasting",
            "Identifying strengths, weaknesses, opportunities, threats",
            "Employee evaluation",
            "Market pricing"
          ],
          "correct_answer": 1,
          "explanation": "SWOT analysis helps organizations evaluate internal strengths/weaknesses and external opportunities/threats.",
          "difficulty": "medium",
          "topic": "strategic_analysis",
          "subject_domain": "UNIVERSAL",
          "smart_code": "HERA.UNI.SKILL.CRITICAL_THINKING.v1",
          "cross_subject_applicable": true,
          "reuse_domains": ["MBA", "Business", "Management", "Marketing"]
        }
      ]
    },
    "message": "Mock test created with 15 questions from saved bank using Smart Code selection",
    "instructions": "Students across the platform can now access this universally applicable test"
  },
  "smart_code": "HERA.UNI.EDU.TXN.MOCK.v1",
  "timestamp": "2024-08-04T12:00:00Z"
}
```

---

### **4. Get Topic Content (Dual-Tier System)**

**Endpoint**: `POST /api/v1/learning/ca-final`

**Action**: `get_topic_content`

**Purpose**: Retrieve educational content using the dual-tier system (ChatGPT foundation + PDF updates).

#### **Request Body**:
```json
{
  "action": "get_topic_content",
  "data": {
    "topic_id": "auditing_standards",
    "pdf_content": "Latest regulatory updates..." // Optional for Tier 2
  }
}
```

#### **Response (Tier 1 - ChatGPT Foundation)**:
```json
{
  "success": true,
  "data": {
    "topic_id": "auditing_standards",
    "knowledge_source": "tier1_foundation",
    "content": {
      "title": "Auditing Standards & Procedures",
      "concepts": [
        "Professional Skepticism and Independence",
        "Risk Assessment and Internal Controls",
        "Audit Evidence and Documentation",
        "Materiality and Sampling",
        "Audit Reports and Opinions"
      ],
      "learning_elements": [
        {
          "id": "audit_1",
          "type": "concept",
          "title": "Professional Skepticism",
          "content": "Professional skepticism is an attitude of professional doubt that auditors must maintain throughout the audit process.",
          "universalApplicability": 0.9,
          "learning_science": {
            "bloomsLevel": "application",
            "learningStyle": "multimodal",
            "difficulty": "intermediate"
          }
        }
      ],
      "study_time_estimate": 45,
      "difficulty": "intermediate",
      "prerequisites": ["Basic accounting principles"],
      "questions": [
        {
          "id": "Q_auditing_standards_001",
          "question": "What is professional skepticism and why is it crucial for auditors?",
          "answer": "Professional skepticism is an attitude of professional doubt that includes a questioning mind and critical assessment of audit evidence...",
          "difficulty": "medium",
          "tags": ["professional_skepticism", "audit_principles", "ethics"]
        }
      ]
    },
    "last_updated": "2024-06-01",
    "requires_pdf": false
  },
  "smart_code": "HERA.CA.AUDIT.STANDARDS.v1",
  "timestamp": "2024-08-04T12:00:00Z"
}
```

---

## 🔍 **Query Parameters & Filtering**

### **Smart Code Filtering**
```json
{
  "smart_code_filters": [
    "HERA.UNI.SKILL.CRITICAL_THINKING.v1",
    "HERA.UNI.CONCEPT.ETHICS.v1",
    "HERA.PROF.MED.*" // Wildcard for all medical professional content
  ]
}
```

### **Educational Context Filtering**
```json
{
  "educational_context": "K12|UNI|PROF|CORP|LIFE",
  "age_appropriate": true,
  "cognitive_level": "beginner|intermediate|advanced"
}
```

### **Cross-Domain Options**
```json
{
  "cross_subject_reuse": true,
  "applicability_threshold": 0.7, // 0.0 to 1.0
  "reuse_strategy": "single_domain|multi_domain",
  "universal_skills_only": false
}
```

---

## 📊 **Response Status Codes**

- **200 OK**: Successful operation
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Content or endpoint not found
- **500 Internal Server Error**: Server processing error

---

## 🧪 **Error Handling**

### **Error Response Format**:
```json
{
  "success": false,
  "error": "Failed to save generated content",
  "details": "Missing required field: subject_domain",
  "smart_code": "HERA.CA.EDU.ERROR.SAVE.v1",
  "timestamp": "2024-08-04T12:00:00Z"
}
```

### **Common Error Codes**:
- `HERA.CA.EDU.ERROR.SAVE.v1` - Content save failure
- `HERA.CA.EDU.ERROR.RETRIEVE.v1` - Content retrieval failure
- `HERA.CA.EDU.ERROR.MOCK_TEST.v1` - Mock test generation failure
- `HERA.CA.EDU.ERROR.INVALID_ACTION.v1` - Invalid API action
- `HERA.CA.EDU.ERROR.PROCESS.v1` - General processing error

---

## 🛠️ **Development & Testing**

### **Test Scripts**
```bash
# Test comprehensive universal system
node test-comprehensive-universal-system.js

# Test Smart Code reuse functionality  
node test-smart-code-reuse-system.js

# Test database reuse capabilities
node test-database-reuse-system.js
```

### **API Health Check**
```http
GET /api/v1/learning/ca-final/health

Response:
{
  "status": "healthy",
  "smartCodeSystem": "operational", 
  "universalLearning": "active",
  "crossDomainReuse": "enabled",
  "version": "v3.2"
}
```

---

## 📚 **Usage Examples**

### **JavaScript/TypeScript**
```javascript
// Save medical ethics content
const saveContent = async () => {
  const response = await fetch('/api/v1/learning/ca-final', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_generated_content',
      data: {
        title: 'Medical Ethics Dilemma',
        subject_domain: 'MEDICINE',
        educational_context: 'PROF',
        question: 'How do you balance patient autonomy with beneficence?',
        answer: 'Respect patient decisions while ensuring informed consent...',
        tags: ['ethics', 'autonomy', 'beneficence', 'medical_decision_making']
      }
    })
  });
  
  const result = await response.json();
  console.log('Smart Code:', result.data.smart_code_classification.primary);
  console.log('Reusable in:', result.data.smart_code_classification.reuseDomains);
};
```

### **Python**
```python
import requests
import json

def save_educational_content(content_data):
    url = "http://localhost:3002/api/v1/learning/ca-final"
    payload = {
        "action": "save_generated_content",
        "data": content_data
    }
    
    response = requests.post(url, json=payload)
    result = response.json()
    
    if result['success']:
        print(f"Smart Code: {result['data']['smart_code_classification']['primary']}")
        print(f"Cross-subject: {result['data']['smart_code_classification']['crossSubject']}")
        print(f"Reuse domains: {', '.join(result['data']['smart_code_classification']['reuseDomains'])}")
    
    return result

# Example usage
content = {
    "title": "Engineering Problem Solving",
    "subject_domain": "ENGINEERING", 
    "educational_context": "UNI",
    "question": "Describe systematic problem-solving methodology",
    "answer": "Engineering problem-solving follows: 1) Problem identification...",
    "tags": ["engineering", "problem_solving", "methodology"]
}

result = save_educational_content(content)
```

---

## 🔗 **Integration Examples**

### **React Component**
```jsx
import React, { useState, useEffect } from 'react';

const UniversalLearningComponent = ({ studentDomain }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchCrossSubjectQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/learning/ca-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_saved_questions',
          data: {
            subject_domain: studentDomain,
            cross_subject_reuse: true,
            applicability_threshold: 0.8,
            limit: 10
          }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setQuestions(data.data.questions);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCrossSubjectQuestions();
  }, [studentDomain]);
  
  return (
    <div className="universal-learning">
      <h2>Universal Learning Content for {studentDomain}</h2>
      {loading ? (
        <p>Loading cross-subject content...</p>
      ) : (
        <div className="questions-list">
          {questions.map((question, index) => (
            <div key={index} className="question-card">
              <h3>{question.question}</h3>
              <p>{question.answer}</p>
              <div className="metadata">
                <span>Smart Code: {question.primary_smart_code}</span>
                <span>Reusable in: {question.reuse_domains.join(', ')}</span>
                <span>Applicability: {(question.applicability_score * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UniversalLearningComponent;
```

---

**The HERA Universal Learning System API provides comprehensive educational content management with intelligent Smart Code classification and cross-domain reuse capabilities for any learning platform! 🎓🚀**