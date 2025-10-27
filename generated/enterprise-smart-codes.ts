// Enterprise Smart Codes TypeScript Definitions
// Generated automatically - DO NOT EDIT MANUALLY

export interface EnterpriseSmartCode {
  smart_code: string
  module: EnterpriseModule
  sub_module: EnterpriseSubModule
  function_type: 'ENT' | 'TXN' | 'RPT'
  entity_type: EnterpriseEntityType
  version: string
  description: string
  generated_at: string
  generated_by: string
}

export type EnterpriseModule = 'FIN' | 'MFG' | 'PROC' | 'SALES'

export type EnterpriseSubModule = 'AP' | 'AR' | 'CRM' | 'GL' | 'INV' | 'PE' | 'PP' | 'PUR' | 'QM' | 'SD' | 'SRC'

export type EnterpriseEntityType = 'ACC' | 'ADJ' | 'AGE' | 'APP' | 'AUTO' | 'AWRD' | 'BAD' | 'BID' | 'BILL' | 'BOM' | 'BS' | 'CA' | 'CAMP' | 'CAP' | 'CAT' | 'CCTR' | 'CERT' | 'CF' | 'CLOS' | 'COA' | 'COLL' | 'COMP' | 'CONF' | 'CONT' | 'CONV' | 'COST' | 'CRED' | 'CUST' | 'DEF' | 'DEL' | 'DISC' | 'EFF' | 'EVAL' | 'EXC' | 'EXP' | 'FORE' | 'GL' | 'GR' | 'INSP' | 'INV' | 'IR' | 'JE' | 'LEAD' | 'MAT' | 'MATCH' | 'MOV' | 'MRP' | 'NC' | 'NEGO' | 'OP' | 'OPP' | 'ORD' | 'PAY' | 'PCTR' | 'PERF' | 'PIPE' | 'PL' | 'PLAN' | 'PO' | 'POST' | 'PR' | 'PRIC' | 'PROC' | 'PROD' | 'QC' | 'QUA' | 'QUAL' | 'QUOT' | 'REC' | 'REL' | 'REQ' | 'RET' | 'REV' | 'RFQ' | 'RTG' | 'SALE' | 'SAVE' | 'SCH' | 'SHIP' | 'SPEND' | 'SRC' | 'SUPP' | 'TAX' | 'TB' | 'TERM' | 'TERR' | 'TEST' | 'UTIL' | 'VEND' | 'WC' | 'WIP' | 'WO'

