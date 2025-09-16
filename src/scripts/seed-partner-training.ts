/**
 * HERA Partner Training System Seed Data
 * Smart Code: HERA.PAR.TRN.SEED.SETUP.v1
 *
 * META BREAKTHROUGH: Seeding training system using HERA's own universal architecture
 * Training modules as entities, content as dynamic data, assessments as relationships
 */

import { getHeraAPI } from '@/src/lib/hera-api'

export async function seedPartnerTrainingSystem() {
  const heraApi = getHeraAPI()
  const organizationId = '719dfed1-09b4-4ca8-bfda-f682460de945' // HERA System Org

  console.log('🚀 Seeding HERA Partner Training System...')

  try {
    // 1. Create Training Modules as Entities
    const trainingModules = [
      {
        entity_name: 'HERA Business Impact & Value Proposition',
        entity_code: 'TRN-VALUE-001',
        metadata: {
          description: "Master HERA's business impact and learn to communicate value that sells",
          category: 'business_impact',
          difficulty: 'beginner',
          sequence_order: 1,
          estimated_duration: '90 minutes',
          prerequisites: [],
          learning_objectives: [
            "Articulate HERA's 10x business advantage",
            'Position HERA vs SAP/competitors with confidence',
            'Calculate customer ROI in real-time',
            'Handle price objections like a pro'
          ],
          is_required: true,
          video_count: 6,
          assessment_questions: 15,
          passing_score: 85
        },
        dynamic_data: {
          content_outline: JSON.stringify([
            { section: 'The $2.9M SAP Problem Every Business Faces', duration: '15 min' },
            { section: "HERA's 10x Business Advantage", duration: '20 min' },
            { section: 'Real Customer Success Stories', duration: '25 min' },
            { section: 'ROI Calculator Mastery', duration: '15 min' },
            { section: 'Objection Handling Playbook', duration: '15 min' }
          ]),
          video_content: JSON.stringify([
            {
              title: 'Manufacturing CEO: "HERA Saved My Business"',
              url: 'https://training.hera.com/success-stories/manufacturing-ceo',
              duration: '8 min',
              key_points: ['$500K yearly savings', '75% faster operations', 'No consultants needed']
            },
            {
              title: 'Restaurant Chain: 0 to 50 Locations with HERA',
              url: 'https://training.hera.com/success-stories/restaurant-growth',
              duration: '12 min',
              key_points: [
                'Scaled without complexity',
                'Real-time multi-location control',
                'Franchise-ready in weeks'
              ]
            }
          ]),
          value_props: JSON.stringify([
            {
              problem: 'SAP costs $2.9M average implementation',
              solution: 'HERA costs $50K average implementation',
              impact: '98% cost savings, 200x faster deployment'
            },
            {
              problem: 'SAP needs expensive consultants forever',
              solution: 'HERA is self-service with 48hr onboarding',
              impact: 'True business ownership, no vendor lock-in'
            },
            {
              problem: 'SAP has 60-80% failure rate',
              solution: 'HERA has 99% success rate',
              impact: 'Guaranteed results, not billable hours'
            }
          ]),
          objection_handlers: JSON.stringify([
            {
              objection: '"This seems too good to be true"',
              response:
                "I understand the skepticism. Every one of our 500+ customers said the exact same thing. Here's a live demo of three actual customer environments running right now...",
              proof_points: [
                'Live customer demos',
                'Public case studies',
                'Reference calls available'
              ]
            },
            {
              objection: '"We\'re happy with our current system"',
              response:
                "That's great! Happy is good. But what if I could show you how to be 10x happier while saving $200K per year? Would 15 minutes be worth $200K?",
              proof_points: ['ROI calculator', 'Current system assessment', 'No-risk pilot program']
            }
          ])
        }
      },
      {
        entity_name: 'Modern Lead Generation & Viral Growth',
        entity_code: 'TRN-LEADGEN-002',
        metadata: {
          description: 'Master proven lead generation tactics and create viral customer referrals',
          category: 'lead_generation',
          difficulty: 'intermediate',
          sequence_order: 2,
          estimated_duration: '2 hours',
          prerequisites: ['TRN-VALUE-001'],
          learning_objectives: [
            'Generate 10+ qualified leads per week using proven tactics',
            'Create viral referral systems that spread organically',
            'Master LinkedIn, cold email, and warm introduction strategies',
            'Build systems that generate leads while you sleep'
          ],
          is_required: true,
          video_count: 8,
          assessment_questions: 20,
          passing_score: 90
        },
        dynamic_data: {
          content_outline: JSON.stringify([
            { section: 'The 10-Lead-Per-Week System', duration: '30 min' },
            { section: 'LinkedIn Prospecting Mastery', duration: '25 min' },
            { section: 'Cold Email That Gets 40%+ Open Rates', duration: '20 min' },
            { section: 'Warm Introduction Multiplication', duration: '15 min' },
            { section: 'Viral Referral System Design', duration: '30 min' }
          ]),
          lead_gen_tactics: JSON.stringify([
            {
              tactic: 'LinkedIn CEO Hunting',
              description: 'Target CEOs of 50-500 employee companies with specific pain points',
              script:
                "Hi [Name], I noticed [Company] just hit [milestone]. Congrats! I'm helping similar companies save $200K+/year on their ERP costs. Worth a 15-min conversation?",
              success_rate: '15-20% response rate',
              daily_target: '10 personalized messages'
            },
            {
              tactic: 'SAP Horror Stories Content',
              description: 'Create viral content about SAP implementation failures',
              examples: [
                '"Why We Fired Our $500K SAP Consultants"',
                '"The $2.9M Mistake Most CEOs Make"'
              ],
              distribution: ['LinkedIn posts', 'Industry forums', 'Email newsletters'],
              viral_potential: 'High - everyone has SAP horror stories'
            },
            {
              tactic: 'Referral Explosion System',
              description: 'Turn every customer into 3+ referrals automatically',
              incentive: '$1,000 referral bonus + 6 months free service',
              automation: 'Automated follow-up sequences',
              multiplier: 'Each customer typically refers 2-4 prospects'
            }
          ]),
          viral_strategies: JSON.stringify([
            {
              strategy: 'Customer Success Story Amplification',
              method: 'Turn customer wins into viral LinkedIn posts',
              template:
                "[Customer] just saved $300K in their first year with HERA. Here's exactly how they did it... [detailed breakdown]",
              engagement: 'Tag customer, use industry hashtags, share metrics',
              virality: 'Customers love sharing their wins - free promotion'
            },
            {
              strategy: 'SAP vs HERA Challenge',
              method: 'Public comparison challenges with existing SAP users',
              offer:
                "We'll implement HERA alongside your SAP for 30 days. If HERA isn't 10x better, we pay YOU $10,000.",
              psychology: 'Confidence + skin in the game = massive credibility',
              spread: 'Shocking offer gets shared organically'
            }
          ])
        }
      },
      {
        entity_name: 'Consultative Selling & Deal Closing',
        entity_code: 'TRN-CLOSING-003',
        metadata: {
          description: 'Master consultative selling and close deals like the top 1% of salespeople',
          category: 'sales_mastery',
          difficulty: 'advanced',
          sequence_order: 3,
          estimated_duration: '2.5 hours',
          prerequisites: ['TRN-VALUE-001', 'TRN-LEADGEN-002'],
          learning_objectives: [
            'Master the HERA consultative selling framework',
            'Close deals using proven psychological principles',
            'Handle any objection with confidence',
            'Create urgency without being pushy'
          ],
          is_required: true,
          video_count: 10,
          assessment_questions: 25,
          passing_score: 88,
          role_play_scenarios: 8
        },
        dynamic_data: {
          content_outline: JSON.stringify([
            { section: 'The HERA Consultative Framework', duration: '35 min' },
            { section: 'Psychology of Decision Making', duration: '30 min' },
            { section: 'Advanced Objection Handling', duration: '40 min' },
            { section: 'Creating Urgency Without Pressure', duration: '25 min' },
            { section: 'The Close: 5 Proven Techniques', duration: '30 min' }
          ]),
          closing_techniques: JSON.stringify([
            {
              technique: 'The Assumptive Close',
              scenario: 'When customer shows strong interest',
              script:
                "Based on everything we've discussed, it sounds like HERA is exactly what [Company] needs. Should we get you started with the 30-day pilot, or would you prefer to begin with the full implementation?",
              psychology: 'Assumes the sale, gives control through choice'
            },
            {
              technique: 'The Pain Amplification Close',
              scenario: 'When customer is hesitant about change',
              script:
                "I understand change is challenging. But what's the cost of staying with your current system for another year? Another $200K in consultants? Another failed project? Sometimes the biggest risk is doing nothing.",
              psychology: 'Makes status quo feel riskier than change'
            },
            {
              technique: 'The Scarcity Close',
              scenario: 'When customer needs urgency',
              script:
                "I've got capacity for 2 more implementations this quarter. Given your timeline, we'd need to start by [date] to meet your [goal]. Should I hold that spot for you?",
              psychology: 'Limited availability creates urgency'
            }
          ]),
          objection_mastery: JSON.stringify([
            {
              objection: '"We need to think about it"',
              response:
                'Absolutely, this is an important decision. Let me ask - what specifically would you like to think about? Is it the investment, the timeline, or something else?',
              follow_up:
                'Address specific concern, then: "If we could resolve [concern], would you be ready to move forward?"'
            },
            {
              objection: '"The price is too high"',
              response:
                "I understand price is a consideration. Let's look at this differently - what's the cost of your current system over the next 3 years? [Calculate]. HERA will save you $[amount] over that period. Isn't that worth the investment?",
              follow_up: 'Show total cost of ownership comparison'
            }
          ])
        }
      },
      {
        entity_name: 'Customer Success & Account Expansion',
        entity_code: 'TRN-SUCCESS-004',
        metadata: {
          description: 'Turn customers into raving fans and expand accounts for maximum revenue',
          category: 'customer_success',
          difficulty: 'intermediate',
          sequence_order: 4,
          estimated_duration: '2 hours',
          prerequisites: ['TRN-CLOSING-003'],
          learning_objectives: [
            'Create customers who become your best salespeople',
            'Expand accounts systematically for 3x revenue growth',
            'Build referral systems that generate viral growth',
            'Prevent churn before it happens'
          ],
          is_required: false,
          video_count: 7,
          assessment_questions: 18,
          passing_score: 85,
          success_stories: 5
        },
        dynamic_data: {
          content_outline: JSON.stringify([
            { section: 'The Customer Success Mindset', duration: '25 min' },
            { section: 'Account Expansion Strategies', duration: '30 min' },
            { section: 'Building Referral Machines', duration: '35 min' },
            { section: 'Churn Prevention Systems', duration: '30 min' }
          ]),
          expansion_strategies: JSON.stringify([
            {
              strategy: 'The Additional Location Play',
              trigger: 'Customer has multiple locations using different systems',
              approach: 'Show ROI of standardizing on HERA across all locations',
              revenue_impact: '2-5x account size',
              timeline: '3-6 months after initial success'
            },
            {
              strategy: 'The Department Expansion',
              trigger: 'Success in one department (e.g., accounting)',
              approach: 'Demonstrate how other departments benefit from integration',
              revenue_impact: '1.5-3x account size',
              timeline: '6-12 months'
            },
            {
              strategy: 'The Industry Network Effect',
              trigger: 'Customer in industry association or network',
              approach: 'Leverage customer as case study for industry peers',
              revenue_impact: '5-10 new customers per success story',
              timeline: 'Ongoing viral growth'
            }
          ]),
          referral_systems: JSON.stringify([
            {
              system: 'The Quarterly Business Review Referral Ask',
              timing: 'During positive QBR meetings',
              script:
                "You've seen incredible results with HERA. Who else in your network is struggling with the same challenges you had before HERA?",
              incentive: '$2,000 credit + 3 months free service for successful referrals',
              conversion_rate: '40% of happy customers give referrals'
            },
            {
              system: 'The Success Story Amplification',
              method: 'Turn customer wins into industry case studies',
              distribution: 'Industry publications, LinkedIn, conferences',
              customer_benefit: 'Thought leadership positioning',
              lead_generation: '10-50 leads per published case study'
            }
          ])
        }
      }
    ]

    // Create training module entities
    const createdModules = []
    for (const module of trainingModules) {
      const entity = await heraApi.createEntity({
        organization_id: organizationId,
        entity_type: 'training_module',
        entity_name: module.entity_name,
        entity_code: module.entity_code,
        smart_code: 'HERA.PAR.TRN.ENT.MODULE.v1',
        status: 'active',
        metadata: module.metadata
      })

      // Set dynamic data
      await heraApi.setDynamicData(entity.id, module.dynamic_data)
      createdModules.push(entity)
      console.log(`✅ Created training module: ${module.entity_name}`)
    }

    // 2. Create Certifications as Entities
    const certifications = [
      {
        entity_name: 'HERA Sales Champion',
        entity_code: 'CERT-CHAMPION-001',
        metadata: {
          description: 'Elite sales certification for top-performing HERA partners',
          difficulty: 'intermediate',
          estimated_hours: 6,
          status: 'active',
          auto_approve: false,
          badge_url: '/images/badges/hera-sales-champion.png',
          requirements: [
            { type: 'module_completion', module_code: 'TRN-VALUE-001' },
            { type: 'module_completion', module_code: 'TRN-LEADGEN-002' },
            { type: 'module_completion', module_code: 'TRN-CLOSING-003' },
            { type: 'minimum_score', module_code: 'TRN-VALUE-001', score: 85 },
            { type: 'minimum_score', module_code: 'TRN-LEADGEN-002', score: 90 },
            { type: 'minimum_score', module_code: 'TRN-CLOSING-003', score: 88 }
          ],
          benefits: [
            'Elite Sales Champion badge and recognition',
            'Featured in HERA success stories and marketing',
            'Access to exclusive lead generation tools',
            'Higher commission rates (55% vs 50%)',
            'Priority access to new sales training',
            'Direct line to HERA sales leadership team'
          ]
        },
        dynamic_data: {
          certification_criteria: JSON.stringify({
            required_modules: ['TRN-FUND-001', 'TRN-SALES-002'],
            minimum_scores: { 'TRN-FUND-001': 80, 'TRN-SALES-002': 85 },
            additional_requirements: [
              'Complete partner agreement',
              'Verify business information',
              'Pass background check'
            ]
          }),
          digital_badge: JSON.stringify({
            issuer: 'HERA Systems',
            badge_class: 'certified_partner',
            criteria_url: 'https://certifications.hera.com/partner',
            evidence_required: ['module_completions', 'assessment_scores']
          })
        }
      },
      {
        entity_name: 'HERA Growth Master',
        entity_code: 'CERT-GROWTH-002',
        metadata: {
          description: 'Master-level certification for partners who create viral growth',
          difficulty: 'advanced',
          estimated_hours: 10,
          status: 'active',
          auto_approve: false,
          badge_url: '/images/badges/hera-growth-master.png',
          requirements: [
            { type: 'certification', certification_code: 'CERT-CHAMPION-001' },
            { type: 'module_completion', module_code: 'TRN-SUCCESS-004' },
            { type: 'minimum_score', module_code: 'TRN-SUCCESS-004', score: 85 },
            { type: 'revenue_milestone', minimum_mrr: 10000 },
            { type: 'referral_milestone', minimum_referrals: 5 }
          ],
          benefits: [
            'Growth Master badge and elite status',
            'Maximum commission rates (60%)',
            'Co-marketing partnership opportunities',
            'Revenue sharing on referred partners',
            'Invitation to HERA Growth Council',
            'Speaking opportunities at HERA events'
          ]
        },
        dynamic_data: {
          growth_requirements: JSON.stringify({
            performance_metrics: [
              'Generate $10K+ monthly recurring revenue',
              'Achieve 5+ customer referrals',
              'Maintain 95%+ customer satisfaction',
              'Create 1+ viral success story'
            ],
            growth_activities: [
              'Publish customer success case study',
              'Generate viral social media content',
              'Speak at industry event or webinar',
              'Mentor new HERA partners'
            ],
            viral_impact: {
              required_reach: '10,000+ people',
              required_engagement: '500+ interactions',
              required_leads: '50+ qualified prospects'
            }
          })
        }
      }
    ]

    // Create certification entities
    for (const cert of certifications) {
      const entity = await heraApi.createEntity({
        organization_id: organizationId,
        entity_type: 'certification',
        entity_name: cert.entity_name,
        entity_code: cert.entity_code,
        smart_code: 'HERA.PAR.CRT.ENT.CERT.v1',
        status: 'active',
        metadata: cert.metadata
      })

      await heraApi.setDynamicData(entity.id, cert.dynamic_data)
      console.log(`✅ Created certification: ${cert.entity_name}`)
    }

    // 3. Create Prerequisite Relationships
    for (const module of createdModules) {
      const prerequisites = (module.metadata as any)?.prerequisites || []
      for (const prereqCode of prerequisites) {
        const prereqModule = createdModules.find(m => m.entity_code === prereqCode)
        if (prereqModule) {
          await heraApi.createRelationship({
            source_entity_id: prereqModule.id,
            target_entity_id: module.id,
            relationship_type: 'prerequisite_for',
            relationship_data: {
              required: true,
              min_score: 80
            },
            smart_code: 'HERA.PAR.TRN.REL.PREREQ.v1'
          })
          console.log(`✅ Created prerequisite: ${prereqCode} → ${module.entity_code}`)
        }
      }
    }

    // 4. Create Training Path Template Transaction
    await heraApi.createTransaction({
      organization_id: organizationId,
      transaction_type: 'system_configuration',
      transaction_subtype: 'training_system_setup',
      transaction_data: {
        modules_created: createdModules.length,
        certifications_created: certifications.length,
        setup_completed_at: new Date().toISOString(),
        system_version: '1.0.0',
        meta_breakthrough: 'Training system created using HERA universal architecture'
      },
      smart_code: 'HERA.PAR.TRN.TXN.SETUP.v1'
    })

    console.log('🎉 Modern Partner Sales Training System seed completed successfully!')
    console.log(`   • ${createdModules.length} sales mastery modules created`)
    console.log(`   • ${certifications.length} elite certifications created`)
    console.log('   • Progressive skill development path established')
    console.log('   • System ready for creating sales champions')
    console.log('   • Focus: Lead generation, viral growth, and deal closing')

    return {
      success: true,
      modules_created: createdModules.length,
      certifications_created: certifications.length,
      meta_breakthrough: 'Training system built using HERA to manage HERA partner education'
    }
  } catch (error) {
    console.error('❌ Partner Training System seed failed:', error)
    throw error
  }
}

// Helper function to run the seed
export async function runPartnerTrainingSeeder() {
  try {
    console.log('🚀 Starting Partner Training System seeder...')
    const result = await seedPartnerTrainingSystem()
    console.log('✅ Seeding completed:', result)
    return result
  } catch (error) {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runPartnerTrainingSeeder()
}
