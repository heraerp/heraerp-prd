/**
 * Generated HERA DNA SDK Functions
 * Auto-generated from MCP tools - DO NOT EDIT
 */
import { OrganizationId, SmartCode, EntityId, CoreEntity, UniversalTransaction, CoreDynamicData, CoreRelationship, SacredTable, DNAResponse } from '../src/types';
interface MCPClient {
    call<T>(tool: string, params: any): Promise<T>;
}
export declare function initializeMCP(client: MCPClient): void;
/**
 * create-entity - MCP-backed SDK function
 */
export declare function create_entity(entity_type: string, entity_name: string, smart_code: SmartCode, organization_id: OrganizationId): Promise<DNAResponse<CoreEntity>>;
/**
 * create-transaction - MCP-backed SDK function
 */
export declare function create_transaction(transaction_type: string, transaction_code: string, smart_code: SmartCode, organization_id: OrganizationId, amount: number): Promise<DNAResponse<UniversalTransaction>>;
/**
 * set-dynamic-field - MCP-backed SDK function
 */
export declare function set_dynamic_field(entity_id: EntityId, field_name: string, field_value: number, smart_code: SmartCode, organization_id: OrganizationId): Promise<DNAResponse<CoreDynamicData>>;
/**
 * create-relationship - MCP-backed SDK function
 */
export declare function create_relationship(from_entity_id: EntityId, to_entity_id: EntityId, relationship_type: string, smart_code: SmartCode, organization_id: OrganizationId): Promise<DNAResponse<CoreRelationship>>;
/**
 * query-universal - MCP-backed SDK function
 */
export declare function query_universal(table: SacredTable, filters: Record<string, any>, organization_id: OrganizationId, smart_code: SmartCode): Promise<DNAResponse<Array<any>>>;
export {};
//# sourceMappingURL=sdk-functions.d.ts.map