export const ENTERPRISE_SMART_CODES = {
  FIN: {
    GL: {
      ENTITIES: ['ACC', 'COA', 'JE', 'CCTR', 'PCTR'],
      TRANSACTIONS: ['JE', 'POST', 'REV', 'CLOS', 'ADJ'],
      REPORTS: ['TB', 'BS', 'PL', 'CF', 'GL']
    },
    AP: {
      ENTITIES: ['VEND', 'INV', 'PAY', 'TERM', 'TAX'],
      TRANSACTIONS: ['PR', 'PO', 'GR', 'IR', 'PAY'],
      REPORTS: ['AGE', 'PAY', 'VEND', 'EXP', 'TAX']
    },
    AR: {
      ENTITIES: ['CUST', 'INV', 'PAY', 'TERM', 'CRED'],
      TRANSACTIONS: ['ORD', 'INV', 'PAY', 'CRED', 'COLL'],
      REPORTS: ['AGE', 'COLL', 'CUST', 'REV', 'BAD']
    }
  },
  MFG: {
    PP: {
      ENTITIES: ['BOM', 'RTG', 'WC', 'CAP', 'PLAN'],
      TRANSACTIONS: ['MRP', 'PLAN', 'SCH', 'CAP', 'MAT'],
      REPORTS: ['PLAN', 'CAP', 'MAT', 'SCH', 'PERF']
    },
    PE: {
      ENTITIES: ['PO', 'OP', 'WO', 'QC', 'MAT'],
      TRANSACTIONS: ['REL', 'CONF', 'MOV', 'QC', 'COMP'],
      REPORTS: ['PROD', 'EFF', 'QUA', 'WIP', 'UTIL']
    },
    QM: {
      ENTITIES: ['PLAN', 'INSP', 'CERT', 'NC', 'CA'],
      TRANSACTIONS: ['INSP', 'TEST', 'CERT', 'NC', 'CA'],
      REPORTS: ['QUA', 'DEF', 'CERT', 'COST', 'PERF']
    }
  },
  PROC: {
    SRC: {
      ENTITIES: ['RFQ', 'BID', 'EVAL', 'CONT', 'SUPP'],
      TRANSACTIONS: ['RFQ', 'BID', 'EVAL', 'NEGO', 'AWRD'],
      REPORTS: ['SRC', 'BID', 'SAVE', 'SUPP', 'PERF']
    },
    PUR: {
      ENTITIES: ['REQ', 'PO', 'SUPP', 'CAT', 'CONT'],
      TRANSACTIONS: ['REQ', 'PO', 'GR', 'IR', 'PAY'],
      REPORTS: ['SPEND', 'SUPP', 'SAVE', 'COMP', 'PERF']
    },
    INV: {
      ENTITIES: ['SUPP', 'INV', 'MATCH', 'PAY', 'DISC'],
      TRANSACTIONS: ['REC', 'MATCH', 'APP', 'PAY', 'DISC'],
      REPORTS: ['PROC', 'AUTO', 'EXC', 'DISC', 'TAX']
    }
  },
  SALES: {
    CRM: {
      ENTITIES: ['LEAD', 'OPP', 'CUST', 'CONT', 'CAMP', 'TERR', 'PIPE', 'FORE'],
      TRANSACTIONS: ['QUAL', 'CONV', 'QUOT', 'ORD', 'INV', 'PAY'],
      REPORTS: ['PIPE', 'FORE', 'PERF', 'CONV', 'REV', 'TERR']
    },
    SD: {
      ENTITIES: ['PROD', 'PRIC', 'CUST', 'SHIP', 'BILL'],
      TRANSACTIONS: ['ORD', 'DEL', 'INV', 'RET', 'PAY'],
      REPORTS: ['SALE', 'ORD', 'DEL', 'REV', 'CUST']
    }
  }
} as const

