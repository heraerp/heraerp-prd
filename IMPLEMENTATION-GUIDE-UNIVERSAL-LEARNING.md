# 🚀 **HERA Universal Learning System - Implementation Guide**

## 📋 **Implementation Checklist**

### **Phase 1: Setup & Configuration (30 minutes)**
- [ ] Clone repository and install dependencies
- [ ] Configure environment variables
- [ ] Set up database connections
- [ ] Verify API endpoints
- [ ] Run initial test suite

### **Phase 2: Basic Integration (1-2 hours)**  
- [ ] Implement content saving functionality
- [ ] Add Smart Code classification
- [ ] Test cross-subject question retrieval
- [ ] Configure educational contexts
- [ ] Set up mock test generation

### **Phase 3: Advanced Features (2-4 hours)**
- [ ] Implement cross-domain intelligence
- [ ] Add applicability scoring
- [ ] Configure universal skills detection
- [ ] Set up educational context routing
- [ ] Implement Bloom's taxonomy integration

### **Phase 4: Production Deployment (1-2 hours)**
- [ ] Configure production environment
- [ ] Set up monitoring and logging
- [ ] Implement caching strategies
- [ ] Configure load balancing
- [ ] Set up automated backups

---

## 🏗️ **Step-by-Step Implementation**

### **1. Initial Setup**

```bash
# Clone the HERA Universal Learning System
git clone https://github.com/your-org/hera-universal-learning
cd hera-universal-learning

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local
```

### **2. Environment Configuration**

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3002
HERA_API_URL=https://your-hera-instance.com
HERA_ORG_ID=719dfed1-09b4-4ca8-bfda-f682460de945
SMART_CODE_VERSION=v1

# Universal Learning Configuration
UNIVERSAL_LEARNING_ENABLED=true
CROSS_DOMAIN_REUSE=true
EDUCATIONAL_CONTEXTS=K12,UNI,PROF,CORP,LIFE
DEFAULT_APPLICABILITY_THRESHOLD=0.7

# Database Configuration (if using direct DB access)
DATABASE_URL=postgresql://user:password@localhost:5432/hera_universal
REDIS_URL=redis://localhost:6379

# AI/ML Configuration (optional)
OPENAI_API_KEY=your-openai-key
ENABLE_AI_CLASSIFICATION=true
```

### **3. Database Setup**

```sql
-- Enhanced Universal Tables for Learning Content
-- (These extend the existing HERA 6-table schema)

-- Add learning-specific entity types to core_entities
INSERT INTO core_entities (entity_type, entity_name, smart_code, organization_id) VALUES
('learning_content', 'Educational Content', 'HERA.UNI.EDU.ENT.CONTENT.v1', 'your-org-id'),
('learning_topic', 'Learning Topic', 'HERA.UNI.EDU.ENT.TOPIC.v1', 'your-org-id'),
('learning_path', 'Learning Path', 'HERA.UNI.EDU.ENT.PATH.v1', 'your-org-id'),
('student', 'Student Record', 'HERA.UNI.EDU.ENT.STUDENT.v1', 'your-org-id'),
('assessment', 'Assessment/Test', 'HERA.UNI.EDU.ENT.ASSESSMENT.v1', 'your-org-id');

-- Add indexes for Smart Code queries
CREATE INDEX idx_smart_code_primary ON core_dynamic_data(field_value) 
WHERE field_name = 'primary_smart_code';

CREATE INDEX idx_cross_subject ON core_dynamic_data(field_value) 
WHERE field_name = 'cross_subject_applicable';

CREATE INDEX idx_reuse_domains ON core_dynamic_data USING GIN(field_value::jsonb) 
WHERE field_name = 'reuse_domains';

CREATE INDEX idx_educational_context ON core_dynamic_data(field_value) 
WHERE field_name = 'educational_context';

CREATE INDEX idx_applicability_score ON core_dynamic_data(CAST(field_value AS NUMERIC)) 
WHERE field_name = 'applicability_score';
```

### **4. Core Implementation**

#### **A. Smart Code Service Implementation**

```typescript
// src/lib/smart-code/SmartCodeService.ts
export class SmartCodeService {
  
