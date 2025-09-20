# Playbook System Test Checklist

## Overview
This checklist covers all test requirements for the HERA Playbook System, organized by functional area. Each item should be verified through both unit tests and integration tests.

## Test Coverage Status
- [ ] All tests passing
- [ ] Coverage > 80%
- [ ] Performance benchmarks met
- [ ] Security audit passed

---

## 1. Playbook Creation and Versioning

### 1.1 Basic Playbook Creation
- [ ] Create playbook with required fields only
  - Test file: `playbook-crud.test.ts`
- [ ] Create playbook with all optional fields
  - Test file: `playbook-crud.test.ts`
- [ ] Validate smart code format `HERA.PLAYBOOK.*`
  - Test file: `smart-code-validation.test.ts`
- [ ] Verify version starts at v1
  - Test file: `playbook-versioning.test.ts`
- [ ] Ensure `is_active` defaults to true
  - Test file: `playbook-crud.test.ts`

### 1.2 Playbook Versioning
- [ ] Create new version increments correctly (v1 → v2)
  - Test file: `playbook-versioning.test.ts`
- [ ] Previous version marked as inactive
  - Test file: `playbook-versioning.test.ts`
- [ ] Version history maintained in relationships
  - Test file: `playbook-versioning.test.ts`
- [ ] Cannot modify frozen/published playbooks
  - Test file: `playbook-freezing.test.ts`
- [ ] Version rollback functionality
  - Test file: `playbook-versioning.test.ts`

### 1.3 Invalid Creation Scenarios
- [ ] Reject duplicate smart codes
  - Test file: `playbook-validation.test.ts`
- [ ] Reject invalid smart code formats
  - Test file: `smart-code-validation.test.ts`
- [ ] Reject missing required fields
  - Test file: `playbook-validation.test.ts`
- [ ] Reject invalid JSON in contract field
  - Test file: `contract-validation.test.ts`

---

## 2. Playbook Steps Management

### 2.1 Step Creation
- [ ] Create human step with required fields
  - Test file: `playbook-steps.test.ts`
- [ ] Create AI step with required fields
  - Test file: `playbook-steps.test.ts`
- [ ] Create system step with required fields
  - Test file: `playbook-steps.test.ts`
- [ ] Validate step sequence numbering
  - Test file: `step-sequencing.test.ts`
- [ ] Validate step smart codes `HERA.PLAYBOOK.STEP.*`
  - Test file: `smart-code-validation.test.ts`

### 2.2 Step Sequencing
- [ ] Steps execute in sequence order (10, 20, 30)
  - Test file: `step-sequencing.test.ts`
- [ ] Can insert steps between existing (15 between 10-20)
  - Test file: `step-sequencing.test.ts`
- [ ] Resequencing updates all step numbers
  - Test file: `step-sequencing.test.ts`
- [ ] Parallel steps (same sequence number) execute concurrently
  - Test file: `parallel-execution.test.ts`

### 2.3 Step Relationships
- [ ] Steps linked to correct playbook via relationships
  - Test file: `playbook-relationships.test.ts`
- [ ] Step dependencies tracked in relationships
  - Test file: `step-dependencies.test.ts`
- [ ] Cannot create orphan steps
  - Test file: `playbook-validation.test.ts`

---

## 3. Publishing and Freezing

### 3.1 Publishing Workflow
- [ ] Publish changes status to 'published'
  - Test file: `playbook-publishing.test.ts`
- [ ] Published playbooks cannot be edited
  - Test file: `playbook-freezing.test.ts`
- [ ] Published timestamp recorded
  - Test file: `playbook-publishing.test.ts`
- [ ] Publishing requires all steps to be valid
  - Test file: `publishing-validation.test.ts`

### 3.2 Freezing Mechanism
- [ ] Frozen playbooks reject all modifications
  - Test file: `playbook-freezing.test.ts`
- [ ] Frozen steps cannot be updated
  - Test file: `playbook-freezing.test.ts`
- [ ] Can create new version from frozen playbook
  - Test file: `playbook-versioning.test.ts`
- [ ] Freeze cascade to all related steps
  - Test file: `playbook-freezing.test.ts`

