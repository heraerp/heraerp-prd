const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const questions = [
  {
    id: 'q1',
    text: 'Does your organization have clearly defined business processes?',
    category: 'process_management',
    answer: 'yes',
    score: 100
  },
  {
    id: 'q2',
    text: 'Are your business processes documented?',
    category: 'process_management',
    answer: 'partial',
    score: 50
  },
  {
    id: 'q3',
    text: 'Do you have executive sponsorship for the ERP project?',
    category: 'leadership',
    answer: 'yes',
    score: 100
  },
  {
    id: 'q4',
    text: 'Have you defined KPIs for measuring success?',
    category: 'strategy',
    answer: 'no',
    score: 0
  },
  {
    id: 'q5',
    text: 'Is your IT infrastructure cloud-ready?',
    category: 'technology',
    answer: 'yes',
    score: 100
  },
  {
    id: 'q6',
    text: 'Do you have a change management plan?',
    category: 'people',
    answer: 'no',
    score: 0
  },
  {
    id: 'q7',
    text: 'Are your employees trained on current systems?',
    category: 'people',
    answer: 'partial',
    score: 50
  },
  {
    id: 'q8',
    text: 'Do you have data governance policies?',
    category: 'data',
    answer: 'yes',
    score: 100
  }
];

async function populateTestData() {
  console.log('🚀 Populating Readiness Dashboard Test Data...\n');
  
  // Get the completed session
  const sessionId = 'f47ea4f9-9343-4e6a-91a3-dcba2f092d0b';
  const orgId = '550e8400-e29b-41d4-a716-446655440000';
  
  console.log(`📋 Adding ${questions.length} answers to session ${sessionId}...\n`);
  
  // Insert answer lines
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const answerData = {
      organization_id: orgId,
      transaction_id: sessionId,
      line_number: i + 1,
      entity_id: null,
      line_type: 'multiple_choice',
      description: question.text,
      quantity: 1,
      unit_amount: question.score,
      line_amount: question.score,
      smart_code: 'HERA.ERP.Readiness.Answer.Line.V1',
      line_data: {
        question_id: question.id,
        answer_value: question.answer,
        answer_type: 'multiple_choice',
        category: question.category,
      }
    };
    
    const { data, error } = await supabase
      .from('universal_transaction_lines')
      .insert([answerData])
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Error adding answer ${i + 1}:`, error);
    } else {
      console.log(`✅ Added answer ${i + 1}: "${question.text}" => ${question.answer.toUpperCase()} (${question.score}pts)`);
    }
  }
  
  // Calculate category scores
  const categoryScores = questions.reduce((acc, q) => {
    if (!acc[q.category]) {
      acc[q.category] = { total: 0, count: 0, score: 0 };
    }
    acc[q.category].total += q.score;
    acc[q.category].count += 1;
    acc[q.category].score = Math.round(acc[q.category].total / acc[q.category].count);
    return acc;
  }, {});
  
  // Update session metadata with scores
  const totalScore = Math.round(questions.reduce((sum, q) => sum + q.score, 0) / questions.length);
  const updateMetadata = {
    completionRate: 100,
    totalQuestions: questions.length,
    overallScore: totalScore,
    categoryScores,
    completed_at: new Date().toISOString()
  };
  
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({ 
      metadata: updateMetadata,
      total_amount: totalScore 
    })
    .eq('id', sessionId);
  
  if (updateError) {
    console.error('❌ Error updating session metadata:', updateError);
  } else {
    console.log(`\n✅ Updated session metadata with overall score: ${totalScore}%`);
  }
  
  // Skip AI insights for now - would need to create entity first
  
  console.log('\n🎉 Test data population complete!');
  console.log(`📊 Visit http://localhost:3002/readiness-dashboard to see the results`);
}

populateTestData().catch(console.error);