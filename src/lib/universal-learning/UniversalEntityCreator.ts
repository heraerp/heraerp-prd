// HERA Universal Learning Platform - Universal Entity Creator
// Converts AI analysis into HERA's universal 6-table architecture

import { UniversalAnalysisResult, UniversalAIElement, DomainSpecificElement } from './UniversalAIAnalyzer';
import { UniversalKnowledgeStructure, ProcessingMetadata } from './UniversalContentProcessor';

export interface EntityCreationResult {
  coreEntities: CoreEntity[];
  dynamicData: DynamicDataEntry[];
  relationships: EntityRelationship[];
  transactions: UniversalTransaction[];
  organizationData: OrganizationEntry[];
  transactionLines: TransactionLine[];
  creationMetadata: EntityCreationMetadata;
}

export interface CoreEntity {
  entity_id: string;
  organization_id: string;
  entity_type: string;
  entity_name: string;
  entity_code: string;
  status: 'active' | 'inactive' | 'draft';
  smart_code: string;
  metadata: EntityMetadata;
  created_at: string;
  updated_at: string;
}

export interface DynamicDataEntry {
  entity_id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'json' | 'boolean' | 'date';
  field_value: string;
  field_metadata: any;
  confidence_score?: number;
  ai_generated: boolean;
  smart_code?: string;
}

export interface EntityRelationship {
  relationship_id: string;
  from_entity_id: string;
  to_entity_id: string;
  relationship_type: 'prerequisite' | 'related' | 'sequence' | 'contains' | 'enhances';
  relationship_strength: number; // 0-1
  metadata: RelationshipMetadata;
  smart_code: string;
}

export interface UniversalTransaction {
  transaction_id: string;
  organization_id: string;
  transaction_type: 'learning_session' | 'assessment_attempt' | 'progress_update' | 'achievement_unlock';
  transaction_date: string;
  reference_number: string;
  total_amount: number; // Learning value, score, or time
  smart_code: string;
  metadata: TransactionMetadata;
}

export interface TransactionLine {
  line_id: string;
  transaction_id: string;
  line_type: 'content_interaction' | 'assessment_result' | 'progress_increment' | 'skill_development';
  entity_id: string; // Related learning element
  quantity: number;
  unit_price: number; // Learning value or difficulty score
  line_total: number;
  metadata: LineMetadata;
}

export interface OrganizationEntry {
  organization_id: string;
  organization_name: string;
  organization_type: 'learning_platform' | 'educational_institution' | 'individual_learner';
  domain_focus: string; // CA, MED, LAW, etc.
  metadata: OrganizationMetadata;
}

export interface EntityCreationMetadata {
  totalEntitiesCreated: number;
  dynamicFieldsCreated: number;
  relationshipsEstablished: number;
  transactionsLogged: number;
  processingTime: number;
  confidenceScore: number;
  universalApplicability: number;
  domainSpecialization: number;
}

export interface EntityMetadata {
  universalElement?: UniversalAIElement;
  domainSpecific?: boolean;
  learningScience: any;
  aiEnhancements: any;
  assessmentData?: any;
  crossDomainInsights?: any[];
}

export interface RelationshipMetadata {
  relationshipReason: string;
  learningSequence?: number;
  prerequisiteDepth?: number;
  crossDomainSource?: string;
}

export interface TransactionMetadata {
  learnerProfile?: any;
  sessionDuration?: number;
  contentElements?: string[];
  performanceMetrics?: any;
}

export interface LineMetadata {
  bloomsLevel?: string;
  difficulty?: string;
  learningStyle?: string;
  completionStatus?: string;
}

export interface OrganizationMetadata {
  domainSpecializations: string[];
  learningObjectives: string[];
  certificationTargets: string[];
  customizationPreferences: any;
}

export class UniversalEntityCreator {
  private organizationId: string;
  private domain: string;

  constructor(organizationId: string, domain: string) {
    this.organizationId = organizationId;
    this.domain = domain;
  }