### 3.3 Archival Process
- [ ] Archive changes status to 'archived'
  - Test file: `playbook-archival.test.ts`
- [ ] Archived playbooks excluded from active queries
  - Test file: `playbook-archival.test.ts`
- [ ] Can restore archived playbooks
  - Test file: `playbook-archival.test.ts`
- [ ] Archive maintains all relationships
  - Test file: `playbook-archival.test.ts`

---

## 4. Run Execution

### 4.1 Run Header Creation
- [ ] Create run header with valid playbook reference
  - Test file: `run-execution.test.ts`
- [ ] Run number auto-generated correctly
  - Test file: `run-execution.test.ts`
- [ ] Status starts as 'pending'
  - Test file: `run-execution.test.ts`
- [ ] Start timestamp recorded
  - Test file: `run-execution.test.ts`
- [ ] Context data stored properly
  - Test file: `run-context.test.ts`

### 4.2 Run Lines Execution
- [ ] Run lines created for each playbook step
  - Test file: `run-lines.test.ts`
- [ ] Line sequence matches step sequence
  - Test file: `run-sequencing.test.ts`
- [ ] Line status tracks independently
  - Test file: `run-lines.test.ts`
- [ ] Execution timestamps recorded
  - Test file: `run-timing.test.ts`

### 4.3 Status Progression
- [ ] Run progresses: pending → running → completed
  - Test file: `run-status.test.ts`
- [ ] Run can fail: running → failed
  - Test file: `run-status.test.ts`
- [ ] Run can be cancelled: * → cancelled
  - Test file: `run-cancellation.test.ts`
- [ ] Line status affects run status
  - Test file: `run-status-aggregation.test.ts`

---

## 5. Retry Policy Enforcement

### 5.1 Basic Retry Logic
- [ ] Retry on transient failures
  - Test file: `retry-policy.test.ts`
- [ ] Respect max retry count
  - Test file: `retry-limits.test.ts`
- [ ] Exponential backoff timing
  - Test file: `retry-backoff.test.ts`
- [ ] Skip retry on permanent failures
  - Test file: `retry-classification.test.ts`

### 5.2 Retry Configuration
- [ ] Step-level retry override
  - Test file: `retry-configuration.test.ts`
- [ ] Playbook default retry policy
  - Test file: `retry-configuration.test.ts`
- [ ] System-wide retry defaults
  - Test file: `retry-configuration.test.ts`
- [ ] Retry metadata tracking
  - Test file: `retry-audit.test.ts`

### 5.3 Retry Scenarios
- [ ] Network timeout retry
  - Test file: `retry-scenarios.test.ts`
- [ ] Rate limit retry with backoff
  - Test file: `retry-scenarios.test.ts`
- [ ] Database deadlock retry
  - Test file: `retry-scenarios.test.ts`
- [ ] Do not retry validation errors
  - Test file: `retry-scenarios.test.ts`

---

## 6. AI Step Execution

### 6.1 AI Field Population
- [ ] AI fields populated for AI steps only
  - Test file: `ai-step-execution.test.ts`
- [ ] Model selection respected
  - Test file: `ai-model-selection.test.ts`
- [ ] Temperature settings applied
  - Test file: `ai-parameters.test.ts`
- [ ] Token limits enforced
  - Test file: `ai-token-limits.test.ts`

### 6.2 AI Response Handling
- [ ] Response stored in result field
  - Test file: `ai-response-storage.test.ts`
- [ ] Confidence score recorded
  - Test file: `ai-confidence.test.ts`
- [ ] Error handling for AI failures
  - Test file: `ai-error-handling.test.ts`
- [ ] Fallback to alternate models
  - Test file: `ai-fallback.test.ts`

### 6.3 AI Contract Validation
- [ ] Output matches expected schema
  - Test file: `ai-contract-validation.test.ts`
- [ ] Required fields present
  - Test file: `ai-output-validation.test.ts`
- [ ] Type validation on AI outputs
  - Test file: `ai-type-validation.test.ts`

---

## 7. Human Step Handling

### 7.1 Human Step Waiting
- [ ] Execution pauses at human steps
  - Test file: `human-step-waiting.test.ts`
- [ ] Webhook/notification sent
  - Test file: `human-notifications.test.ts`
