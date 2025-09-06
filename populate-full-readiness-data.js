const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simulate realistic answers for 48 questions
const generateAnswer = (questionId, category) => {
  // Simulate different answer patterns for realistic data
  const patterns = {
    strategy: { yes: 0.6, partial: 0.3, no: 0.1 },
    process: { yes: 0.4, partial: 0.4, no: 0.2 },
    technology: { yes: 0.7, partial: 0.2, no: 0.1 },
    data: { yes: 0.3, partial: 0.5, no: 0.2 },
    people: { yes: 0.3, partial: 0.4, no: 0.3 },
    financial: { yes: 0.5, partial: 0.3, no: 0.2 },
    project: { yes: 0.4, partial: 0.4, no: 0.2 }
  };
  
  const rand = Math.random();
  const pattern = patterns[category] || patterns.process;
  
  if (rand < pattern.yes) return { answer: 'yes', score: 100 };
  if (rand < pattern.yes + pattern.partial) return { answer: 'partial', score: 50 };
  return { answer: 'no', score: 0 };
};

const questions = [
  // Business Strategy & Planning (7 questions)
  { id: 'q1', text: 'Does your organization have a clearly defined business strategy and objectives?', category: 'strategy', weight: 3 },
  { id: 'q2', text: 'Are your key performance indicators (KPIs) clearly defined and measurable?', category: 'strategy', weight: 3 },
  { id: 'q3', text: 'Do you have a documented digital transformation roadmap?', category: 'strategy', weight: 2 },
  { id: 'q4', text: 'Have you conducted a comprehensive business process assessment?', category: 'strategy', weight: 3 },
  { id: 'q5', text: 'Is there alignment between IT strategy and business strategy?', category: 'strategy', weight: 3 },
  { id: 'q6', text: 'Have you defined success criteria for the ERP implementation?', category: 'strategy', weight: 3 },
  { id: 'q7', text: 'Do you have a risk management strategy for the ERP project?', category: 'strategy', weight: 2 },

  // Process Management (8 questions)
  { id: 'q8', text: 'Are your core business processes documented and standardized?', category: 'process', weight: 3 },
  { id: 'q9', text: 'Have you identified process improvement opportunities?', category: 'process', weight: 2 },
  { id: 'q10', text: 'Do you have cross-functional process visibility?', category: 'process', weight: 2 },
  { id: 'q11', text: 'Are process owners clearly identified for each business process?', category: 'process', weight: 3 },
  { id: 'q12', text: 'Do you regularly measure process performance and efficiency?', category: 'process', weight: 2 },
  { id: 'q13', text: 'Have you mapped interdependencies between processes?', category: 'process', weight: 2 },
  { id: 'q14', text: 'Are your processes compliant with industry regulations?', category: 'process', weight: 3 },
  { id: 'q15', text: 'Do you have standard operating procedures (SOPs) in place?', category: 'process', weight: 2 },

  // Technology Infrastructure (7 questions)
  { id: 'q16', text: 'Is your IT infrastructure cloud-ready or cloud-native?', category: 'technology', weight: 3 },
  { id: 'q17', text: 'Do you have adequate network bandwidth and reliability?', category: 'technology', weight: 3 },
  { id: 'q18', text: 'Are your security policies and infrastructure up to date?', category: 'technology', weight: 3 },
  { id: 'q19', text: 'Do you have a disaster recovery and business continuity plan?', category: 'technology', weight: 3 },
  { id: 'q20', text: 'Is your data architecture well-defined and documented?', category: 'technology', weight: 2 },
  { id: 'q21', text: 'Do you have integration capabilities (APIs, middleware)?', category: 'technology', weight: 2 },
  { id: 'q22', text: 'Are your current systems well-maintained and documented?', category: 'technology', weight: 2 },

  // Data Management (6 questions)
  { id: 'q23', text: 'Do you have a master data management strategy?', category: 'data', weight: 3 },
  { id: 'q24', text: 'Is your data quality regularly assessed and maintained?', category: 'data', weight: 3 },
  { id: 'q25', text: 'Do you have data governance policies and procedures?', category: 'data', weight: 3 },
  { id: 'q26', text: 'Have you identified data migration requirements and challenges?', category: 'data', weight: 2 },
  { id: 'q27', text: 'Do you have data retention and archival policies?', category: 'data', weight: 2 },
  { id: 'q28', text: 'Is there a single source of truth for critical business data?', category: 'data', weight: 3 },

  // People & Change Management (8 questions)
  { id: 'q29', text: 'Do you have executive sponsorship and commitment for the ERP project?', category: 'people', weight: 3 },
  { id: 'q30', text: 'Is there a formal change management program in place?', category: 'people', weight: 3 },
  { id: 'q31', text: 'Have you assessed organizational readiness for change?', category: 'people', weight: 2 },
  { id: 'q32', text: 'Do you have a training and skill development plan?', category: 'people', weight: 3 },
  { id: 'q33', text: 'Is there a communication strategy for the ERP project?', category: 'people', weight: 2 },
  { id: 'q34', text: 'Have you identified and engaged key stakeholders?', category: 'people', weight: 3 },
  { id: 'q35', text: 'Do employees understand the benefits of the new ERP system?', category: 'people', weight: 2 },
  { id: 'q36', text: 'Is there a plan for managing resistance to change?', category: 'people', weight: 2 },

  // Financial Readiness (6 questions)
  { id: 'q37', text: 'Have you established a realistic budget for the ERP project?', category: 'financial', weight: 3 },
  { id: 'q38', text: 'Do you understand the total cost of ownership (TCO)?', category: 'financial', weight: 3 },
  { id: 'q39', text: 'Have you secured funding for the entire project lifecycle?', category: 'financial', weight: 3 },
  { id: 'q40', text: 'Is there a budget for post-implementation support and optimization?', category: 'financial', weight: 2 },
  { id: 'q41', text: 'Have you calculated expected ROI and payback period?', category: 'financial', weight: 2 },
  { id: 'q42', text: 'Do you have contingency funds for unexpected costs?', category: 'financial', weight: 2 },

  // Project Management (6 questions)
  { id: 'q43', text: 'Do you have experienced project management resources?', category: 'project', weight: 3 },
  { id: 'q44', text: 'Have you defined a realistic project timeline?', category: 'project', weight: 3 },
  { id: 'q45', text: 'Is there a governance structure for decision-making?', category: 'project', weight: 3 },
  { id: 'q46', text: 'Do you have a project management methodology in place?', category: 'project', weight: 2 },
  { id: 'q47', text: 'Have you identified project dependencies and constraints?', category: 'project', weight: 2 },
  { id: 'q48', text: 'Is there a quality assurance and testing strategy?', category: 'project', weight: 3 }
];