  /**
   * Main method: Convert AI analysis results to HERA universal entities
   */
  async createUniversalEntities(
    analysisResult: UniversalAnalysisResult,
    processingMetadata: ProcessingMetadata,
    options: EntityCreationOptions = {}
  ): Promise<EntityCreationResult> {
    
    console.log(`🏗️ HERA Universal Entity Creator - Creating ${this.domain.toUpperCase()} entities`);
    console.log(`📊 Processing ${analysisResult.universalElements?.length || 0} universal elements`);
    console.log(`🎯 Processing ${analysisResult.domainSpecificElements?.length || 0} domain-specific elements`);
    
    const startTime = Date.now();
    
    // Step 1: Create core entities from universal elements
    console.log(`📦 Creating core entities...`);
    const coreEntities = await this.createCoreEntities(analysisResult, options);
    
    // Step 2: Create dynamic data entries
    console.log(`📋 Creating dynamic data entries...`);
    const dynamicData = await this.createDynamicData(analysisResult, coreEntities, options);
    
    // Step 3: Establish entity relationships
    console.log(`🔗 Establishing entity relationships...`);
    const relationships = await this.createEntityRelationships(analysisResult, coreEntities, options);
    
    // Step 4: Create learning transactions
    console.log(`💫 Creating learning transactions...`);
    const transactions = await this.createLearningTransactions(analysisResult, coreEntities, options);
    
    // Step 5: Create transaction lines
    console.log(`📝 Creating transaction lines...`);
    const transactionLines = await this.createTransactionLines(transactions, coreEntities, analysisResult);
    
    // Step 6: Ensure organization exists
    console.log(`🏢 Setting up organization data...`);
    const organizationData = await this.ensureOrganizationExists(options);
    
    const processingTime = Date.now() - startTime;
    
    const creationMetadata: EntityCreationMetadata = {
      totalEntitiesCreated: coreEntities?.length || 0,
      dynamicFieldsCreated: dynamicData?.length || 0,
      relationshipsEstablished: relationships?.length || 0,
      transactionsLogged: transactions?.length || 0,
      processingTime,
      confidenceScore: analysisResult.confidenceScore || 0.8,
      universalApplicability: this.calculateUniversalApplicability(analysisResult),
      domainSpecialization: this.calculateDomainSpecialization(analysisResult)
    };
    
    console.log(`✅ Universal entity creation complete in ${processingTime}ms`);
    console.log(`📊 Created ${coreEntities?.length || 0} entities, ${dynamicData?.length || 0} dynamic fields, ${relationships?.length || 0} relationships`);
    console.log(`🎯 Universal Applicability: ${creationMetadata.universalApplicability.toFixed(2)}`);
    console.log(`🎯 Domain Specialization: ${creationMetadata.domainSpecialization.toFixed(2)}`);
    
    return {
      coreEntities,
      dynamicData,
      relationships,
      transactions,
      organizationData,
      transactionLines,
      creationMetadata
    };
  }