- [ ] Status shows 'waiting_for_human'
  - Test file: `human-step-status.test.ts`
- [ ] Timeout handling for human steps
  - Test file: `human-step-timeout.test.ts`

### 7.2 Human Step Completion
- [ ] API endpoint accepts completion
  - Test file: `human-completion-api.test.ts`
- [ ] Validates human input against contract
  - Test file: `human-input-validation.test.ts`
- [ ] Records who completed the step
  - Test file: `human-audit-trail.test.ts`
- [ ] Resumes execution after completion
  - Test file: `human-step-resume.test.ts`

### 7.3 Human Step Features
- [ ] Approval workflows
  - Test file: `human-approval.test.ts`
- [ ] Multi-person sign-off
  - Test file: `human-multi-approval.test.ts`
- [ ] Delegation support
  - Test file: `human-delegation.test.ts`
- [ ] Mobile-friendly interface
  - Test file: `human-mobile-ui.test.ts`

---

## 8. Organization Security (RLS)

### 8.1 Row-Level Security
- [ ] Playbooks filtered by organization_id
  - Test file: `rls-playbooks.test.ts`
- [ ] Steps filtered by parent playbook org
  - Test file: `rls-steps.test.ts`
- [ ] Runs filtered by organization_id
  - Test file: `rls-runs.test.ts`
- [ ] Cross-org access denied
  - Test file: `rls-cross-org.test.ts`

### 8.2 Multi-Tenant Isolation
- [ ] Cannot see other org's playbooks
  - Test file: `multi-tenant-isolation.test.ts`
- [ ] Cannot execute other org's playbooks
  - Test file: `multi-tenant-execution.test.ts`
- [ ] Cannot access other org's run history
  - Test file: `multi-tenant-history.test.ts`
- [ ] System playbooks accessible to all
  - Test file: `system-playbook-access.test.ts`

### 8.3 Permission Checks
- [ ] Create requires organization context
  - Test file: `permission-create.test.ts`
- [ ] Update checks organization ownership
  - Test file: `permission-update.test.ts`
- [ ] Delete restricted to org owners
  - Test file: `permission-delete.test.ts`
- [ ] Execute permissions validated
  - Test file: `permission-execute.test.ts`

---

## 9. Smart Code Validation

### 9.1 Format Validation
- [ ] Playbook codes match `HERA.PLAYBOOK.*`
  - Test file: `smart-code-format.test.ts`
- [ ] Step codes match `HERA.PLAYBOOK.STEP.*`
  - Test file: `smart-code-format.test.ts`
- [ ] Version suffix validation (.v1, .v2)
  - Test file: `smart-code-version.test.ts`
- [ ] Industry segment validation
  - Test file: `smart-code-industry.test.ts`

### 9.2 Uniqueness Checks
- [ ] No duplicate smart codes in org
  - Test file: `smart-code-uniqueness.test.ts`
- [ ] Version increments preserve base code
  - Test file: `smart-code-versioning.test.ts`
- [ ] System codes protected
  - Test file: `smart-code-system.test.ts`

---

## 10. Contract Enforcement

### 10.1 Input Contract Validation
- [ ] Required fields enforced
  - Test file: `contract-input-validation.test.ts`
- [ ] Type checking on inputs
  - Test file: `contract-type-checking.test.ts`
- [ ] Schema validation (JSON Schema)
  - Test file: `contract-schema.test.ts`
- [ ] Default values applied
  - Test file: `contract-defaults.test.ts`

### 10.2 Output Contract Validation
- [ ] Output matches expected format
  - Test file: `contract-output-validation.test.ts`
- [ ] Required outputs present
  - Test file: `contract-required-outputs.test.ts`
- [ ] Type coercion where needed
  - Test file: `contract-coercion.test.ts`

### 10.3 Contract Evolution
- [ ] Backward compatibility maintained
  - Test file: `contract-compatibility.test.ts`
- [ ] Version migration support
  - Test file: `contract-migration.test.ts`
- [ ] Deprecation warnings
  - Test file: `contract-deprecation.test.ts`

---

## 11. Policy Compliance

### 11.1 Execution Policies
- [ ] Concurrency limits enforced
  - Test file: `policy-concurrency.test.ts`
