import { validate, enforce, branch, post, tx, audit } from '../core/dsl';
export const GRADING_JOB_PLAYBOOK_V1 = {
    id: 'HERA.JEWELRY.GRADING.PLAYBOOK.v1',
    entityType: 'GRADING_JOB',
    version: 'v1',
    steps: [
        validate('required:status', (ctx) => {
            const st = ctx.util.getDynamic('status');
            if (!st)
                throw new Error('status is required');
        }),
        enforce('normalize:status', (ctx) => {
            const st = String(ctx.util.getDynamic('status')).toLowerCase();
            ctx.util.setDynamic('status', st, {
                smartCode: 'HERA.JEWELRY.GRADING.DYN.STATUS.v1',
                type: 'text',
            });
        }),
        branch('when:graded_issue_certificate', (ctx) => ctx.util.getDynamic('status') === 'graded' && !!ctx.entity.payload?.metadata?.issue_certificate, [
            tx('tx:issue-cert', [
                post('persist:cert', async (ctx) => {
                    // Create certificate entity
                    ctx.out.headers = {
                        entity_type: 'CERTIFICATE',
                        entity_name: `CERT ${ctx.util.getDynamic('certificate_number') ?? ''}`,
                        smart_code: 'HERA.JEWELRY.CERTIFICATE.ENTITY.DOC.v1',
                    };
                    // Persist immediately to get the certificate ID
                    await ctx.util.persist();
                    // Add certificate details
                    ctx.util.setDynamic('cert_number', ctx.util.getDynamic('certificate_number') ?? '', {
                        smartCode: 'HERA.JEWELRY.CERTIFICATE.DYN.NUMBER.v1',
                        type: 'text',
                    });
                }),
                post('link:job->cert', async (ctx) => {
                    const certId = ctx.state.createdCertificateId; // set by adapter after persist
                    if (certId) {
                        ctx.out.relationships ??= [];
                        ctx.out.relationships.push({
                            type: 'ISSUES_CERT',
                            from: ctx.entity.id,
                            to: certId,
                            smartCode: 'HERA.JEWELRY.GRADING.REL.ISSUES_CERT.v1',
                        });
                    }
                }),
            ]),
        ], []),
        audit('audit:grading_job_upserted', (ctx) => {
            ctx.util.log('grading_job_upserted', {
                status: ctx.util.getDynamic('status'),
                jobId: ctx.entity.id,
            });
        }),
    ],
};