  static async classifyEducationalContent(content: EducationalContent): Promise<SmartCodeClassification> {
    // Extract universal concepts
    const concepts = await this.extractUniversalConcepts(content.question, content.tags);
    
    // Generate Smart Code
    const classification = await this.generateSmartCode({
      subject_domain: content.subject_domain,
      educational_context: content.educational_context,
      topic_id: content.topic_id,
      difficulty_level: content.difficulty_level,
      concepts: concepts
    });
    
    // Calculate cross-domain applicability
    const applicabilityScore = this.calculateApplicabilityScore(concepts, classification.reuseDomains);
    
    return {
      primary: classification.primary,
      secondary: classification.secondary,
      crossSubject: classification.crossSubject,
      reuseDomains: classification.reuseDomains,
      universalConcepts: concepts,
      applicabilityScore: applicabilityScore,
      context: content.educational_context
    };
  }
  
  private static async extractUniversalConcepts(text: string, tags: string[]): Promise<string[]> {
    const universalKeywords = {
      'critical_thinking': ['analyze', 'evaluate', 'reasoning', 'logic', 'evidence'],
      'communication': ['speak', 'write', 'present', 'persuasion', 'audience'],
      'problem_solving': ['problem', 'solution', 'solve', 'troubleshoot', 'optimize'],
      'ethics': ['ethical', 'moral', 'values', 'integrity', 'responsibility'],
      'research': ['research', 'investigate', 'methodology', 'evidence', 'citation'],
      'mathematics': ['calculate', 'formula', 'equation', 'percentage', 'ratio'],
      'science': ['hypothesis', 'experiment', 'data', 'analysis', 'conclusion'],
      'medicine': ['diagnosis', 'treatment', 'patient', 'symptoms', 'clinical'],
      'engineering': ['design', 'mechanical', 'systems', 'manufacturing', 'optimization'],
      'business': ['strategy', 'management', 'market', 'customer', 'profit'],
      'law': ['legal', 'regulation', 'compliance', 'contract', 'constitutional']
    };
    
    const combinedText = (text + ' ' + tags.join(' ')).toLowerCase();
    const detectedConcepts: string[] = [];
    
    Object.entries(universalKeywords).forEach(([concept, keywords]) => {
      const matchCount = keywords.filter(keyword => combinedText.includes(keyword)).length;
      if (matchCount > 0) {
        detectedConcepts.push(concept);
      }
    });
    
    return detectedConcepts;
  }
  
