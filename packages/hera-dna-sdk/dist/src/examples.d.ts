/**
 * HERA DNA SDK Examples
 * Smart code examples for reference
 */
export declare const SMART_CODE_EXAMPLES: {
    readonly CRM: {
        readonly CUSTOMER_CREATE: "HERA.CRM.CUST.ENT.PROF.v1";
        readonly LEAD_CREATE: "HERA.CRM.LEAD.ENT.PROSPECT.v1";
        readonly SALE_ORDER: "HERA.CRM.SALE.TXN.ORDER.v1";
        readonly CUSTOMER_DYNAMIC_CREDIT: "HERA.CRM.CUST.DYN.CREDIT.v1";
        readonly CUSTOMER_DYNAMIC_TERMS: "HERA.CRM.CUST.DYN.TERMS.v1";
    };
    readonly FIN: {
        readonly GL_ACCOUNT_ASSET: "HERA.FIN.GL.ACC.ASSET.v1";
        readonly GL_ACCOUNT_LIABILITY: "HERA.FIN.GL.ACC.LIABILITY.v1";
        readonly JOURNAL_ENTRY: "HERA.FIN.GL.TXN.JOURNAL.v1";
        readonly INVOICE_CREATE: "HERA.FIN.AR.TXN.INVOICE.v1";
        readonly PAYMENT_RECEIVE: "HERA.FIN.AR.TXN.RCP.v1";
    };
    readonly HR: {
        readonly EMPLOYEE_CREATE: "HERA.HR.EMP.ENT.STAFF.v1";
        readonly PAYROLL_RUN: "HERA.HR.PAYROLL.TXN.RUN.v1";
        readonly LEAVE_REQUEST: "HERA.HR.LEAVE.TXN.REQUEST.v1";
        readonly EMPLOYEE_DYNAMIC_SALARY: "HERA.HR.EMP.DYN.SALARY.v1";
    };
    readonly WHATSAPP: {
        readonly THREAD_CREATE: "HERA.WHATSAPP.INBOX.THREAD.v1";
        readonly MESSAGE_TEXT: "HERA.WHATSAPP.MESSAGE.TEXT.v1";
        readonly MESSAGE_MEDIA: "HERA.WHATSAPP.MESSAGE.MEDIA.v1";
        readonly TEMPLATE_REGISTER: "HERA.WHATSAPP.TEMPLATE.REGISTER.v1";
        readonly CAMPAIGN_CREATE: "HERA.WHATSAPP.CAMPAIGN.OUTBOUND.v1";
    };
    readonly WORKFLOW: {
        readonly STATUS_ASSIGN: "HERA.WORKFLOW.STATUS.ASSIGN.v1";
        readonly STATUS_DRAFT: "HERA.WORKFLOW.STATUS.DRAFT.v1";
        readonly STATUS_PENDING: "HERA.WORKFLOW.STATUS.PENDING.v1";
        readonly STATUS_APPROVED: "HERA.WORKFLOW.STATUS.APPROVED.v1";
        readonly STATUS_REJECTED: "HERA.WORKFLOW.STATUS.REJECTED.v1";
    };
};
export type SmartCodeExampleCategory = keyof typeof SMART_CODE_EXAMPLES;
//# sourceMappingURL=examples.d.ts.map