export const ENTERPRISE_SMART_CODE_LIST: EnterpriseSmartCode[] = [
  {
    "smart_code": "HERA.SALES.CRM.ENT.LEAD.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "ENT",
    "entity_type": "LEAD",
    "version": "v1",
    "description": "SALES CRM - Entity management for LEAD",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.ENT.OPP.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "ENT",
    "entity_type": "OPP",
    "version": "v1",
    "description": "SALES CRM - Entity management for OPP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.ENT.CUST.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "ENT",
    "entity_type": "CUST",
    "version": "v1",
    "description": "SALES CRM - Entity management for CUST",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.ENT.CONT.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "ENT",
    "entity_type": "CONT",
    "version": "v1",
    "description": "SALES CRM - Entity management for CONT",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.ENT.CAMP.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "ENT",
    "entity_type": "CAMP",
    "version": "v1",
    "description": "SALES CRM - Entity management for CAMP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.ENT.TERR.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "ENT",
    "entity_type": "TERR",
    "version": "v1",
    "description": "SALES CRM - Entity management for TERR",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.ENT.PIPE.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "ENT",
    "entity_type": "PIPE",
    "version": "v1",
    "description": "SALES CRM - Entity management for PIPE",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.ENT.FORE.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "ENT",
    "entity_type": "FORE",
    "version": "v1",
    "description": "SALES CRM - Entity management for FORE",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.TXN.QUAL.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "TXN",
    "entity_type": "QUAL",
    "version": "v1",
    "description": "SALES CRM - Transaction processing for QUAL",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.TXN.CONV.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "TXN",
    "entity_type": "CONV",
    "version": "v1",
    "description": "SALES CRM - Transaction processing for CONV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.TXN.QUOT.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "TXN",
    "entity_type": "QUOT",
    "version": "v1",
    "description": "SALES CRM - Transaction processing for QUOT",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.TXN.ORD.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "TXN",
    "entity_type": "ORD",
    "version": "v1",
    "description": "SALES CRM - Transaction processing for ORD",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.TXN.INV.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "TXN",
    "entity_type": "INV",
    "version": "v1",
    "description": "SALES CRM - Transaction processing for INV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.TXN.PAY.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "TXN",
    "entity_type": "PAY",
    "version": "v1",
    "description": "SALES CRM - Transaction processing for PAY",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.RPT.PIPE.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "RPT",
    "entity_type": "PIPE",
    "version": "v1",
    "description": "SALES CRM - Reporting for PIPE",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.RPT.FORE.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "RPT",
    "entity_type": "FORE",
    "version": "v1",
    "description": "SALES CRM - Reporting for FORE",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.RPT.PERF.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "RPT",
    "entity_type": "PERF",
    "version": "v1",
    "description": "SALES CRM - Reporting for PERF",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.RPT.CONV.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "RPT",
    "entity_type": "CONV",
    "version": "v1",
    "description": "SALES CRM - Reporting for CONV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.RPT.REV.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "RPT",
    "entity_type": "REV",
    "version": "v1",
    "description": "SALES CRM - Reporting for REV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.CRM.RPT.TERR.v1",
    "module": "SALES",
    "sub_module": "CRM",
    "function_type": "RPT",
    "entity_type": "TERR",
    "version": "v1",
    "description": "SALES CRM - Reporting for TERR",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.ENT.PROD.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "ENT",
    "entity_type": "PROD",
    "version": "v1",
    "description": "SALES SD - Entity management for PROD",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.ENT.PRIC.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "ENT",
    "entity_type": "PRIC",
    "version": "v1",
    "description": "SALES SD - Entity management for PRIC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.ENT.CUST.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "ENT",
    "entity_type": "CUST",
    "version": "v1",
    "description": "SALES SD - Entity management for CUST",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.ENT.SHIP.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "ENT",
    "entity_type": "SHIP",
    "version": "v1",
    "description": "SALES SD - Entity management for SHIP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.ENT.BILL.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "ENT",
    "entity_type": "BILL",
    "version": "v1",
    "description": "SALES SD - Entity management for BILL",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.TXN.ORD.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "TXN",
    "entity_type": "ORD",
    "version": "v1",
    "description": "SALES SD - Transaction processing for ORD",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.TXN.DEL.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "TXN",
    "entity_type": "DEL",
    "version": "v1",
    "description": "SALES SD - Transaction processing for DEL",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.TXN.INV.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "TXN",
    "entity_type": "INV",
    "version": "v1",
    "description": "SALES SD - Transaction processing for INV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.TXN.RET.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "TXN",
    "entity_type": "RET",
    "version": "v1",
    "description": "SALES SD - Transaction processing for RET",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.TXN.PAY.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "TXN",
    "entity_type": "PAY",
    "version": "v1",
    "description": "SALES SD - Transaction processing for PAY",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.RPT.SALE.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "RPT",
    "entity_type": "SALE",
    "version": "v1",
    "description": "SALES SD - Reporting for SALE",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.RPT.ORD.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "RPT",
    "entity_type": "ORD",
    "version": "v1",
    "description": "SALES SD - Reporting for ORD",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.RPT.DEL.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "RPT",
    "entity_type": "DEL",
    "version": "v1",
    "description": "SALES SD - Reporting for DEL",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.RPT.REV.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "RPT",
    "entity_type": "REV",
    "version": "v1",
    "description": "SALES SD - Reporting for REV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.SALES.SD.RPT.CUST.v1",
    "module": "SALES",
    "sub_module": "SD",
    "function_type": "RPT",
    "entity_type": "CUST",
    "version": "v1",
    "description": "SALES SD - Reporting for CUST",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.ENT.ACC.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "ENT",
    "entity_type": "ACC",
    "version": "v1",
    "description": "FIN GL - Entity management for ACC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.ENT.COA.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "ENT",
    "entity_type": "COA",
    "version": "v1",
    "description": "FIN GL - Entity management for COA",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.ENT.JE.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "ENT",
    "entity_type": "JE",
    "version": "v1",
    "description": "FIN GL - Entity management for JE",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.ENT.CCTR.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "ENT",
    "entity_type": "CCTR",
    "version": "v1",
    "description": "FIN GL - Entity management for CCTR",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.ENT.PCTR.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "ENT",
    "entity_type": "PCTR",
    "version": "v1",
    "description": "FIN GL - Entity management for PCTR",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.TXN.JE.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "TXN",
    "entity_type": "JE",
    "version": "v1",
    "description": "FIN GL - Transaction processing for JE",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.TXN.POST.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "TXN",
    "entity_type": "POST",
    "version": "v1",
    "description": "FIN GL - Transaction processing for POST",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.TXN.REV.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "TXN",
    "entity_type": "REV",
    "version": "v1",
    "description": "FIN GL - Transaction processing for REV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.TXN.CLOS.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "TXN",
    "entity_type": "CLOS",
    "version": "v1",
    "description": "FIN GL - Transaction processing for CLOS",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.TXN.ADJ.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "TXN",
    "entity_type": "ADJ",
    "version": "v1",
    "description": "FIN GL - Transaction processing for ADJ",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.RPT.TB.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "RPT",
    "entity_type": "TB",
    "version": "v1",
    "description": "FIN GL - Reporting for TB",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.RPT.BS.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "RPT",
    "entity_type": "BS",
    "version": "v1",
    "description": "FIN GL - Reporting for BS",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.RPT.PL.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "RPT",
    "entity_type": "PL",
    "version": "v1",
    "description": "FIN GL - Reporting for PL",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.RPT.CF.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "RPT",
    "entity_type": "CF",
    "version": "v1",
    "description": "FIN GL - Reporting for CF",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.GL.RPT.GL.v1",
    "module": "FIN",
    "sub_module": "GL",
    "function_type": "RPT",
    "entity_type": "GL",
    "version": "v1",
    "description": "FIN GL - Reporting for GL",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.ENT.VEND.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "ENT",
    "entity_type": "VEND",
    "version": "v1",
    "description": "FIN AP - Entity management for VEND",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.ENT.INV.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "ENT",
    "entity_type": "INV",
    "version": "v1",
    "description": "FIN AP - Entity management for INV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.ENT.PAY.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "ENT",
    "entity_type": "PAY",
    "version": "v1",
    "description": "FIN AP - Entity management for PAY",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.ENT.TERM.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "ENT",
    "entity_type": "TERM",
    "version": "v1",
    "description": "FIN AP - Entity management for TERM",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.ENT.TAX.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "ENT",
    "entity_type": "TAX",
    "version": "v1",
    "description": "FIN AP - Entity management for TAX",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.TXN.PR.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "TXN",
    "entity_type": "PR",
    "version": "v1",
    "description": "FIN AP - Transaction processing for PR",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.TXN.PO.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "TXN",
    "entity_type": "PO",
    "version": "v1",
    "description": "FIN AP - Transaction processing for PO",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.TXN.GR.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "TXN",
    "entity_type": "GR",
    "version": "v1",
    "description": "FIN AP - Transaction processing for GR",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.TXN.IR.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "TXN",
    "entity_type": "IR",
    "version": "v1",
    "description": "FIN AP - Transaction processing for IR",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.TXN.PAY.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "TXN",
    "entity_type": "PAY",
    "version": "v1",
    "description": "FIN AP - Transaction processing for PAY",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.RPT.AGE.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "RPT",
    "entity_type": "AGE",
    "version": "v1",
    "description": "FIN AP - Reporting for AGE",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.RPT.PAY.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "RPT",
    "entity_type": "PAY",
    "version": "v1",
    "description": "FIN AP - Reporting for PAY",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.RPT.VEND.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "RPT",
    "entity_type": "VEND",
    "version": "v1",
    "description": "FIN AP - Reporting for VEND",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.RPT.EXP.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "RPT",
    "entity_type": "EXP",
    "version": "v1",
    "description": "FIN AP - Reporting for EXP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AP.RPT.TAX.v1",
    "module": "FIN",
    "sub_module": "AP",
    "function_type": "RPT",
    "entity_type": "TAX",
    "version": "v1",
    "description": "FIN AP - Reporting for TAX",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.ENT.CUST.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "ENT",
    "entity_type": "CUST",
    "version": "v1",
    "description": "FIN AR - Entity management for CUST",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.ENT.INV.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "ENT",
    "entity_type": "INV",
    "version": "v1",
    "description": "FIN AR - Entity management for INV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.ENT.PAY.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "ENT",
    "entity_type": "PAY",
    "version": "v1",
    "description": "FIN AR - Entity management for PAY",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.ENT.TERM.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "ENT",
    "entity_type": "TERM",
    "version": "v1",
    "description": "FIN AR - Entity management for TERM",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.ENT.CRED.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "ENT",
    "entity_type": "CRED",
    "version": "v1",
    "description": "FIN AR - Entity management for CRED",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.TXN.ORD.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "TXN",
    "entity_type": "ORD",
    "version": "v1",
    "description": "FIN AR - Transaction processing for ORD",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.TXN.INV.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "TXN",
    "entity_type": "INV",
    "version": "v1",
    "description": "FIN AR - Transaction processing for INV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.TXN.PAY.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "TXN",
    "entity_type": "PAY",
    "version": "v1",
    "description": "FIN AR - Transaction processing for PAY",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.TXN.CRED.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "TXN",
    "entity_type": "CRED",
    "version": "v1",
    "description": "FIN AR - Transaction processing for CRED",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.TXN.COLL.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "TXN",
    "entity_type": "COLL",
    "version": "v1",
    "description": "FIN AR - Transaction processing for COLL",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.RPT.AGE.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "RPT",
    "entity_type": "AGE",
    "version": "v1",
    "description": "FIN AR - Reporting for AGE",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.RPT.COLL.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "RPT",
    "entity_type": "COLL",
    "version": "v1",
    "description": "FIN AR - Reporting for COLL",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.RPT.CUST.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "RPT",
    "entity_type": "CUST",
    "version": "v1",
    "description": "FIN AR - Reporting for CUST",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.RPT.REV.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "RPT",
    "entity_type": "REV",
    "version": "v1",
    "description": "FIN AR - Reporting for REV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.FIN.AR.RPT.BAD.v1",
    "module": "FIN",
    "sub_module": "AR",
    "function_type": "RPT",
    "entity_type": "BAD",
    "version": "v1",
    "description": "FIN AR - Reporting for BAD",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.ENT.BOM.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "ENT",
    "entity_type": "BOM",
    "version": "v1",
    "description": "MFG PP - Entity management for BOM",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.ENT.RTG.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "ENT",
    "entity_type": "RTG",
    "version": "v1",
    "description": "MFG PP - Entity management for RTG",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.ENT.WC.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "ENT",
    "entity_type": "WC",
    "version": "v1",
    "description": "MFG PP - Entity management for WC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.ENT.CAP.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "ENT",
    "entity_type": "CAP",
    "version": "v1",
    "description": "MFG PP - Entity management for CAP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.ENT.PLAN.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "ENT",
    "entity_type": "PLAN",
    "version": "v1",
    "description": "MFG PP - Entity management for PLAN",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.TXN.MRP.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "TXN",
    "entity_type": "MRP",
    "version": "v1",
    "description": "MFG PP - Transaction processing for MRP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.TXN.PLAN.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "TXN",
    "entity_type": "PLAN",
    "version": "v1",
    "description": "MFG PP - Transaction processing for PLAN",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.TXN.SCH.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "TXN",
    "entity_type": "SCH",
    "version": "v1",
    "description": "MFG PP - Transaction processing for SCH",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.TXN.CAP.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "TXN",
    "entity_type": "CAP",
    "version": "v1",
    "description": "MFG PP - Transaction processing for CAP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.TXN.MAT.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "TXN",
    "entity_type": "MAT",
    "version": "v1",
    "description": "MFG PP - Transaction processing for MAT",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.RPT.PLAN.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "RPT",
    "entity_type": "PLAN",
    "version": "v1",
    "description": "MFG PP - Reporting for PLAN",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.RPT.CAP.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "RPT",
    "entity_type": "CAP",
    "version": "v1",
    "description": "MFG PP - Reporting for CAP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.RPT.MAT.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "RPT",
    "entity_type": "MAT",
    "version": "v1",
    "description": "MFG PP - Reporting for MAT",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.RPT.SCH.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "RPT",
    "entity_type": "SCH",
    "version": "v1",
    "description": "MFG PP - Reporting for SCH",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PP.RPT.PERF.v1",
    "module": "MFG",
    "sub_module": "PP",
    "function_type": "RPT",
    "entity_type": "PERF",
    "version": "v1",
    "description": "MFG PP - Reporting for PERF",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.ENT.PO.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "ENT",
    "entity_type": "PO",
    "version": "v1",
    "description": "MFG PE - Entity management for PO",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.ENT.OP.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "ENT",
    "entity_type": "OP",
    "version": "v1",
    "description": "MFG PE - Entity management for OP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.ENT.WO.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "ENT",
    "entity_type": "WO",
    "version": "v1",
    "description": "MFG PE - Entity management for WO",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.ENT.QC.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "ENT",
    "entity_type": "QC",
    "version": "v1",
    "description": "MFG PE - Entity management for QC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.ENT.MAT.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "ENT",
    "entity_type": "MAT",
    "version": "v1",
    "description": "MFG PE - Entity management for MAT",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.TXN.REL.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "TXN",
    "entity_type": "REL",
    "version": "v1",
    "description": "MFG PE - Transaction processing for REL",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.TXN.CONF.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "TXN",
    "entity_type": "CONF",
    "version": "v1",
    "description": "MFG PE - Transaction processing for CONF",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.TXN.MOV.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "TXN",
    "entity_type": "MOV",
    "version": "v1",
    "description": "MFG PE - Transaction processing for MOV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.TXN.QC.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "TXN",
    "entity_type": "QC",
    "version": "v1",
    "description": "MFG PE - Transaction processing for QC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.TXN.COMP.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "TXN",
    "entity_type": "COMP",
    "version": "v1",
    "description": "MFG PE - Transaction processing for COMP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.RPT.PROD.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "RPT",
    "entity_type": "PROD",
    "version": "v1",
    "description": "MFG PE - Reporting for PROD",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.RPT.EFF.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "RPT",
    "entity_type": "EFF",
    "version": "v1",
    "description": "MFG PE - Reporting for EFF",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.RPT.QUA.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "RPT",
    "entity_type": "QUA",
    "version": "v1",
    "description": "MFG PE - Reporting for QUA",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.RPT.WIP.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "RPT",
    "entity_type": "WIP",
    "version": "v1",
    "description": "MFG PE - Reporting for WIP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.PE.RPT.UTIL.v1",
    "module": "MFG",
    "sub_module": "PE",
    "function_type": "RPT",
    "entity_type": "UTIL",
    "version": "v1",
    "description": "MFG PE - Reporting for UTIL",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.ENT.PLAN.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "ENT",
    "entity_type": "PLAN",
    "version": "v1",
    "description": "MFG QM - Entity management for PLAN",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.ENT.INSP.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "ENT",
    "entity_type": "INSP",
    "version": "v1",
    "description": "MFG QM - Entity management for INSP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.ENT.CERT.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "ENT",
    "entity_type": "CERT",
    "version": "v1",
    "description": "MFG QM - Entity management for CERT",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.ENT.NC.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "ENT",
    "entity_type": "NC",
    "version": "v1",
    "description": "MFG QM - Entity management for NC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.ENT.CA.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "ENT",
    "entity_type": "CA",
    "version": "v1",
    "description": "MFG QM - Entity management for CA",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.TXN.INSP.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "TXN",
    "entity_type": "INSP",
    "version": "v1",
    "description": "MFG QM - Transaction processing for INSP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.TXN.TEST.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "TXN",
    "entity_type": "TEST",
    "version": "v1",
    "description": "MFG QM - Transaction processing for TEST",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.TXN.CERT.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "TXN",
    "entity_type": "CERT",
    "version": "v1",
    "description": "MFG QM - Transaction processing for CERT",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.TXN.NC.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "TXN",
    "entity_type": "NC",
    "version": "v1",
    "description": "MFG QM - Transaction processing for NC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.TXN.CA.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "TXN",
    "entity_type": "CA",
    "version": "v1",
    "description": "MFG QM - Transaction processing for CA",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.RPT.QUA.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "RPT",
    "entity_type": "QUA",
    "version": "v1",
    "description": "MFG QM - Reporting for QUA",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.RPT.DEF.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "RPT",
    "entity_type": "DEF",
    "version": "v1",
    "description": "MFG QM - Reporting for DEF",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.RPT.CERT.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "RPT",
    "entity_type": "CERT",
    "version": "v1",
    "description": "MFG QM - Reporting for CERT",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.RPT.COST.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "RPT",
    "entity_type": "COST",
    "version": "v1",
    "description": "MFG QM - Reporting for COST",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.MFG.QM.RPT.PERF.v1",
    "module": "MFG",
    "sub_module": "QM",
    "function_type": "RPT",
    "entity_type": "PERF",
    "version": "v1",
    "description": "MFG QM - Reporting for PERF",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.ENT.RFQ.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "ENT",
    "entity_type": "RFQ",
    "version": "v1",
    "description": "PROC SRC - Entity management for RFQ",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.ENT.BID.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "ENT",
    "entity_type": "BID",
    "version": "v1",
    "description": "PROC SRC - Entity management for BID",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.ENT.EVAL.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "ENT",
    "entity_type": "EVAL",
    "version": "v1",
    "description": "PROC SRC - Entity management for EVAL",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.ENT.CONT.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "ENT",
    "entity_type": "CONT",
    "version": "v1",
    "description": "PROC SRC - Entity management for CONT",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.ENT.SUPP.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "ENT",
    "entity_type": "SUPP",
    "version": "v1",
    "description": "PROC SRC - Entity management for SUPP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.TXN.RFQ.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "TXN",
    "entity_type": "RFQ",
    "version": "v1",
    "description": "PROC SRC - Transaction processing for RFQ",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.TXN.BID.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "TXN",
    "entity_type": "BID",
    "version": "v1",
    "description": "PROC SRC - Transaction processing for BID",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.TXN.EVAL.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "TXN",
    "entity_type": "EVAL",
    "version": "v1",
    "description": "PROC SRC - Transaction processing for EVAL",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.TXN.NEGO.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "TXN",
    "entity_type": "NEGO",
    "version": "v1",
    "description": "PROC SRC - Transaction processing for NEGO",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.TXN.AWRD.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "TXN",
    "entity_type": "AWRD",
    "version": "v1",
    "description": "PROC SRC - Transaction processing for AWRD",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.RPT.SRC.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "RPT",
    "entity_type": "SRC",
    "version": "v1",
    "description": "PROC SRC - Reporting for SRC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.RPT.BID.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "RPT",
    "entity_type": "BID",
    "version": "v1",
    "description": "PROC SRC - Reporting for BID",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.RPT.SAVE.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "RPT",
    "entity_type": "SAVE",
    "version": "v1",
    "description": "PROC SRC - Reporting for SAVE",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.RPT.SUPP.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "RPT",
    "entity_type": "SUPP",
    "version": "v1",
    "description": "PROC SRC - Reporting for SUPP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.SRC.RPT.PERF.v1",
    "module": "PROC",
    "sub_module": "SRC",
    "function_type": "RPT",
    "entity_type": "PERF",
    "version": "v1",
    "description": "PROC SRC - Reporting for PERF",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.ENT.REQ.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "ENT",
    "entity_type": "REQ",
    "version": "v1",
    "description": "PROC PUR - Entity management for REQ",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.ENT.PO.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "ENT",
    "entity_type": "PO",
    "version": "v1",
    "description": "PROC PUR - Entity management for PO",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.ENT.SUPP.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "ENT",
    "entity_type": "SUPP",
    "version": "v1",
    "description": "PROC PUR - Entity management for SUPP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.ENT.CAT.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "ENT",
    "entity_type": "CAT",
    "version": "v1",
    "description": "PROC PUR - Entity management for CAT",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.ENT.CONT.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "ENT",
    "entity_type": "CONT",
    "version": "v1",
    "description": "PROC PUR - Entity management for CONT",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.TXN.REQ.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "TXN",
    "entity_type": "REQ",
    "version": "v1",
    "description": "PROC PUR - Transaction processing for REQ",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.TXN.PO.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "TXN",
    "entity_type": "PO",
    "version": "v1",
    "description": "PROC PUR - Transaction processing for PO",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.TXN.GR.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "TXN",
    "entity_type": "GR",
    "version": "v1",
    "description": "PROC PUR - Transaction processing for GR",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.TXN.IR.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "TXN",
    "entity_type": "IR",
    "version": "v1",
    "description": "PROC PUR - Transaction processing for IR",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.TXN.PAY.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "TXN",
    "entity_type": "PAY",
    "version": "v1",
    "description": "PROC PUR - Transaction processing for PAY",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.RPT.SPEND.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "RPT",
    "entity_type": "SPEND",
    "version": "v1",
    "description": "PROC PUR - Reporting for SPEND",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.RPT.SUPP.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "RPT",
    "entity_type": "SUPP",
    "version": "v1",
    "description": "PROC PUR - Reporting for SUPP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.RPT.SAVE.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "RPT",
    "entity_type": "SAVE",
    "version": "v1",
    "description": "PROC PUR - Reporting for SAVE",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.RPT.COMP.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "RPT",
    "entity_type": "COMP",
    "version": "v1",
    "description": "PROC PUR - Reporting for COMP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.PUR.RPT.PERF.v1",
    "module": "PROC",
    "sub_module": "PUR",
    "function_type": "RPT",
    "entity_type": "PERF",
    "version": "v1",
    "description": "PROC PUR - Reporting for PERF",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.ENT.SUPP.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "ENT",
    "entity_type": "SUPP",
    "version": "v1",
    "description": "PROC INV - Entity management for SUPP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.ENT.INV.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "ENT",
    "entity_type": "INV",
    "version": "v1",
    "description": "PROC INV - Entity management for INV",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.ENT.MATCH.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "ENT",
    "entity_type": "MATCH",
    "version": "v1",
    "description": "PROC INV - Entity management for MATCH",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.ENT.PAY.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "ENT",
    "entity_type": "PAY",
    "version": "v1",
    "description": "PROC INV - Entity management for PAY",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.ENT.DISC.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "ENT",
    "entity_type": "DISC",
    "version": "v1",
    "description": "PROC INV - Entity management for DISC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.TXN.REC.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "TXN",
    "entity_type": "REC",
    "version": "v1",
    "description": "PROC INV - Transaction processing for REC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.TXN.MATCH.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "TXN",
    "entity_type": "MATCH",
    "version": "v1",
    "description": "PROC INV - Transaction processing for MATCH",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.TXN.APP.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "TXN",
    "entity_type": "APP",
    "version": "v1",
    "description": "PROC INV - Transaction processing for APP",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.TXN.PAY.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "TXN",
    "entity_type": "PAY",
    "version": "v1",
    "description": "PROC INV - Transaction processing for PAY",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.TXN.DISC.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "TXN",
    "entity_type": "DISC",
    "version": "v1",
    "description": "PROC INV - Transaction processing for DISC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.RPT.PROC.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "RPT",
    "entity_type": "PROC",
    "version": "v1",
    "description": "PROC INV - Reporting for PROC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.RPT.AUTO.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "RPT",
    "entity_type": "AUTO",
    "version": "v1",
    "description": "PROC INV - Reporting for AUTO",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.RPT.EXC.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "RPT",
    "entity_type": "EXC",
    "version": "v1",
    "description": "PROC INV - Reporting for EXC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.RPT.DISC.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "RPT",
    "entity_type": "DISC",
    "version": "v1",
    "description": "PROC INV - Reporting for DISC",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  },
  {
    "smart_code": "HERA.PROC.INV.RPT.TAX.v1",
    "module": "PROC",
    "sub_module": "INV",
    "function_type": "RPT",
    "entity_type": "TAX",
    "version": "v1",
    "description": "PROC INV - Reporting for TAX",
    "generated_at": "2025-10-25T19:14:17.146Z",
    "generated_by": "HERA_ENTERPRISE_SMART_CODE_GENERATOR"
  }
]
