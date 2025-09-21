import * as fc from 'fast-check'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { describe, it, expect, beforeAll } from '@jest/globals'

// Import the actual schemas from the Grants playbook
import grantsPlaybook from '../../registry/grants.json'

// Initialize AJV with formats support
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  additionalProperties: false
})
addFormats(ajv)

// Custom arbitraries for specific formats
const einArbitrary = fc
  .tuple(fc.integer({ min: 10, max: 99 }), fc.integer({ min: 1000000, max: 9999999 }))
  .map(([prefix, suffix]) => `${prefix}-${suffix}`)

const dunsArbitrary = fc.integer({ min: 100000000, max: 999999999 }).map(String)

const grantOpportunityArbitrary = fc
  .tuple(
    fc.constantFrom('EPA', 'NSF', 'NIH', 'DOE', 'USDA'),
    fc.integer({ min: 2020, max: 2030 }),
    fc.integer({ min: 1000, max: 9999 })
  )
  .map(([agency, year, num]) => `${agency}-${year}-${num}`)

const emailArbitrary = fc
  .tuple(
    fc.stringOf(fc.char({ minCodePoint: 97, maxCodePoint: 122 }), { minLength: 1, maxLength: 20 }),
    fc.stringOf(fc.char({ minCodePoint: 97, maxCodePoint: 122 }), { minLength: 1, maxLength: 20 }),
    fc.constantFrom('com', 'org', 'edu', 'gov', 'net')
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`)

const phoneArbitrary = fc
  .tuple(
    fc.integer({ min: 200, max: 999 }),
    fc.integer({ min: 200, max: 999 }),
    fc.integer({ min: 1000, max: 9999 })
  )
  .map(([area, prefix, line]) => `${area}-${prefix}-${line}`)

const dateArbitrary = fc
  .date({
    min: new Date('2020-01-01'),
    max: new Date('2030-12-31')
  })
  .map(date => date.toISOString().split('T')[0])

const moneyArbitrary = (min = 0, max = 10000000) =>
  fc.float({ min, max, noNaN: true }).map(val => Math.round(val * 100) / 100)

const urlArbitrary = fc
  .tuple(
    fc.constantFrom('http', 'https'),
    fc.stringOf(fc.char({ minCodePoint: 97, maxCodePoint: 122 }), { minLength: 3, maxLength: 20 }),
    fc.constantFrom('com', 'org', 'gov', 'edu')
  )
  .map(([protocol, domain, tld]) => `${protocol}://${domain}.${tld}`)

describe('Grants Playbook Contract Validation', () => {
  let inputValidator: any
  let outputValidator: any

  beforeAll(() => {
    // Compile schemas
    inputValidator = ajv.compile(grantsPlaybook.input_contract)
    outputValidator = ajv.compile(grantsPlaybook.output_contract)
  })

  describe('Input Contract Property Tests', () => {
    it('should validate all valid input combinations', () => {
      fc.assert(
        fc.property(
          fc.record({
            organization_name: fc.string({ minLength: 1, maxLength: 200 }),
            ein: einArbitrary,
            duns_number: fc.option(dunsArbitrary, { nil: undefined }),
            grant_opportunity_number: grantOpportunityArbitrary,
            funding_agency: fc.constantFrom('EPA', 'NSF', 'NIH', 'DOE', 'USDA', 'NASA', 'DOD'),
            program_title: fc.string({ minLength: 1, maxLength: 300 }),
            requested_amount: moneyArbitrary(1000, 5000000),
            project_duration_months: fc.integer({ min: 1, max: 60 }),
            principal_investigator: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              email: emailArbitrary,
              phone: fc.option(phoneArbitrary, { nil: undefined })
            }),
            project_abstract: fc.string({ minLength: 100, maxLength: 5000 }),
            budget_narrative: fc.string({ minLength: 50, maxLength: 10000 }),
            submission_deadline: dateArbitrary,
            cost_share_percentage: fc.option(fc.float({ min: 0, max: 100 }), { nil: undefined }),
            indirect_cost_rate: fc.option(fc.float({ min: 0, max: 100 }), { nil: undefined })
          }),
          data => {
            const valid = inputValidator(data)
            expect(valid).toBe(true)
            if (!valid) {
              console.error('Validation errors:', inputValidator.errors)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject inputs with missing required fields', () => {
      const requiredFields = [
        'organization_name',
        'ein',
        'grant_opportunity_number',
        'funding_agency',
        'program_title',
        'requested_amount',
        'project_duration_months',
        'principal_investigator',
        'project_abstract',
        'budget_narrative',
        'submission_deadline'
      ]

      requiredFields.forEach(field => {
        fc.assert(
          fc.property(
            fc.record({
              organization_name: fc.string({ minLength: 1 }),
              ein: einArbitrary,
              grant_opportunity_number: grantOpportunityArbitrary,
              funding_agency: fc.constantFrom('EPA', 'NSF'),
              program_title: fc.string({ minLength: 1 }),
              requested_amount: moneyArbitrary(),
              project_duration_months: fc.integer({ min: 1, max: 60 }),
              principal_investigator: fc.record({
                name: fc.string({ minLength: 1 }),
                title: fc.string({ minLength: 1 }),
                email: emailArbitrary
              }),
              project_abstract: fc.string({ minLength: 100 }),
              budget_narrative: fc.string({ minLength: 50 }),
              submission_deadline: dateArbitrary
            }),
            validData => {
              // Remove the field being tested
              const invalidData = { ...validData }
              delete (invalidData as any)[field]

              const valid = inputValidator(invalidData)
              expect(valid).toBe(false)
              expect(inputValidator.errors).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({
                    instancePath: '',
                    message: expect.stringContaining(`must have required property '${field}'`)
                  })
                ])
              )
            }
          )
        )
      })
    })

    it('should enforce string length constraints', () => {
      fc.assert(
        fc.property(
          fc.record({
            tooLongOrgName: fc.string({ minLength: 201 }),
            tooShortAbstract: fc.string({ maxLength: 99 }),
            tooLongProgramTitle: fc.string({ minLength: 301 })
          }),
          ({ tooLongOrgName, tooShortAbstract, tooLongProgramTitle }) => {
            const baseData = {
              ein: '12-3456789',
              grant_opportunity_number: 'TEST-2024-0001',
              funding_agency: 'NSF',
              requested_amount: 100000,
              project_duration_months: 12,
              principal_investigator: {
                name: 'Test Person',
                title: 'Dr.',
                email: 'test@example.com'
              },
              budget_narrative: 'A'.repeat(100),
              submission_deadline: '2024-12-31'
            }

            // Test too long organization name
            let result = inputValidator({
              ...baseData,
              organization_name: tooLongOrgName,
              program_title: 'Valid Title',
              project_abstract: 'A'.repeat(200)
            })
            expect(result).toBe(false)

            // Test too short abstract
            result = inputValidator({
              ...baseData,
              organization_name: 'Valid Org',
              program_title: 'Valid Title',
              project_abstract: tooShortAbstract
            })
            expect(result).toBe(false)

            // Test too long program title
            result = inputValidator({
              ...baseData,
              organization_name: 'Valid Org',
              program_title: tooLongProgramTitle,
              project_abstract: 'A'.repeat(200)
            })
            expect(result).toBe(false)
          }
        )
      )
    })

    it('should validate EIN format', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Valid formats
            einArbitrary,
            // Invalid formats
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => !/^\d{2}-\d{7}$/.test(s))
          ),
          ein => {
            const isValidFormat = /^\d{2}-\d{7}$/.test(ein)
            const data = {
              organization_name: 'Test Org',
              ein,
              grant_opportunity_number: 'TEST-2024-0001',
              funding_agency: 'NSF',
              program_title: 'Test Program',
              requested_amount: 100000,
              project_duration_months: 12,
              principal_investigator: {
                name: 'Test Person',
                title: 'Dr.',
                email: 'test@example.com'
              },
              project_abstract: 'A'.repeat(200),
              budget_narrative: 'A'.repeat(100),
              submission_deadline: '2024-12-31'
            }

            const valid = inputValidator(data)
            expect(valid).toBe(isValidFormat)
          }
        )
      )
    })

    it('should validate numeric constraints', () => {
      fc.assert(
        fc.property(
          fc.record({
            requested_amount: fc.oneof(
              moneyArbitrary(0.01, 10000000), // Valid
              fc.constant(-1000), // Invalid negative
              fc.constant(0) // Invalid zero
            ),
            project_duration_months: fc.oneof(
              fc.integer({ min: 1, max: 60 }), // Valid
              fc.integer({ min: -10, max: 0 }), // Invalid negative/zero
              fc.integer({ min: 61, max: 100 }) // Invalid too large
            ),
            cost_share_percentage: fc.option(
              fc.oneof(
                fc.float({ min: 0, max: 100 }), // Valid
                fc.float({ min: -50, max: -1 }), // Invalid negative
                fc.float({ min: 101, max: 200 }) // Invalid over 100
              ),
              { nil: undefined }
            ),
            indirect_cost_rate: fc.option(
              fc.oneof(
                fc.float({ min: 0, max: 100 }), // Valid
                fc.float({ min: -50, max: -1 }), // Invalid negative
                fc.float({ min: 101, max: 200 }) // Invalid over 100
              ),
              { nil: undefined }
            )
          }),
          numericData => {
            const data = {
              organization_name: 'Test Org',
              ein: '12-3456789',
              grant_opportunity_number: 'TEST-2024-0001',
              funding_agency: 'NSF',
              program_title: 'Test Program',
              principal_investigator: {
                name: 'Test Person',
                title: 'Dr.',
                email: 'test@example.com'
              },
              project_abstract: 'A'.repeat(200),
              budget_narrative: 'A'.repeat(100),
              submission_deadline: '2024-12-31',
              ...numericData
            }

            const valid = inputValidator(data)

            // Check if the numeric values are within valid ranges
            const shouldBeValid =
              numericData.requested_amount > 0 &&
              numericData.project_duration_months >= 1 &&
              numericData.project_duration_months <= 60 &&
              (numericData.cost_share_percentage === undefined ||
                (numericData.cost_share_percentage >= 0 &&
                  numericData.cost_share_percentage <= 100)) &&
              (numericData.indirect_cost_rate === undefined ||
                (numericData.indirect_cost_rate >= 0 && numericData.indirect_cost_rate <= 100))

            expect(valid).toBe(shouldBeValid)
          }
        )
      )
    })
  })

  describe('Output Contract Property Tests', () => {
    it('should validate all valid output combinations', () => {
      fc.assert(
        fc.property(
          fc.record({
            application_number: fc
              .string({ minLength: 1, maxLength: 50 })
              .map(s => `GRANT-${Date.now()}-${s.toUpperCase()}`),
            submission_status: fc.constantFrom(
              'draft',
              'submitted',
              'under_review',
              'awarded',
              'rejected'
            ),
            submission_timestamp: fc.option(
              fc.date().map(d => d.toISOString()),
              { nil: undefined }
            ),
            confirmation_number: fc.option(fc.string({ minLength: 10, maxLength: 30 }), {
              nil: undefined
            }),
            review_results: fc.option(
              fc.record({
                technical_score: fc.integer({ min: 0, max: 100 }),
                management_score: fc.integer({ min: 0, max: 100 }),
                budget_score: fc.integer({ min: 0, max: 100 }),
                overall_score: fc.integer({ min: 0, max: 100 }),
                reviewer_comments: fc.array(fc.string({ minLength: 1, maxLength: 1000 }), {
                  maxLength: 10
                }),
                recommendation: fc.constantFrom('fund', 'fund_with_conditions', 'do_not_fund')
              }),
              { nil: undefined }
            ),
            award_details: fc.option(
              fc.record({
                award_amount: moneyArbitrary(1000, 5000000),
                award_start_date: dateArbitrary,
                award_end_date: dateArbitrary,
                award_number: fc.string({ minLength: 5, maxLength: 30 }),
                terms_and_conditions: fc.option(fc.string({ minLength: 1, maxLength: 10000 }), {
                  nil: undefined
                }),
                reporting_requirements: fc.option(
                  fc.array(
                    fc.record({
                      report_type: fc.constantFrom('progress', 'financial', 'final', 'annual'),
                      due_date: dateArbitrary,
                      description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), {
                        nil: undefined
                      })
                    }),
                    { maxLength: 20 }
                  ),
                  { nil: undefined }
                )
              }),
              { nil: undefined }
            ),
            documents_generated: fc.array(
              fc.record({
                document_type: fc.constantFrom(
                  'application_pdf',
                  'budget_spreadsheet',
                  'supporting_documents',
                  'award_letter'
                ),
                document_url: urlArbitrary,
                generated_date: dateArbitrary,
                file_size_bytes: fc.option(fc.integer({ min: 1, max: 100000000 }), {
                  nil: undefined
                })
              }),
              { maxLength: 50 }
            ),
            validation_errors: fc.array(
              fc.record({
                field: fc.string({ minLength: 1, maxLength: 100 }),
                message: fc.string({ minLength: 1, maxLength: 500 }),
                severity: fc.constantFrom('error', 'warning', 'info')
              }),
              { maxLength: 100 }
            ),
            processing_metadata: fc.record({
              processing_time_ms: fc.integer({ min: 0, max: 300000 }),
              api_version: fc.constantFrom('1.0', '1.1', '2.0'),
              server_timestamp: fc.date().map(d => d.toISOString())
            })
          }),
          data => {
            const valid = outputValidator(data)
            expect(valid).toBe(true)
            if (!valid) {
              console.error('Output validation errors:', outputValidator.errors)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should enforce required output fields', () => {
      const requiredFields = [
        'application_number',
        'submission_status',
        'documents_generated',
        'validation_errors',
        'processing_metadata'
      ]

      requiredFields.forEach(field => {
        const validData = {
          application_number: 'GRANT-2024-TEST001',
          submission_status: 'submitted',
          documents_generated: [],
          validation_errors: [],
          processing_metadata: {
            processing_time_ms: 1000,
            api_version: '1.0',
            server_timestamp: new Date().toISOString()
          }
        }

        const invalidData = { ...validData }
        delete (invalidData as any)[field]

        const valid = outputValidator(invalidData)
        expect(valid).toBe(false)
      })
    })

    it('should validate conditional fields based on status', () => {
      fc.assert(
        fc.property(
          fc.record({
            status: fc.constantFrom('draft', 'submitted', 'under_review', 'awarded', 'rejected'),
            hasSubmissionTimestamp: fc.boolean(),
            hasConfirmationNumber: fc.boolean(),
            hasReviewResults: fc.boolean(),
            hasAwardDetails: fc.boolean()
          }),
          ({
            status,
            hasSubmissionTimestamp,
            hasConfirmationNumber,
            hasReviewResults,
            hasAwardDetails
          }) => {
            const data: any = {
              application_number: 'GRANT-2024-TEST001',
              submission_status: status,
              documents_generated: [],
              validation_errors: [],
              processing_metadata: {
                processing_time_ms: 1000,
                api_version: '1.0',
                server_timestamp: new Date().toISOString()
              }
            }

            // Add optional fields based on flags
            if (hasSubmissionTimestamp) {
              data.submission_timestamp = new Date().toISOString()
            }
            if (hasConfirmationNumber) {
              data.confirmation_number = 'CONF-123456'
            }
            if (hasReviewResults) {
              data.review_results = {
                technical_score: 85,
                management_score: 90,
                budget_score: 88,
                overall_score: 88,
                reviewer_comments: ['Good proposal'],
                recommendation: 'fund'
              }
            }
            if (hasAwardDetails) {
              data.award_details = {
                award_amount: 500000,
                award_start_date: '2024-01-01',
                award_end_date: '2026-12-31',
                award_number: 'AWD-2024-001'
              }
            }

            const valid = outputValidator(data)

            // Validation should pass - schema doesn't enforce conditional requirements
            expect(valid).toBe(true)
          }
        )
      )
    })
  })

  describe('Contract Evolution Tests', () => {
    it('should handle backward compatibility when adding optional fields', () => {
      const oldData = {
        organization_name: 'Test Org',
        ein: '12-3456789',
        grant_opportunity_number: 'TEST-2024-0001',
        funding_agency: 'NSF',
        program_title: 'Test Program',
        requested_amount: 100000,
        project_duration_months: 12,
        principal_investigator: {
          name: 'Test Person',
          title: 'Dr.',
          email: 'test@example.com'
        },
        project_abstract: 'A'.repeat(200),
        budget_narrative: 'A'.repeat(100),
        submission_deadline: '2024-12-31'
      }

      // Old data should still validate
      expect(inputValidator(oldData)).toBe(true)

      // New data with additional optional fields should also validate
      const newData = {
        ...oldData,
        cost_share_percentage: 20,
        indirect_cost_rate: 48.5,
        duns_number: '123456789',
        // Hypothetical new optional field
        new_optional_field: 'This would be ignored by additionalProperties: false'
      }

      // Schema with additionalProperties: false will reject unknown fields
      expect(inputValidator(newData)).toBe(false)

      // But without the unknown field, it should pass
      const { new_optional_field, ...validNewData } = newData
      expect(inputValidator(validNewData)).toBe(true)
    })

    it('should enforce schema versioning through validation', () => {
      // Test that the schema properly validates version-specific constraints
      const v1Data = {
        application_number: 'GRANT-2024-TEST001',
        submission_status: 'submitted',
        documents_generated: [],
        validation_errors: [],
        processing_metadata: {
          processing_time_ms: 1000,
          api_version: '1.0', // v1 API
          server_timestamp: new Date().toISOString()
        }
      }

      const v2Data = {
        ...v1Data,
        processing_metadata: {
          ...v1Data.processing_metadata,
          api_version: '2.0' // v2 API
        }
      }

      // Both versions should validate
      expect(outputValidator(v1Data)).toBe(true)
      expect(outputValidator(v2Data)).toBe(true)
    })
  })

  describe('Performance Tests', () => {
    it('should handle large input validation efficiently', () => {
      const largeInput = {
        organization_name: 'A'.repeat(200), // Max length
        ein: '12-3456789',
        grant_opportunity_number: 'TEST-2024-0001',
        funding_agency: 'NSF',
        program_title: 'A'.repeat(300), // Max length
        requested_amount: 10000000, // Max amount
        project_duration_months: 60, // Max duration
        principal_investigator: {
          name: 'A'.repeat(100),
          title: 'A'.repeat(100),
          email: 'test@example.com',
          phone: '555-555-5555'
        },
        project_abstract: 'A'.repeat(5000), // Max length
        budget_narrative: 'A'.repeat(10000), // Max length
        submission_deadline: '2030-12-31',
        cost_share_percentage: 100,
        indirect_cost_rate: 100
      }

      const startTime = Date.now()
      const valid = inputValidator(largeInput)
      const endTime = Date.now()

      expect(valid).toBe(true)
      expect(endTime - startTime).toBeLessThan(100) // Should validate in under 100ms
    })

    it('should handle many simultaneous validations', () => {
      const validations = Array.from({ length: 1000 }, (_, i) => ({
        organization_name: `Test Org ${i}`,
        ein: `${10 + (i % 90)}-${1000000 + i}`,
        grant_opportunity_number: `TEST-2024-${String(i).padStart(4, '0')}`,
        funding_agency: ['NSF', 'EPA', 'NIH', 'DOE'][i % 4],
        program_title: `Test Program ${i}`,
        requested_amount: 100000 + i * 1000,
        project_duration_months: 12 + (i % 48),
        principal_investigator: {
          name: `Researcher ${i}`,
          title: 'Dr.',
          email: `researcher${i}@example.com`
        },
        project_abstract: 'A'.repeat(200 + (i % 100)),
        budget_narrative: 'B'.repeat(100 + (i % 50)),
        submission_deadline: '2024-12-31'
      }))

      const startTime = Date.now()
      const results = validations.map(data => inputValidator(data))
      const endTime = Date.now()

      expect(results.every(r => r === true)).toBe(true)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete 1000 validations in under 1 second
    })

    it('should validate complex nested structures efficiently', () => {
      fc.assert(
        fc.property(
          fc.record({
            numReviewComments: fc.integer({ min: 0, max: 10 }),
            numReportingRequirements: fc.integer({ min: 0, max: 20 }),
            numDocuments: fc.integer({ min: 0, max: 50 }),
            numValidationErrors: fc.integer({ min: 0, max: 100 })
          }),
          ({ numReviewComments, numReportingRequirements, numDocuments, numValidationErrors }) => {
            const complexOutput = {
              application_number: 'GRANT-2024-COMPLEX',
              submission_status: 'awarded' as const,
              submission_timestamp: new Date().toISOString(),
              confirmation_number: 'CONF-COMPLEX-123',
              review_results: {
                technical_score: 95,
                management_score: 92,
                budget_score: 88,
                overall_score: 92,
                reviewer_comments: Array.from(
                  { length: numReviewComments },
                  (_, i) =>
                    `Review comment ${i}: This is a detailed review comment that provides feedback on the grant application.`
                ),
                recommendation: 'fund' as const
              },
              award_details: {
                award_amount: 2500000,
                award_start_date: '2024-01-01',
                award_end_date: '2026-12-31',
                award_number: 'AWD-2024-COMPLEX',
                terms_and_conditions: 'A'.repeat(5000),
                reporting_requirements: Array.from(
                  { length: numReportingRequirements },
                  (_, i) => ({
                    report_type: ['progress', 'financial', 'final', 'annual'][i % 4] as const,
                    due_date: '2024-12-31',
                    description: `Report ${i} description`
                  })
                )
              },
              documents_generated: Array.from({ length: numDocuments }, (_, i) => ({
                document_type: [
                  'application_pdf',
                  'budget_spreadsheet',
                  'supporting_documents',
                  'award_letter'
                ][i % 4] as const,
                document_url: `https://example.com/doc${i}.pdf`,
                generated_date: '2024-01-01',
                file_size_bytes: 1000000 + i * 1000
              })),
              validation_errors: Array.from({ length: numValidationErrors }, (_, i) => ({
                field: `field_${i}`,
                message: `Validation error ${i}`,
                severity: ['error', 'warning', 'info'][i % 3] as const
              })),
              processing_metadata: {
                processing_time_ms: 5000,
                api_version: '2.0',
                server_timestamp: new Date().toISOString()
              }
            }

            const startTime = performance.now()
            const valid = outputValidator(complexOutput)
            const endTime = performance.now()

            expect(valid).toBe(true)
            expect(endTime - startTime).toBeLessThan(50) // Complex validation should still be fast
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Edge Case Tests', () => {
    it('should handle unicode and special characters', () => {
      const unicodeData = {
        organization_name: 'Université de Montréal 中文 العربية',
        ein: '12-3456789',
        grant_opportunity_number: 'TEST-2024-0001',
        funding_agency: 'NSF',
        program_title: 'Research on 🧬 DNA 🔬 Science',
        requested_amount: 100000,
        project_duration_months: 12,
        principal_investigator: {
          name: 'José María González-Pérez',
          title: 'Dr.',
          email: 'jose@université.edu'
        },
        project_abstract: 'This abstract contains émojis 🎯 and spëcial çharacters ñ ü ö ä',
        budget_narrative: 'Budget includes €uro and £pound symbols with ¥en',
        submission_deadline: '2024-12-31'
      }

      const valid = inputValidator(unicodeData)
      expect(valid).toBe(true)
    })

    it('should handle boundary dates correctly', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('1900-01-01'), // Very old date
            fc.constant('2099-12-31'), // Far future date
            fc.constant('2024-02-29'), // Leap year date
            fc.constant('2023-02-29'), // Invalid leap year date
            fc.constant('2024-13-01'), // Invalid month
            fc.constant('2024-12-32'), // Invalid day
            fc.constant('not-a-date'), // Not a date
            dateArbitrary // Valid dates
          ),
          dateString => {
            const data = {
              organization_name: 'Test Org',
              ein: '12-3456789',
              grant_opportunity_number: 'TEST-2024-0001',
              funding_agency: 'NSF',
              program_title: 'Test Program',
              requested_amount: 100000,
              project_duration_months: 12,
              principal_investigator: {
                name: 'Test Person',
                title: 'Dr.',
                email: 'test@example.com'
              },
              project_abstract: 'A'.repeat(200),
              budget_narrative: 'A'.repeat(100),
              submission_deadline: dateString
            }

            const valid = inputValidator(data)

            // Check if the date is valid ISO format
            const isValidDate =
              /^\d{4}-\d{2}-\d{2}$/.test(dateString) && !isNaN(Date.parse(dateString))

            expect(valid).toBe(isValidDate)
          }
        )
      )
    })

    it('should handle null and undefined values appropriately', () => {
      const dataWithNulls = {
        organization_name: 'Test Org',
        ein: '12-3456789',
        grant_opportunity_number: 'TEST-2024-0001',
        funding_agency: 'NSF',
        program_title: 'Test Program',
        requested_amount: 100000,
        project_duration_months: 12,
        principal_investigator: {
          name: 'Test Person',
          title: 'Dr.',
          email: 'test@example.com',
          phone: null // Should be rejected (expecting string or undefined)
        },
        project_abstract: 'A'.repeat(200),
        budget_narrative: 'A'.repeat(100),
        submission_deadline: '2024-12-31',
        cost_share_percentage: null, // Should be rejected
        indirect_cost_rate: undefined // Should be accepted
      }

      const valid = inputValidator(dataWithNulls)
      expect(valid).toBe(false) // null values should fail validation
    })

    it('should handle extreme numeric values', () => {
      fc.assert(
        fc.property(
          fc.record({
            amount: fc.oneof(
              fc.constant(Number.MAX_SAFE_INTEGER),
              fc.constant(Number.MIN_SAFE_INTEGER),
              fc.constant(Infinity),
              fc.constant(-Infinity),
              fc.constant(NaN),
              fc.constant(0.0000001), // Very small positive
              fc.constant(-0.0000001) // Very small negative
            ),
            months: fc.oneof(
              fc.constant(Number.MAX_SAFE_INTEGER),
              fc.constant(0),
              fc.constant(-1),
              fc.constant(0.5), // Fractional months
              fc.constant(NaN)
            )
          }),
          ({ amount, months }) => {
            const data = {
              organization_name: 'Test Org',
              ein: '12-3456789',
              grant_opportunity_number: 'TEST-2024-0001',
              funding_agency: 'NSF',
              program_title: 'Test Program',
              requested_amount: amount,
              project_duration_months: months,
              principal_investigator: {
                name: 'Test Person',
                title: 'Dr.',
                email: 'test@example.com'
              },
              project_abstract: 'A'.repeat(200),
              budget_narrative: 'A'.repeat(100),
              submission_deadline: '2024-12-31'
            }

            const valid = inputValidator(data)

            // Check if values are within acceptable ranges
            const isValidAmount = typeof amount === 'number' && isFinite(amount) && amount > 0
            const isValidMonths = Number.isInteger(months) && months >= 1 && months <= 60

            expect(valid).toBe(isValidAmount && isValidMonths)
          }
        )
      )
    })
  })
})