  private static calculateApplicabilityScore(concepts: string[], domains: string[]): number {
    const universalSkills = ['critical_thinking', 'communication', 'problem_solving', 'research', 'ethics'];
    const universalSkillCount = concepts.filter(c => universalSkills.includes(c)).length;
    const domainCount = domains.length;
    
    // Higher score for more universal skills and broader domain applicability
    return Math.min(1.0, (universalSkillCount * 0.3 + domainCount * 0.1));
  }
}
```

#### **B. Educational Content API Implementation**

```typescript
// src/app/api/v1/learning/universal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SmartCodeService } from '@/lib/smart-code/SmartCodeService';
import { UniversalDatabase } from '@/lib/database/UniversalDatabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    switch (action) {
      case 'save_educational_content':
        return await saveEducationalContent(data);
      
      case 'get_cross_subject_questions':
        return await getCrossSubjectQuestions(data);
      
      case 'generate_universal_test':
        return await generateUniversalTest(data);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function saveEducationalContent(data: any) {
  // Classify content with Smart Codes
  const classification = await SmartCodeService.classifyEducationalContent(data);
  
  // Save to universal database
  const savedEntity = await UniversalDatabase.saveEntity({
    entity_type: 'learning_content',
    entity_name: data.title,
    smart_code: classification.primary,
    organization_id: data.organization_id || 'default-org'
  });
  
  // Save classification data
  const dynamicData = [
    { field_name: 'question', field_value: data.question },
    { field_name: 'answer', field_value: data.answer },
    { field_name: 'explanation', field_value: data.explanation },
    { field_name: 'subject_domain', field_value: data.subject_domain },
    { field_name: 'educational_context', field_value: data.educational_context },
    { field_name: 'difficulty_level', field_value: data.difficulty_level },
    { field_name: 'primary_smart_code', field_value: classification.primary },
    { field_name: 'secondary_smart_codes', field_value: JSON.stringify(classification.secondary) },
    { field_name: 'cross_subject_applicable', field_value: classification.crossSubject.toString() },
    { field_name: 'reuse_domains', field_value: JSON.stringify(classification.reuseDomains) },
    { field_name: 'universal_concepts', field_value: JSON.stringify(classification.universalConcepts) },
    { field_name: 'applicability_score', field_value: classification.applicabilityScore.toString() },
    { field_name: 'bloom_level', field_value: data.bloom_level || 'understand' },
    { field_name: 'tags', field_value: JSON.stringify(data.tags || []) }
  ];
  
  await UniversalDatabase.saveDynamicData(savedEntity.entity_id, dynamicData);
  
  return NextResponse.json({
    success: true,
    data: {
      saved_entity: savedEntity,
      smart_code_classification: classification,
      message: `Content saved with Smart Code ${classification.primary} for ${classification.crossSubject ? 'multi-domain' : 'single-domain'} reuse`
    },
    smart_code: classification.primary,
    timestamp: new Date().toISOString()
  });
}
```

### **5. Frontend Integration**

#### **A. React Hook for Universal Learning**

```typescript
// src/hooks/useUniversalLearning.ts
import { useState, useCallback } from 'react';

interface UniversalLearningHook {
  saveContent: (content: EducationalContent) => Promise<any>;
  getQuestions: (filters: QuestionFilters) => Promise<any>;
  generateTest: (config: TestConfig) => Promise<any>;
  loading: boolean;
  error: string | null;
}

export const useUniversalLearning = (): UniversalLearningHook => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiCall = useCallback(async (action: string, data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/learning/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const saveContent = useCallback(async (content: EducationalContent) => {
    return await apiCall('save_educational_content', content);
  }, [apiCall]);
  
  const getQuestions = useCallback(async (filters: QuestionFilters) => {
    return await apiCall('get_cross_subject_questions', filters);
  }, [apiCall]);
  
  const generateTest = useCallback(async (config: TestConfig) => {
    return await apiCall('generate_universal_test', config);
  }, [apiCall]);
  
  return {
    saveContent,
    getQuestions,
    generateTest,
    loading,
    error
  };
};
```

#### **B. Universal Learning Component**

```tsx
// src/components/universal-learning/UniversalLearningWidget.tsx
import React, { useState, useEffect } from 'react';
import { useUniversalLearning } from '@/hooks/useUniversalLearning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  studentDomain: string;
  educationalContext: 'K12' | 'UNI' | 'PROF' | 'CORP' | 'LIFE';
  showCrossSubject?: boolean;
}