  /**
   * Create core entities from AI analysis results
   */
  private async createCoreEntities(
    analysisResult: UniversalAnalysisResult,
    options: EntityCreationOptions
  ): Promise<CoreEntity[]> {
    
    const entities: CoreEntity[] = [];
    const timestamp = new Date().toISOString();
    
    // Create entities from universal elements
    for (const element of analysisResult.universalElements) {
      const entity: CoreEntity = {
        entity_id: this.generateEntityId('universal', element.id),
        organization_id: this.organizationId,
        entity_type: this.mapToEntityType(element.type),
        entity_name: element.title,
        entity_code: this.generateEntityCode('UNI', element.type, entities.length),
        status: 'active',
        smart_code: `HERA.EDU.${this.domain.toUpperCase()}.${element.type.toUpperCase()}.v1`,
        metadata: {
          universalElement: element,
          domainSpecific: false,
          learningScience: element.learningScience,
          aiEnhancements: element.aiEnhancements,
          assessmentData: element.assessmentQuestions
        },
        created_at: timestamp,
        updated_at: timestamp
      };
      
      entities.push(entity);
    }
    
    // Create entities from domain-specific elements
    for (const element of analysisResult.domainSpecificElements) {
      const entity: CoreEntity = {
        entity_id: this.generateEntityId('domain', element.id),
        organization_id: this.organizationId,
        entity_type: this.mapDomainToEntityType(element.domain),
        entity_name: `${element.domain} Specialization`,
        entity_code: this.generateEntityCode(element.domain.toUpperCase(), 'SPEC', entities.length),
        status: 'active',
        smart_code: `HERA.EDU.${element.domain.toUpperCase()}.SPECIALIZATION.v1`,
        metadata: {
          domainSpecific: true,
          learningScience: {},
          aiEnhancements: {},
          crossDomainInsights: analysisResult.crossDomainInsights
        },
        created_at: timestamp,
        updated_at: timestamp
      };
      
      entities.push(entity);
    }
    
    // Create assessment entities
    for (let i = 0; i < analysisResult.assessmentRecommendations.length; i++) {
      const assessment = analysisResult.assessmentRecommendations[i];
      const entity: CoreEntity = {
        entity_id: this.generateEntityId('assessment', `assessment_${i}`),
        organization_id: this.organizationId,
        entity_type: 'universal_assessment',
        entity_name: `${assessment.type} Assessment - ${assessment.method}`,
        entity_code: this.generateEntityCode('ASS', assessment.type.toUpperCase(), i),
        status: 'active',
        smart_code: `HERA.EDU.${this.domain.toUpperCase()}.ASSESSMENT.${assessment.type.toUpperCase()}.v1`,
        metadata: {
          domainSpecific: false,
          learningScience: { bloomsLevel: assessment.bloomsLevel },
          aiEnhancements: {},
          assessmentData: assessment
        },
        created_at: timestamp,
        updated_at: timestamp
      };
      
      entities.push(entity);
    }
    
    return entities;
  }

