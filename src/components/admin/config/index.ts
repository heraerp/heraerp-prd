export { RulesList } from './RulesList';
export { RuleEditor } from './RuleEditor';
export { RulePreview } from './RulePreview';
export { RulesListMCP } from './RulesListMCP';

// Export common types for all config components
export type ConfigRuleType = 'validation' | 'transformation' | 'business_logic' | 'integration';
export type ConfigRuleScope = 'global' | 'organization' | 'entity_type' | 'specific';
export type ConfigRuleStatus = 'active' | 'inactive' | 'draft' | 'deprecated';

export interface ConfigRule {
  id?: string;
  name: string;
  category: string;
  type: ConfigRuleType;
  scope: ConfigRuleScope;
  status: ConfigRuleStatus;
  priority: number;
  description: string;
  smart_code: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
    logic?: 'AND' | 'OR';
  }>;
  actions: Array<{
    type: string;
    target: string;
    value: string;
    parameters?: Record<string, any>;
  }>;
  configuration: {
    timeout_ms?: number;
    retry_count?: number;
    failure_action?: 'stop' | 'continue' | 'rollback';
    notification_enabled?: boolean;
    logging_level?: 'none' | 'basic' | 'detailed';
  };
  validation_schema?: Record<string, any>;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
  applied_count?: number;
  error_count?: number;
  success_rate?: number;
}