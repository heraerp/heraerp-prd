export const AMPLIFY_LIFECYCLE_PLAYBOOK = {
    code: 'HERA.AMPLIFY.PLAYBOOK.LIFECYCLE.V1',
    name: 'Amplify Content Lifecycle',
    description: 'Automated content amplification workflow',
    steps: [
        {
            code: 'INGEST',
            name: 'Content Ingestion',
            kind: 'ingestion',
            policy: 'auto',
            input: ['topic|draft|article'],
            produces: ['AMPLIFY_CONTENT'],
            description: 'Ingest content from various sources'
        },
        {
            code: 'OPTIMIZE',
            name: 'SEO Optimization',
            kind: 'optimize',
            policy: 'auto',
            input: ['AMPLIFY_CONTENT'],
            updates: ['seo_title', 'meta_description', 'keywords', 'schema_jsonld', 'internal_links', 'external_links'],
            description: 'Optimize content for search engines'
        },
        {
            code: 'PUBLISH',
            name: 'Publish to Platforms',
            kind: 'publish',
            policy: 'auto',
            input: ['AMPLIFY_CONTENT', 'AMPLIFY_CHANNEL(kind=medium|wordpress|substack)'],
            produces: ['AMPLIFY_PUBLICATION'],
            link: 'CONTENT_PUBLISHED_AS',
            description: 'Publish content to blog platforms'
        },
        {
            code: 'AMPLIFY',
            name: 'Social Amplification',
            kind: 'social',
            policy: 'auto',
            input: ['AMPLIFY_CONTENT', 'AMPLIFY_CHANNEL(kind in social)'],
            produces: ['AMPLIFY_SOCIAL_POST[]'],
            link: 'CONTENT_TO_SOCIAL_POST',
            description: 'Generate social media posts'
        },
        {
            code: 'SCHEDULE',
            name: 'Schedule Posts',
            kind: 'schedule',
            policy: 'auto',
            input: ['AMPLIFY_SOCIAL_POST[]'],
            effect: 'set(schedule_at)',
            description: 'Schedule social media posts'
        },
        {
            code: 'COLLECT',
            name: 'Collect Analytics',
            kind: 'analytics',
            policy: 'cron',
            produces: ['AMPLIFY_ANALYTIC_EVENT[]'],
            link: 'POST_TO_ANALYTIC',
            description: 'Collect performance metrics'
        },
        {
            code: 'EVALUATE',
            name: 'Evaluate Performance',
            kind: 'review',
            policy: 'auto',
            input: ['AMPLIFY_ANALYTIC_EVENT[]'],
            effect: 'if underperform → queue REFRESH',
            description: 'Analyze performance and trigger optimization'
        },
        {
            code: 'REFRESH',
            name: 'Content Refresh',
            kind: 'optimize',
            policy: 'queued',
            description: 'Refresh underperforming content'
        }
    ]
};