- [ ] Rate limiting applied
  - Test file: `policy-rate-limit.test.ts`
- [ ] Resource quotas checked
  - Test file: `policy-quotas.test.ts`
- [ ] Time-of-day restrictions
  - Test file: `policy-scheduling.test.ts`

### 11.2 Data Policies
- [ ] PII handling compliance
  - Test file: `policy-pii.test.ts`
- [ ] Data retention rules
  - Test file: `policy-retention.test.ts`
- [ ] Encryption requirements
  - Test file: `policy-encryption.test.ts`
- [ ] Audit trail completeness
  - Test file: `policy-audit.test.ts`

### 11.3 Business Policies
- [ ] Approval thresholds
  - Test file: `policy-approval.test.ts`
- [ ] Segregation of duties
  - Test file: `policy-sod.test.ts`
- [ ] Change freeze periods
  - Test file: `policy-freeze.test.ts`

---

## 12. Security and Permissions

### 12.1 Authentication
- [ ] JWT token validation
  - Test file: `auth-jwt.test.ts`
- [ ] Session management
  - Test file: `auth-session.test.ts`
- [ ] API key authentication
  - Test file: `auth-api-key.test.ts`
- [ ] Multi-factor support
  - Test file: `auth-mfa.test.ts`

### 12.2 Authorization
- [ ] Role-based access control
  - Test file: `authz-rbac.test.ts`
- [ ] Playbook-specific permissions
  - Test file: `authz-playbook.test.ts`
- [ ] Step-level permissions
  - Test file: `authz-steps.test.ts`
- [ ] Execution permissions
  - Test file: `authz-execution.test.ts`

### 12.3 Security Features
- [ ] SQL injection prevention
  - Test file: `security-sql-injection.test.ts`
- [ ] XSS prevention
  - Test file: `security-xss.test.ts`
- [ ] CSRF protection
  - Test file: `security-csrf.test.ts`
- [ ] Rate limiting per user
  - Test file: `security-rate-limit.test.ts`

---

## 13. Idempotency

### 13.1 Execution Idempotency
- [ ] Duplicate run requests handled
  - Test file: `idempotency-execution.test.ts`
- [ ] Idempotency keys tracked
  - Test file: `idempotency-keys.test.ts`
- [ ] Results cached appropriately
  - Test file: `idempotency-cache.test.ts`
- [ ] TTL on idempotency records
  - Test file: `idempotency-ttl.test.ts`

### 13.2 Step Idempotency
- [ ] Re-running steps safe
  - Test file: `idempotency-steps.test.ts`
- [ ] Side effects tracked
  - Test file: `idempotency-side-effects.test.ts`
- [ ] Compensation logic available
  - Test file: `idempotency-compensation.test.ts`

---

## 14. Signal Handling

### 14.1 Cancellation Signals
- [ ] Graceful cancellation support
  - Test file: `signal-cancellation.test.ts`
- [ ] Cleanup on cancellation
  - Test file: `signal-cleanup.test.ts`
- [ ] Partial results saved
  - Test file: `signal-partial-results.test.ts`
- [ ] Cancellation cascades
  - Test file: `signal-cascade.test.ts`

### 14.2 Pause/Resume Signals
- [ ] Pause at safe points
  - Test file: `signal-pause.test.ts`
- [ ] State preserved on pause
  - Test file: `signal-state-preservation.test.ts`
- [ ] Resume from pause point
  - Test file: `signal-resume.test.ts`
- [ ] Timeout on extended pause
  - Test file: `signal-pause-timeout.test.ts`

### 14.3 External Signals
- [ ] Webhook signal reception
  - Test file: `signal-webhook.test.ts`
- [ ] Event-driven triggers
  - Test file: `signal-events.test.ts`
- [ ] Schedule-based signals
  - Test file: `signal-schedule.test.ts`

---

## 15. Performance Requirements

### 15.1 Response Times
- [ ] Playbook creation < 100ms
  - Test file: `perf-creation.test.ts`
- [ ] Step execution < 500ms (non-AI)
  - Test file: `perf-execution.test.ts`
- [ ] Status updates < 50ms
  - Test file: `perf-status.test.ts`