export const UniversalLearningWidget: React.FC<Props> = ({
  studentDomain,
  educationalContext,
  showCrossSubject = true
}) => {
  const { getQuestions, generateTest, loading, error } = useUniversalLearning();
  const [questions, setQuestions] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any>(null);
  
  useEffect(() => {
    loadQuestions();
  }, [studentDomain, educationalContext]);
  
  const loadQuestions = async () => {
    try {
      const result = await getQuestions({
        subject_domain: studentDomain,
        educational_context: educationalContext,
        cross_subject_reuse: showCrossSubject,
        applicability_threshold: 0.7,
        limit: 5
      });
      
      setQuestions(result.data.questions);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };
  
  const handleGenerateTest = async () => {
    try {
      const result = await generateTest({
        subject_domain: studentDomain,
        educational_context: educationalContext,
        include_cross_subject: showCrossSubject,
        total_questions: 10,
        difficulty_mix: { easy: 30, medium: 50, hard: 20 },
        universal_skills_weight: 0.3
      });
      
      setTestResults(result.data);
    } catch (err) {
      console.error('Failed to generate test:', err);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center p-4">Loading universal learning content...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Universal Learning Content</span>
            <Button onClick={handleGenerateTest}>Generate Test</Button>
          </CardTitle>
          <p className="text-sm text-gray-600">
            {studentDomain} • {educationalContext} Level
            {showCrossSubject && ' • Cross-subject enabled'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={index} className="p-4">
                <h3 className="font-medium mb-2">{question.question}</h3>
                <p className="text-sm text-gray-700 mb-3">{question.answer}</p>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {question.primary_smart_code}
                  </Badge>
                  
                  {question.cross_subject_applicable && (
                    <Badge variant="secondary">
                      Cross-subject
                    </Badge>
                  )}
                  
                  <Badge variant="outline">
                    {Math.round(question.applicability_score * 100)}% applicable
                  </Badge>
                  
                  <div className="text-xs text-gray-500">
                    Reusable in: {question.reuse_domains.slice(0, 3).join(', ')}
                    {question.reuse_domains.length > 3 && '...'}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Test ID: {testResults.mock_test.entity_id}</p>
            <p>Questions: {testResults.mock_test.questions.length}</p>
            <p>Smart Code: {testResults.mock_test.smart_code}</p>
            <p>Time Limit: {testResults.mock_test.config.time_limit_minutes} minutes</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

---

## 🔧 **Platform-Specific Integration**

### **1. Moodle Integration**

```php
<?php
// Moodle plugin: local_hera_universal/classes/api/hera_client.php

class hera_client {
    private $api_url;
    private $org_id;
    
    public function __construct() {
        $this->api_url = get_config('local_hera_universal', 'api_url');
        $this->org_id = get_config('local_hera_universal', 'org_id');
    }
    
    public function save_question_with_smart_code($question_data) {
        $payload = [
            'action' => 'save_educational_content',
            'data' => [
                'title' => $question_data->name,
                'subject_domain' => $this->map_moodle_category_to_domain($question_data->category),
                'educational_context' => 'UNI', // University context
                'question' => $question_data->questiontext,
                'answer' => $this->extract_correct_answer($question_data),
                'tags' => explode(',', $question_data->tags),
                'difficulty_level' => $this->map_difficulty($question_data->difficulty),
                'organization_id' => $this->org_id
            ]
        ];
        
        $response = $this->call_hera_api($payload);
        
        if ($response['success']) {
            // Store Smart Code in Moodle question metadata
            $this->store_question_metadata($question_data->id, [
                'hera_smart_code' => $response['data']['smart_code_classification']['primary'],
                'cross_subject_reuse' => $response['data']['smart_code_classification']['crossSubject'],
                'reuse_domains' => implode(',', $response['data']['smart_code_classification']['reuseDomains']),
                'applicability_score' => $response['data']['smart_code_classification']['applicabilityScore']
            ]);
        }
        
        return $response;
    }
    
    public function get_cross_subject_questions($category, $difficulty, $count = 10) {
        $domain = $this->map_moodle_category_to_domain($category);
        
        $payload = [
            'action' => 'get_cross_subject_questions',
            'data' => [
                'subject_domain' => $domain,
                'difficulty_level' => $difficulty,
                'cross_subject_reuse' => true,
                'applicability_threshold' => 0.7,
                'limit' => $count
            ]
        ];
        
        return $this->call_hera_api($payload);
    }
    
    private function map_moodle_category_to_domain($category) {
        $mapping = [
            'Mathematics' => 'MATHEMATICS',
            'Science' => 'SCIENCE',
            'Medicine' => 'MEDICINE',
            'Engineering' => 'ENGINEERING',
            'Business' => 'BUSINESS'
        ];
        
        return $mapping[$category] ?? 'UNIVERSAL';
    }
    
    private function call_hera_api($payload) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->api_url . '/learning/universal');
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
}
?>
```

### **2. Canvas LMS Integration**

```javascript
// Canvas LTI Tool Integration
const CanvasHeraIntegration = {
  async processQuizQuestions(quizId) {
    const questions = await this.getQuizQuestions(quizId);
    const results = [];
    
    for (const question of questions) {
      const smartCodeResult = await fetch('/api/hera-universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_educational_content',
          data: {
            title: question.question_name,
            subject_domain: this.mapCanvasCourse(question.course_id),
            educational_context: 'UNI',
            question: question.question_text,
            answer: question.correct_answer,
            difficulty_level: this.determineDifficulty(question),
            tags: this.extractTags(question)
          }
        })
      });
      
      const smartCodeData = await smartCodeResult.json();
      
      if (smartCodeData.success) {
        // Update Canvas question with Smart Code metadata
        await this.updateCanvasQuestionMetadata(question.id, {
          smart_code: smartCodeData.data.smart_code_classification.primary,
          cross_subject: smartCodeData.data.smart_code_classification.crossSubject,
          reuse_domains: smartCodeData.data.smart_code_classification.reuseDomains,
          applicability_score: smartCodeData.data.smart_code_classification.applicabilityScore
        });
        
        results.push({
          question_id: question.id,
          smart_code: smartCodeData.data.smart_code_classification.primary,
          cross_subject_potential: smartCodeData.data.smart_code_classification.crossSubject
        });
      }
    }
    
    return results;
  },
  
  async getRelatedQuestions(courseId, topicId, count = 5) {
    const domain = this.mapCanvasCourse(courseId);
    
    const response = await fetch('/api/hera-universal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_cross_subject_questions',
        data: {
          subject_domain: domain,
          topic_id: topicId,
          cross_subject_reuse: true,
          educational_context: 'UNI',
          limit: count
        }
      })
    });
    
    const data = await response.json();
    return data.success ? data.data.questions : [];
  }
};
```

### **3. Mobile App Integration (React Native)**

```javascript
// React Native Universal Learning Hook
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUniversalLearning = (apiUrl) => {
  const [cachedQuestions, setCachedQuestions] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  
  const saveContentWithSmartCode = async (content) => {
    try {
      const response = await fetch(`${apiUrl}/learning/universal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_educational_content',
          data: content
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Cache for offline access
        await this.cacheContent(result.data);
      }
      
      return result;
    } catch (error) {
      // Handle offline mode
      if (!isOnline) {
        return await this.saveToOfflineQueue(content);
      }
      throw error;
    }
  };
  
  const getCrossSubjectQuestions = async (filters) => {
    try {
      const response = await fetch(`${apiUrl}/learning/universal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_cross_subject_questions',
          data: filters
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Cache questions for offline access
        await AsyncStorage.setItem(
          `questions_${filters.subject_domain}`,
          JSON.stringify(result.data.questions)
        );
        setCachedQuestions(result.data.questions);
      }
      
      return result;
    } catch (error) {
      // Return cached questions if offline
      if (!isOnline) {
        const cached = await AsyncStorage.getItem(`questions_${filters.subject_domain}`);
        return cached ? { success: true, data: { questions: JSON.parse(cached) } } : null;
      }
      throw error;
    }
  };
  
  const syncOfflineData = async () => {
    const offlineQueue = await AsyncStorage.getItem('offline_queue');
    if (offlineQueue) {
      const items = JSON.parse(offlineQueue);
      
      for (const item of items) {
        try {
          await this.saveContentWithSmartCode(item.data);
        } catch (error) {
          console.error('Failed to sync offline item:', error);
        }
      }
      
      await AsyncStorage.removeItem('offline_queue');
    }
  };
  
  return {
    saveContentWithSmartCode,
    getCrossSubjectQuestions,
    syncOfflineData,
    cachedQuestions,
    isOnline
  };
};
```

---

## 🧪 **Testing Implementation**

### **1. Unit Tests**

```javascript
// tests/smart-code.test.js
import { SmartCodeService } from '../src/lib/smart-code/SmartCodeService';

describe('SmartCodeService', () => {
  test('should classify medical ethics content correctly', async () => {
    const content = {
      title: 'Medical Ethics Dilemma',
      subject_domain: 'MEDICINE',
      educational_context: 'PROF',
      question: 'How do you balance patient autonomy with beneficence?',
      answer: 'Respect patient decisions while ensuring informed consent...',
      tags: ['ethics', 'autonomy', 'beneficence', 'medical_decision_making']
    };
    
    const classification = await SmartCodeService.classifyEducationalContent(content);
    
    expect(classification.primary).toBe('HERA.PROF.MEDICINE.MEDICAL_ETHICS.MEDIUM.v1');
    expect(classification.crossSubject).toBe(true);
    expect(classification.reuseDomains).toContain('Medicine');
    expect(classification.reuseDomains).toContain('Law');
    expect(classification.reuseDomains).toContain('Business');
    expect(classification.universalConcepts).toContain('ethics');
    expect(classification.applicabilityScore).toBeGreaterThan(0.8);
  });
  
  test('should detect universal transferable skills', async () => {
    const content = {
      title: 'Problem Solving Methodology',
      subject_domain: 'ENGINEERING',
      educational_context: 'UNI',
      question: 'Describe systematic problem-solving approach',
      answer: 'Problem-solving follows: identify, analyze, generate solutions...',
      tags: ['problem_solving', 'methodology', 'systematic_approach']
    };
    
    const classification = await SmartCodeService.classifyEducationalContent(content);
    
    expect(classification.universalConcepts).toContain('problem_solving');
    expect(classification.crossSubject).toBe(true);
    expect(classification.reuseDomains.length).toBeGreaterThan(3);
    expect(classification.secondary).toContain('HERA.UNI.SKILL.PROBLEM_SOLVING.v1');
  });
});
```

### **2. Integration Tests**

```javascript
// tests/api-integration.test.js
import request from 'supertest';
import app from '../src/app';

describe('Universal Learning API Integration', () => {
  test('should save and retrieve cross-subject questions', async () => {
    // Save content
    const saveResponse = await request(app)
      .post('/api/v1/learning/universal')
      .send({
        action: 'save_educational_content',
        data: {
          title: 'Ethics in Professional Practice',
          subject_domain: 'MEDICINE',
          educational_context: 'PROF',
          question: 'What are the core principles of professional ethics?',
          answer: 'Integrity, responsibility, respect, and fairness...',
          tags: ['ethics', 'professional_conduct']
        }
      });
    
    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.success).toBe(true);
    
    // Retrieve cross-subject questions
    const retrieveResponse = await request(app)
      .post('/api/v1/learning/universal')
      .send({
        action: 'get_cross_subject_questions',
        data: {
          subject_domain: 'LAW',
          cross_subject_reuse: true,
          applicability_threshold: 0.7
        }
      });
    
    expect(retrieveResponse.status).toBe(200);
    expect(retrieveResponse.body.success).toBe(true);
    expect(retrieveResponse.body.data.cross_subject_matches).toBeGreaterThan(0);
  });
});
```

### **3. End-to-End Tests**

```javascript
// tests/e2e/universal-learning.e2e.js
import { test, expect } from '@playwright/test';

test('Universal Learning Workflow', async ({ page }) => {
  await page.goto('http://localhost:3002/learning/universal');
  
  // Create new educational content
  await page.click('[data-testid="create-content-btn"]');
  await page.fill('[data-testid="title-input"]', 'Test Ethics Question');
  await page.selectOption('[data-testid="domain-select"]', 'MEDICINE');
  await page.selectOption('[data-testid="context-select"]', 'PROF');
  await page.fill('[data-testid="question-input"]', 'What are professional ethics?');
  await page.fill('[data-testid="answer-input"]', 'Professional ethics include integrity...');
  
  // Save content
  await page.click('[data-testid="save-content-btn"]');
  
  // Verify Smart Code classification
  await expect(page.locator('[data-testid="smart-code-display"]')).toContainText('HERA.PROF.MED');
  await expect(page.locator('[data-testid="cross-subject-indicator"]')).toBeVisible();
  
  // Search for cross-subject questions
  await page.fill('[data-testid="search-input"]', 'ethics');
  await page.click('[data-testid="cross-subject-toggle"]');
  await page.click('[data-testid="search-btn"]');
  
  // Verify results include cross-domain questions
  await expect(page.locator('[data-testid="question-card"]').first()).toBeVisible();
  await expect(page.locator('[data-testid="reuse-domains"]')).toContainText('Medicine');
  await expect(page.locator('[data-testid="reuse-domains"]')).toContainText('Law');
  
  // Generate universal test
  await page.click('[data-testid="generate-test-btn"]');
  await page.selectOption('[data-testid="test-domain-select"]', 'UNIVERSAL');
  await page.check('[data-testid="cross-subject-checkbox"]');
  await page.click('[data-testid="create-test-btn"]');
  
  // Verify test creation
  await expect(page.locator('[data-testid="test-success-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="test-questions-count"]')).toContainText('10');
});
```

---

## 🚀 **Deployment Configuration**

### **1. Docker Setup**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  hera-universal-learning:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - HERA_API_URL=${HERA_API_URL}
      - HERA_ORG_ID=${HERA_ORG_ID}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    volumes:
      - ./data:/app/data
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
  
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=hera_universal
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### **2. Kubernetes Deployment**

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hera-universal-learning
  labels:
    app: hera-universal-learning
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hera-universal-learning
  template:
    metadata:
      labels:
        app: hera-universal-learning
    spec:
      containers:
      - name: hera-app
        image: hera-universal-learning:latest
        ports:
        - containerPort: 3002
        env:
        - name: NODE_ENV
          value: "production"
        - name: HERA_API_URL
          valueFrom:
            configMapKeyRef:
              name: hera-config
              key: api-url
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: hera-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: hera-universal-service
spec:
  selector:
    app: hera-universal-learning
  ports:
  - port: 80
    targetPort: 3002
  type: LoadBalancer

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: hera-config
data:
  api-url: "https://api.hera-universal.com"
  smart-code-version: "v1"
  educational-contexts: "K12,UNI,PROF,CORP,LIFE"

---
apiVersion: v1
kind: Secret
metadata:
  name: hera-secrets
type: Opaque
data:
  database-url: <base64-encoded-database-url>
  redis-url: <base64-encoded-redis-url>
```

### **3. Production Monitoring**

```javascript
// src/lib/monitoring/metrics.ts
import { createPrometheusMetrics } from 'prom-client';

export const metrics = {
  smartCodeClassifications: new Counter({
    name: 'hera_smart_code_classifications_total',
    help: 'Total number of Smart Code classifications performed',
    labelNames: ['domain', 'context', 'cross_subject']
  }),
  
  crossSubjectQueries: new Counter({
    name: 'hera_cross_subject_queries_total',
    help: 'Total number of cross-subject queries',
    labelNames: ['domain', 'success']
  }),
  
  universalTestGeneration: new Counter({
    name: 'hera_universal_tests_generated_total',
    help: 'Total number of universal tests generated',
    labelNames: ['domain', 'questions_count']
  }),
  
  apiResponseTime: new Histogram({
    name: 'hera_api_response_time_seconds',
    help: 'API response time in seconds',
    labelNames: ['endpoint', 'method'],
    buckets: [0.1, 0.5, 1, 2, 5]
  }),
  
  applicabilityScores: new Histogram({
    name: 'hera_applicability_scores',
    help: 'Distribution of applicability scores',
    buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
  })
};

// Middleware to track metrics
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    metrics.apiResponseTime
      .labels(req.path, req.method)
      .observe(duration);
  });
  
  next();
};
```

---

## 📊 **Performance Optimization**

### **1. Caching Strategy**

```javascript
// src/lib/cache/SmartCodeCache.ts
import Redis from 'ioredis';

export class SmartCodeCache {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async getCachedClassification(contentHash: string): Promise<any> {
    const cached = await this.redis.get(`smartcode:${contentHash}`);
    return cached ? JSON.parse(cached) : null;
  }
  
  async setCachedClassification(contentHash: string, classification: any): Promise<void> {
    await this.redis.setex(
      `smartcode:${contentHash}`, 
      3600, // 1 hour
      JSON.stringify(classification)
    );
  }
  
  async getCachedQuestions(domain: string, filters: any): Promise<any[]> {
    const key = `questions:${domain}:${JSON.stringify(filters)}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : [];
  }
  
  async setCachedQuestions(domain: string, filters: any, questions: any[]): Promise<void> {
    const key = `questions:${domain}:${JSON.stringify(filters)}`;
    await this.redis.setex(key, 1800, JSON.stringify(questions)); // 30 minutes
  }
  
  async invalidateCache(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### **2. Database Optimization**

```sql
-- Performance indexes for Smart Code queries
CREATE INDEX CONCURRENTLY idx_entity_smart_code ON core_entities(smart_code);
CREATE INDEX CONCURRENTLY idx_dynamic_data_composite ON core_dynamic_data(entity_id, field_name, field_value);
CREATE INDEX CONCURRENTLY idx_educational_context ON core_dynamic_data(field_value) WHERE field_name = 'educational_context';
CREATE INDEX CONCURRENTLY idx_applicability_threshold ON core_dynamic_data(CAST(field_value AS NUMERIC)) WHERE field_name = 'applicability_score';

-- Materialized view for frequently accessed cross-subject queries
CREATE MATERIALIZED VIEW cross_subject_questions AS
SELECT 
  e.entity_id,
  e.entity_name,
  e.smart_code,
  dd_question.field_value as question,
  dd_answer.field_value as answer,
  dd_domain.field_value as subject_domain,
  dd_reuse.field_value as reuse_domains,
  CAST(dd_score.field_value AS NUMERIC) as applicability_score
FROM core_entities e
JOIN core_dynamic_data dd_question ON e.entity_id = dd_question.entity_id AND dd_question.field_name = 'question'
JOIN core_dynamic_data dd_answer ON e.entity_id = dd_answer.entity_id AND dd_answer.field_name = 'answer'
JOIN core_dynamic_data dd_domain ON e.entity_id = dd_domain.entity_id AND dd_domain.field_name = 'subject_domain'
JOIN core_dynamic_data dd_reuse ON e.entity_id = dd_reuse.entity_id AND dd_reuse.field_name = 'reuse_domains'
JOIN core_dynamic_data dd_score ON e.entity_id = dd_score.entity_id AND dd_score.field_name = 'applicability_score'
JOIN core_dynamic_data dd_cross ON e.entity_id = dd_cross.entity_id AND dd_cross.field_name = 'cross_subject_applicable'
WHERE e.entity_type = 'learning_content' 
AND dd_cross.field_value = 'true';

-- Refresh materialized view periodically
CREATE OR REPLACE FUNCTION refresh_cross_subject_questions()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY cross_subject_questions;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every hour
SELECT cron.schedule('refresh-cross-subject', '0 * * * *', 'SELECT refresh_cross_subject_questions();');
```

---

## 🎯 **Success Metrics & KPIs**

### **1. Technical Metrics**
- **Smart Code Classification Accuracy**: >98%
- **Cross-Subject Detection Rate**: >95% for universal skills
- **API Response Time**: <200ms for classification, <100ms for retrieval
- **Cache Hit Rate**: >80% for frequently accessed content
- **System Availability**: >99.9% uptime

### **2. Educational Metrics**
- **Content Reuse Rate**: >95% for universal skills, >70% average
- **Cross-Domain Discovery**: Students exposed to 3x more relevant content
- **Learning Efficiency**: 25% reduction in content creation time
- **Student Engagement**: 40% increase in cross-subject exploration

### **3. Platform Metrics**
- **Integration Success Rate**: >95% for supported platforms
- **Question Bank Growth**: 1000+ questions per month
- **Mock Test Generation**: <5 seconds for 20-question tests
- **Multi-tenant Performance**: Consistent performance across organizations

---

**The HERA Universal Learning System implementation guide provides everything needed to deploy intelligent, cross-domain educational content management with maximum reusability across any learning platform! 🎓🚀**