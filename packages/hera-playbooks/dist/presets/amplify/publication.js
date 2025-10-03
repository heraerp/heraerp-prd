export const AMPLIFY_PUBLICATION_PRESET = {
    entityType: 'AMPLIFY_PUBLICATION',
    smartCode: 'HERA.AMPLIFY.PUBLICATION.ENTITY.V1',
    label: 'Publications',
    dynamicFields: [
        {
            name: 'channel',
            type: 'text',
            required: true,
            smart_code: 'HERA.AMPLIFY.PUBLICATION.DYN.CHANNEL.V1',
            ui: {
                widget: 'select',
                options: ['medium', 'wordpress', 'substack']
            }
        },
        {
            name: 'publish_id',
            type: 'text',
            smart_code: 'HERA.AMPLIFY.PUBLICATION.DYN.PUBLISH_ID.V1'
        },
        {
            name: 'url',
            type: 'text',
            smart_code: 'HERA.AMPLIFY.PUBLICATION.DYN.URL.V1'
        },
        {
            name: 'published_at',
            type: 'date',
            smart_code: 'HERA.AMPLIFY.PUBLICATION.DYN.PUBLISHED_AT.V1'
        }
    ]
};