  /**
   * Create dynamic data entries for enhanced entity properties
   */
  private async createDynamicData(
    analysisResult: UniversalAnalysisResult,
    entities: CoreEntity[],
    options: EntityCreationOptions
  ): Promise<DynamicDataEntry[]> {
    
    const dynamicData: DynamicDataEntry[] = [];
    
    // Add dynamic data for universal elements
    for (const entity of entities) {
      if (entity.metadata.universalElement) {
        const element = entity.metadata.universalElement;
        
        // Learning science properties
        dynamicData.push(
          {
            entity_id: entity.entity_id,
            field_name: 'blooms_level',
            field_type: 'text',
            field_value: element.learningScience.bloomsLevel,
            field_metadata: { category: 'learning_science' },
            confidence_score: 0.9,
            ai_generated: true,
            smart_code: `HERA.EDU.UNIVERSAL.BLOOMS.${element.learningScience.bloomsLevel.toUpperCase()}.v1`
          },
          {
            entity_id: entity.entity_id,
            field_name: 'learning_style',
            field_type: 'text',
            field_value: element.learningScience.learningStyle,
            field_metadata: { category: 'learning_science' },
            confidence_score: 0.85,
            ai_generated: true,
            smart_code: `HERA.EDU.UNIVERSAL.STYLE.${element.learningScience.learningStyle.toUpperCase()}.v1`
          },
          {
            entity_id: entity.entity_id,
            field_name: 'cognitive_load',
            field_type: 'text',
            field_value: element.learningScience.cognitiveLoad,
            field_metadata: { category: 'learning_science' },
            confidence_score: 0.8,
            ai_generated: true,
            smart_code: 'HERA.EDU.UNIVERSAL.COGNITIVE.LOAD.v1'
          },
          {
            entity_id: entity.entity_id,
            field_name: 'difficulty_level',
            field_type: 'text',
            field_value: element.learningScience.difficulty,
            field_metadata: { category: 'learning_science' },
            confidence_score: 0.9,
            ai_generated: true,
            smart_code: 'HERA.EDU.UNIVERSAL.DIFFICULTY.v1'
          }
        );
        
        // AI enhancements
        dynamicData.push(
          {
            entity_id: entity.entity_id,
            field_name: 'ai_explanation',
            field_type: 'text',
            field_value: element.aiEnhancements.explanation,
            field_metadata: { category: 'ai_enhancement', source: 'universal_ai' },
            confidence_score: analysisResult.confidenceScore,
            ai_generated: true,
            smart_code: 'HERA.EDU.UNIVERSAL.AI.EXPLANATION.v1'
          },
          {
            entity_id: entity.entity_id,
            field_name: 'ai_examples',
            field_type: 'json',
            field_value: JSON.stringify(element.aiEnhancements.examples),
            field_metadata: { category: 'ai_enhancement', count: element.aiEnhancements.examples.length },
            confidence_score: analysisResult.confidenceScore,
            ai_generated: true,
            smart_code: 'HERA.EDU.UNIVERSAL.AI.EXAMPLES.v1'
          },
          {
            entity_id: entity.entity_id,
            field_name: 'ai_analogies',
            field_type: 'json',
            field_value: JSON.stringify(element.aiEnhancements.analogies),
            field_metadata: { category: 'ai_enhancement' },
            confidence_score: analysisResult.confidenceScore,
            ai_generated: true,
            smart_code: 'HERA.EDU.UNIVERSAL.AI.ANALOGIES.v1'
          },
          {
            entity_id: entity.entity_id,
            field_name: 'ai_mnemonics',
            field_type: 'json',
            field_value: JSON.stringify(element.aiEnhancements.mnemonics),
            field_metadata: { category: 'ai_enhancement' },
            confidence_score: analysisResult.confidenceScore,
            ai_generated: true,
            smart_code: 'HERA.EDU.UNIVERSAL.AI.MNEMONICS.v1'
          }
        );
        
        // Universal applicability metrics
        dynamicData.push(
          {
            entity_id: entity.entity_id,
            field_name: 'universal_applicability',
            field_type: 'number',
            field_value: element.universalApplicability.toString(),
            field_metadata: { category: 'metrics', range: '0-1' },
            confidence_score: 0.95,
            ai_generated: true,
            smart_code: 'HERA.EDU.UNIVERSAL.APPLICABILITY.v1'
          },
          {
            entity_id: entity.entity_id,
            field_name: 'learning_value',
            field_type: 'number',
            field_value: (element.universalApplicability * analysisResult.confidenceScore).toString(),
            field_metadata: { category: 'metrics', calculated: true },
            confidence_score: analysisResult.confidenceScore,
            ai_generated: true,
            smart_code: 'HERA.EDU.UNIVERSAL.LEARNING.VALUE.v1'
          }
        );
        
        // Prerequisites and relationships data
        if (element.prerequisites.length > 0) {
          dynamicData.push({
            entity_id: entity.entity_id,
            field_name: 'prerequisites',
            field_type: 'json',
            field_value: JSON.stringify(element.prerequisites),
            field_metadata: { category: 'relationships', count: element.prerequisites.length },
            confidence_score: 0.8,
            ai_generated: true,
            smart_code: 'HERA.EDU.UNIVERSAL.PREREQUISITES.v1'
          });
        }
        
        if (element.relatedConcepts.length > 0) {
          dynamicData.push({
            entity_id: entity.entity_id,
            field_name: 'related_concepts',
            field_type: 'json',
            field_value: JSON.stringify(element.relatedConcepts),
            field_metadata: { category: 'relationships', count: element.relatedConcepts.length },
            confidence_score: 0.75,
            ai_generated: true,
            smart_code: 'HERA.EDU.UNIVERSAL.RELATED.CONCEPTS.v1'
          });
        }
      }
    }
    
    // Add dynamic data for domain-specific elements
    for (const entity of entities) {
      if (entity.metadata.domainSpecific) {
        const domainElement = analysisResult.domainSpecificElements.find(
          de => entity.entity_name.includes(de.domain)
        );
        
        if (domainElement) {
          dynamicData.push(
            {
              entity_id: entity.entity_id,
              field_name: 'domain_focus',
              field_type: 'text',
              field_value: domainElement.domain,
              field_metadata: { category: 'domain_specialization' },
              confidence_score: 0.95,
              ai_generated: false,
              smart_code: `HERA.EDU.${domainElement.domain.toUpperCase()}.DOMAIN.FOCUS.v1`
            },
            {
              entity_id: entity.entity_id,
              field_name: 'professional_context',
              field_type: 'text',
              field_value: domainElement.professionalContext,
              field_metadata: { category: 'domain_specialization' },
              confidence_score: 0.9,
              ai_generated: true,
              smart_code: `HERA.EDU.${domainElement.domain.toUpperCase()}.PROFESSIONAL.CONTEXT.v1`
            },
            {
              entity_id: entity.entity_id,
              field_name: 'industry_relevance',
              field_type: 'number',
              field_value: domainElement.industryRelevance.toString(),
              field_metadata: { category: 'domain_specialization', range: '0-1' },
              confidence_score: 0.85,
              ai_generated: true,
              smart_code: `HERA.EDU.${domainElement.domain.toUpperCase()}.INDUSTRY.RELEVANCE.v1`
            },
            {
              entity_id: entity.entity_id,
              field_name: 'certification_alignment',
              field_type: 'json',
              field_value: JSON.stringify(domainElement.certificationAlignment),
              field_metadata: { 
                category: 'domain_specialization', 
                count: domainElement.certificationAlignment.length 
              },
              confidence_score: 0.9,
              ai_generated: true,
              smart_code: `HERA.EDU.${domainElement.domain.toUpperCase()}.CERTIFICATION.ALIGNMENT.v1`
            },
            {
              entity_id: entity.entity_id,
              field_name: 'practical_applications',
              field_type: 'json',
              field_value: JSON.stringify(domainElement.practicalApplications),
              field_metadata: { 
                category: 'domain_specialization',
                count: domainElement.practicalApplications.length 
              },
              confidence_score: 0.85,
              ai_generated: true,
              smart_code: `HERA.EDU.${domainElement.domain.toUpperCase()}.PRACTICAL.APPLICATIONS.v1`
            }
          );
        }
      }
    }
    
    return dynamicData;
  }