- [ ] Query performance < 200ms
  - Test file: `perf-queries.test.ts`

### 15.2 Scalability
- [ ] Handle 1000+ concurrent runs
  - Test file: `scale-concurrent-runs.test.ts`
- [ ] Support 10K+ playbooks per org
  - Test file: `scale-playbook-count.test.ts`
- [ ] Process 100K+ steps per hour
  - Test file: `scale-throughput.test.ts`
- [ ] Sub-second failover
  - Test file: `scale-failover.test.ts`

### 15.3 Resource Usage
- [ ] Memory usage < 512MB per worker
  - Test file: `resource-memory.test.ts`
- [ ] CPU usage scales linearly
  - Test file: `resource-cpu.test.ts`
- [ ] Database connections pooled
  - Test file: `resource-connections.test.ts`
- [ ] No memory leaks
  - Test file: `resource-leaks.test.ts`

---

## 16. Integration Tests

### 16.1 End-to-End Workflows
- [ ] Complete playbook lifecycle
  - Test file: `e2e-lifecycle.test.ts`
- [ ] Multi-step execution flow
  - Test file: `e2e-execution.test.ts`
- [ ] Human interaction workflow
  - Test file: `e2e-human.test.ts`
- [ ] AI-powered automation
  - Test file: `e2e-ai.test.ts`

### 16.2 External Integrations
- [ ] Webhook delivery
  - Test file: `integration-webhooks.test.ts`
- [ ] Email notifications
  - Test file: `integration-email.test.ts`
- [ ] SMS notifications
  - Test file: `integration-sms.test.ts`
- [ ] Slack integration
  - Test file: `integration-slack.test.ts`

### 16.3 System Integration
- [ ] Universal API compatibility
  - Test file: `integration-universal-api.test.ts`
- [ ] Smart code system integration
  - Test file: `integration-smart-codes.test.ts`
- [ ] Audit trail integration
  - Test file: `integration-audit.test.ts`
- [ ] Monitoring integration
  - Test file: `integration-monitoring.test.ts`

---

## 17. Error Handling

### 17.1 Graceful Degradation
- [ ] Network errors handled
  - Test file: `error-network.test.ts`
- [ ] Database errors handled
  - Test file: `error-database.test.ts`
- [ ] AI service errors handled
  - Test file: `error-ai-service.test.ts`
- [ ] Invalid input errors
  - Test file: `error-validation.test.ts`

### 17.2 Error Recovery
- [ ] Automatic retry on transient errors
  - Test file: `error-retry.test.ts`
- [ ] Circuit breaker implementation
  - Test file: `error-circuit-breaker.test.ts`
- [ ] Fallback strategies
  - Test file: `error-fallback.test.ts`
- [ ] Error notification system
  - Test file: `error-notifications.test.ts`

### 17.3 Error Reporting
- [ ] Detailed error messages
  - Test file: `error-messages.test.ts`
- [ ] Error categorization
  - Test file: `error-categories.test.ts`
- [ ] Stack trace capture
  - Test file: `error-stack-traces.test.ts`
- [ ] Error analytics
  - Test file: `error-analytics.test.ts`

---

## Test Execution Guidelines

### Priority Levels
1. **Critical**: Security, RLS, Contract Validation
2. **High**: Core CRUD, Execution Flow, Retry Logic
3. **Medium**: Integration, Performance, Error Handling
4. **Low**: UI/UX, Analytics, Reporting

### Test Environment Requirements
- [ ] Isolated test database
- [ ] Mock AI services available
- [ ] Test organization setup
- [ ] Sample playbooks seeded
- [ ] Performance monitoring tools

### Continuous Integration
- [ ] All tests run on PR
- [ ] Nightly full test suite
- [ ] Performance regression tests
- [ ] Security scan integration

---

## Sign-off

### Development Team
- [ ] Unit tests complete
- [ ] Integration tests complete
- [ ] Code review passed
- [ ] Documentation updated

### QA Team
- [ ] Functional testing complete
- [ ] Performance testing complete
- [ ] Security testing complete
- [ ] User acceptance criteria met

### Release Readiness
- [ ] All critical tests passing
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Production deployment plan ready

---

Last Updated: [Date]
Version: 1.0