async function populateFullReadinessData() {
  console.log('🚀 Populating Complete 48-Question Readiness Assessment Data...\n');
  
  // Create a new completed session
  const orgId = '550e8400-e29b-41d4-a716-446655440000';
  
  // First create the session
  const sessionData = {
    organization_id: orgId,
    transaction_type: 'readiness_assessment',
    transaction_code: `READINESS-${Date.now()}`,
    transaction_date: new Date().toISOString(),
    total_amount: 0,
    transaction_status: 'completed',
    smart_code: 'HERA.ERP.Readiness.Session.Transaction.V1',
    metadata: {
      completionRate: 100,
      totalQuestions: 48,
      user_email: 'test@example.com',
      industry_type: 'general',
      completed_at: new Date().toISOString()
    }
  };
  
  const { data: session, error: sessionError } = await supabase
    .from('universal_transactions')
    .insert([sessionData])
    .select()
    .single();
  
  if (sessionError) {
    console.error('❌ Error creating session:', sessionError);
    return;
  }
  
  console.log(`✅ Created session: ${session.id}\n`);
  console.log(`📋 Adding ${questions.length} answers...\n`);
  
  // Track scores by category
  const categoryScores = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  // Insert all 48 answers
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const { answer, score } = generateAnswer(question.id, question.category);
    
    // Track category scores
    if (!categoryScores[question.category]) {
      categoryScores[question.category] = { 
        total: 0, 
        count: 0, 
        weightedTotal: 0,
        totalWeight: 0
      };
    }
    categoryScores[question.category].total += score;
    categoryScores[question.category].count += 1;
    categoryScores[question.category].weightedTotal += score * question.weight;
    categoryScores[question.category].totalWeight += question.weight;
    
    totalWeightedScore += score * question.weight;
    totalWeight += question.weight;
    
    const answerData = {
      organization_id: orgId,
      transaction_id: session.id,
      line_number: i + 1,
      entity_id: null,
      line_type: 'multiple_choice',
      description: question.text,
      quantity: 1,
      unit_amount: score,
      line_amount: score,
      smart_code: 'HERA.ERP.Readiness.Answer.Line.V1',
      line_data: {
        question_id: question.id,
        answer_value: answer,
        answer_type: 'multiple_choice',
        category: question.category,
        weight: question.weight
      }
    };
    
    const { error } = await supabase
      .from('universal_transaction_lines')
      .insert([answerData]);
    
    if (error) {
      console.error(`❌ Error adding answer ${i + 1}:`, error);
    } else if (i % 10 === 0) {
      console.log(`✅ Added ${i + 1} answers...`);
    }
  }
  
  console.log(`\n✅ Added all ${questions.length} answers!\n`);
  
  // Calculate final scores
  Object.keys(categoryScores).forEach(category => {
    categoryScores[category].score = Math.round(
      categoryScores[category].weightedTotal / categoryScores[category].totalWeight
    );
  });
  
  const overallScore = Math.round(totalWeightedScore / totalWeight);
  
  // Update session with final scores
  const updateMetadata = {
    completionRate: 100,
    totalQuestions: 48,
    overallScore,
    categoryScores,
    completed_at: new Date().toISOString()
  };
  
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({ 
      metadata: updateMetadata,
      total_amount: overallScore 
    })
    .eq('id', session.id);
  
  if (updateError) {
    console.error('❌ Error updating session metadata:', updateError);
  } else {
    console.log(`✅ Updated session with overall score: ${overallScore}%\n`);
  }
  
  // Display category breakdown
  console.log('📊 Category Scores:');
  Object.entries(categoryScores).forEach(([category, data]) => {
    console.log(`   ${category}: ${data.score}% (${data.count} questions)`);
  });
  
  console.log('\n🎉 Full readiness assessment data population complete!');
  console.log(`📊 Visit http://localhost:3000/readiness-dashboard to see the results`);
}

populateFullReadinessData().catch(console.error);