  /**
   * Create entity relationships based on learning dependencies
   */
  private async createEntityRelationships(
    analysisResult: UniversalAnalysisResult,
    entities: CoreEntity[],
    options: EntityCreationOptions
  ): Promise<EntityRelationship[]> {
    
    const relationships: EntityRelationship[] = [];
    
    // Create prerequisite relationships
    for (const entity of entities) {
      if (entity.metadata.universalElement) {
        const element = entity.metadata.universalElement;
        
        // Link prerequisites
        for (const prerequisite of element.prerequisites) {
          const prerequisiteEntity = entities.find(e => 
            e.entity_name.toLowerCase().includes(prerequisite.toLowerCase()) ||
            e.metadata.universalElement?.content.toLowerCase().includes(prerequisite.toLowerCase())
          );
          
          if (prerequisiteEntity) {
            const relationship: EntityRelationship = {
              relationship_id: this.generateRelationshipId(),
              from_entity_id: prerequisiteEntity.entity_id,
              to_entity_id: entity.entity_id,
              relationship_type: 'prerequisite',
              relationship_strength: 0.8,
              metadata: {
                relationshipReason: `${prerequisite} is prerequisite for ${entity.entity_name}`,
                prerequisiteDepth: 1
              },
              smart_code: 'HERA.EDU.UNIVERSAL.RELATIONSHIP.PREREQUISITE.v1'
            };
            
            relationships.push(relationship);
          }
        }
        
        // Link related concepts
        for (const relatedConcept of element.relatedConcepts) {
          const relatedEntity = entities.find(e => 
            e.entity_name.toLowerCase().includes(relatedConcept.toLowerCase()) ||
            e.metadata.universalElement?.content.toLowerCase().includes(relatedConcept.toLowerCase())
          );
          
          if (relatedEntity && relatedEntity.entity_id !== entity.entity_id) {
            const relationship: EntityRelationship = {
              relationship_id: this.generateRelationshipId(),
              from_entity_id: entity.entity_id,
              to_entity_id: relatedEntity.entity_id,
              relationship_type: 'related',
              relationship_strength: 0.6,
              metadata: {
                relationshipReason: `${entity.entity_name} is related to ${relatedConcept}`,
                prerequisiteDepth: 0
              },
              smart_code: 'HERA.EDU.UNIVERSAL.RELATIONSHIP.RELATED.v1'
            };
            
            relationships.push(relationship);
          }
        }
      }
    }
    
    // Create learning sequence relationships based on Bloom's taxonomy
    const bloomsOrder = ['knowledge', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation'];
    const entitiesByBlooms: { [key: string]: CoreEntity[] } = {};
    
    entities.forEach(entity => {
      if (entity.metadata.universalElement) {
        const bloomsLevel = entity.metadata.universalElement.learningScience.bloomsLevel;
        if (!entitiesByBlooms[bloomsLevel]) {
          entitiesByBlooms[bloomsLevel] = [];
        }
        entitiesByBlooms[bloomsLevel].push(entity);
      }
    });
    
    // Create sequence relationships between Bloom's levels
    for (let i = 0; i < bloomsOrder.length - 1; i++) {
      const currentLevel = bloomsOrder[i];
      const nextLevel = bloomsOrder[i + 1];
      
      const currentEntities = entitiesByBlooms[currentLevel] || [];
      const nextEntities = entitiesByBlooms[nextLevel] || [];
      
      for (const currentEntity of currentEntities.slice(0, 3)) { // Limit relationships
        for (const nextEntity of nextEntities.slice(0, 2)) {
          const relationship: EntityRelationship = {
            relationship_id: this.generateRelationshipId(),
            from_entity_id: currentEntity.entity_id,
            to_entity_id: nextEntity.entity_id,
            relationship_type: 'sequence',
            relationship_strength: 0.7,
            metadata: {
              relationshipReason: `${currentLevel} precedes ${nextLevel} in Bloom's taxonomy`,
              learningSequence: i + 1
            },
            smart_code: 'HERA.EDU.UNIVERSAL.RELATIONSHIP.SEQUENCE.v1'
          };
          
          relationships.push(relationship);
        }
      }
    }
    
    // Create cross-domain enhancement relationships
    for (const insight of analysisResult.crossDomainInsights) {
      const sourceEntities = entities.filter(e => 
        e.smart_code.includes(insight.sourceAomain.toUpperCase())
      );
      const targetEntities = entities.filter(e => 
        e.smart_code.includes(insight.targetDomain.toUpperCase())
      );
      
      for (const sourceEntity of sourceEntities.slice(0, 2)) {
        for (const targetEntity of targetEntities.slice(0, 2)) {
          const relationship: EntityRelationship = {
            relationship_id: this.generateRelationshipId(),
            from_entity_id: sourceEntity.entity_id,
            to_entity_id: targetEntity.entity_id,
            relationship_type: 'enhances',
            relationship_strength: insight.applicability,
            metadata: {
              relationshipReason: insight.insight,
              crossDomainSource: insight.sourceAomain,
              expectedImprovement: insight.expectedImprovement
            },
            smart_code: `HERA.EDU.CROSS.DOMAIN.${insight.sourceAomain.toUpperCase()}.TO.${insight.targetDomain.toUpperCase()}.v1`
          };
          
          relationships.push(relationship);
        }
      }
    }
    
    return relationships;
  }

  /**
   * Create learning transactions for tracking educational activities
   */
  private async createLearningTransactions(
    analysisResult: UniversalAnalysisResult,
    entities: CoreEntity[],
    options: EntityCreationOptions
  ): Promise<UniversalTransaction[]> {
    
    const transactions: UniversalTransaction[] = [];
    const timestamp = new Date().toISOString();
    
    // Create content processing transaction
    const processingTransaction: UniversalTransaction = {
      transaction_id: this.generateTransactionId('processing'),
      organization_id: this.organizationId,
      transaction_type: 'learning_session',
      transaction_date: timestamp,
      reference_number: `PROCESS-${this.domain.toUpperCase()}-${Date.now()}`,
      total_amount: entities.length, // Number of learning elements processed
      smart_code: `HERA.EDU.${this.domain.toUpperCase()}.PROCESSING.TRANSACTION.v1`,
      metadata: {
        contentElements: entities.map(e => e.entity_id),
        processingType: 'universal_content_analysis',
        aiProviderUsed: 'hera_universal_ai',
        confidenceScore: analysisResult.confidenceScore
      }
    };
    
    transactions.push(processingTransaction);
    
    // Create assessment preparation transactions
    for (let i = 0; i < analysisResult.assessmentRecommendations.length; i++) {
      const assessment = analysisResult.assessmentRecommendations[i];
      const assessmentTransaction: UniversalTransaction = {
        transaction_id: this.generateTransactionId('assessment'),
        organization_id: this.organizationId,
        transaction_type: 'assessment_attempt',
        transaction_date: timestamp,
        reference_number: `ASSESS-${assessment.type.toUpperCase()}-${i + 1}`,
        total_amount: 1, // One assessment prepared
        smart_code: `HERA.EDU.${this.domain.toUpperCase()}.ASSESSMENT.${assessment.type.toUpperCase()}.v1`,
        metadata: {
          assessmentType: assessment.type,
          difficulty: assessment.difficulty,
          bloomsLevel: assessment.bloomsLevel,
          method: assessment.method
        }
      };
      
      transactions.push(assessmentTransaction);
    }
    
    // Create learning optimization transactions
    for (let i = 0; i < analysisResult.learningOptimizations.length; i++) {
      const optimization = analysisResult.learningOptimizations[i];
      const optimizationTransaction: UniversalTransaction = {
        transaction_id: this.generateTransactionId('optimization'),
        organization_id: this.organizationId,
        transaction_type: 'progress_update',
        transaction_date: timestamp,
        reference_number: `OPT-${optimization.type.toUpperCase()}-${i + 1}`,
        total_amount: optimization.expectedImprovement * 100, // Convert to percentage
        smart_code: `HERA.EDU.${this.domain.toUpperCase()}.OPTIMIZATION.${optimization.type.toUpperCase()}.v1`,
        metadata: {
          optimizationType: optimization.type,
          expectedImprovement: optimization.expectedImprovement,
          implementation: optimization.implementation,
          evidenceBase: optimization.evidenceBase
        }
      };
      
      transactions.push(optimizationTransaction);
    }
    
    return transactions;
  }

  /**
   * Create transaction lines for detailed learning tracking
   */
  private async createTransactionLines(
    transactions: UniversalTransaction[],
    entities: CoreEntity[],
    analysisResult: UniversalAnalysisResult
  ): Promise<TransactionLine[]> {
    
    const transactionLines: TransactionLine[] = [];
    
    for (const transaction of transactions) {
      if (transaction.transaction_type === 'learning_session') {
        // Create lines for each learning element
        for (let i = 0; i < entities.length; i++) {
          const entity = entities[i];
          const line: TransactionLine = {
            line_id: this.generateLineId(),
            transaction_id: transaction.transaction_id,
            line_type: 'content_interaction',
            entity_id: entity.entity_id,
            quantity: 1,
            unit_price: entity.metadata.universalElement?.universalApplicability || 0.7,
            line_total: entity.metadata.universalElement?.universalApplicability || 0.7,
            metadata: {
              bloomsLevel: entity.metadata.universalElement?.learningScience.bloomsLevel,
              difficulty: entity.metadata.universalElement?.learningScience.difficulty,
              learningStyle: entity.metadata.universalElement?.learningScience.learningStyle,
              completionStatus: 'processed'
            }
          };
          
          transactionLines.push(line);
        }
      } else if (transaction.transaction_type === 'assessment_attempt') {
        // Create line for assessment
        const assessmentEntity = entities.find(e => e.entity_type === 'universal_assessment');
        if (assessmentEntity) {
          const line: TransactionLine = {
            line_id: this.generateLineId(),
            transaction_id: transaction.transaction_id,
            line_type: 'assessment_result',
            entity_id: assessmentEntity.entity_id,
            quantity: 1,
            unit_price: analysisResult.confidenceScore,
            line_total: analysisResult.confidenceScore,
            metadata: {
              bloomsLevel: transaction.metadata.bloomsLevel,
              difficulty: transaction.metadata.difficulty,
              completionStatus: 'prepared'
            }
          };
          
          transactionLines.push(line);
        }
      }
    }
    
    return transactionLines;
  }

  /**
   * Ensure organization exists in the system
   */
  private async ensureOrganizationExists(options: EntityCreationOptions): Promise<OrganizationEntry[]> {
    const organization: OrganizationEntry = {
      organization_id: this.organizationId,
      organization_name: `${this.domain.toUpperCase()} Learning Platform`,
      organization_type: 'learning_platform',
      domain_focus: this.domain,
      metadata: {
        domainSpecializations: [this.domain],
        learningObjectives: ['universal_learning', 'domain_expertise', 'cross_domain_insights'],
        certificationTargets: this.getDomainCertifications(this.domain),
        customizationPreferences: {
          universalFirst: true,
          crossDomainLearning: true,
          aiEnhanced: true,
          adaptiveDifficulty: true
        }
      }
    };
    
    return [organization];
  }

  // Helper methods for ID generation and mapping
  private generateEntityId(prefix: string, id: string): string {
    return `${prefix}_${this.domain}_${id}_${Date.now()}`;
  }

  private generateEntityCode(prefix: string, type: string, index: number): string {
    return `${prefix}-${type}-${String(index + 1).padStart(3, '0')}`;
  }

  private generateRelationshipId(): string {
    return `rel_${this.domain}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTransactionId(type: string): string {
    return `txn_${type}_${this.domain}_${Date.now()}`;
  }

  private generateLineId(): string {
    return `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapToEntityType(elementType: string): string {
    const mapping = {
      'concept': 'universal_learning_concept',
      'procedure': 'universal_learning_procedure',
      'example': 'universal_learning_example',
      'definition': 'universal_learning_definition',
      'principle': 'universal_learning_principle',
      'case_study': 'universal_learning_case_study'
    };
    
    return mapping[elementType] || 'universal_learning_element';
  }

  private mapDomainToEntityType(domain: string): string {
    return `${domain.toLowerCase()}_domain_specialization`;
  }

  private calculateUniversalApplicability(analysisResult: UniversalAnalysisResult): number {
    const totalElements = analysisResult.universalElements.length;
    if (totalElements === 0) return 0;
    
    const totalApplicability = analysisResult.universalElements.reduce(
      (sum, element) => sum + element.universalApplicability, 0
    );
    
    return totalApplicability / totalElements;
  }

  private calculateDomainSpecialization(analysisResult: UniversalAnalysisResult): number {
    const domainElements = analysisResult.domainSpecificElements.length;
    const totalElements = analysisResult.universalElements.length + domainElements;
    
    if (totalElements === 0) return 0;
    
    return domainElements / totalElements;
  }

  private getDomainCertifications(domain: string): string[] {
    const certifications = {
      'CA': ['ICAI CA Final', 'ICAI CA Intermediate', 'ICAI CA Foundation'],
      'MED': ['USMLE', 'Medical Board Exams', 'Specialty Certifications'],
      'LAW': ['Bar Exam', 'Legal Specialization Certificates'],
      'ENG': ['FE Exam', 'PE License', 'Technical Certifications'],
      'LANG': ['TOEFL', 'IELTS', 'Language Proficiency Certificates']
    };
    
    return certifications[domain] || ['General Education Certification'];
  }
}

// Additional interfaces for type safety
export interface EntityCreationOptions {
  includeAssessments?: boolean;
  includeRelationships?: boolean;
  includeTransactions?: boolean;
  maxEntitiesPerType?: number;
  confidenceThreshold?: number;
  generateMockData?: boolean;
}