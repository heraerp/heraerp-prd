export const AMPLIFY_CHANNEL_PRESET = {
    entityType: 'AMPLIFY_CHANNEL',
    smartCode: 'HERA.AMPLIFY.CHANNEL.ENTITY.V1',
    label: 'Channels',
    dynamicFields: [
        {
            name: 'kind',
            type: 'text',
            required: true,
            smart_code: 'HERA.AMPLIFY.CHANNEL.DYN.KIND.V1',
            ui: {
                widget: 'select',
                options: [
                    'medium',
                    'wordpress',
                    'substack',
                    'x',
                    'linkedin',
                    'instagram',
                    'tiktok',
                    'youtube_shorts'
                ]
            }
        },
        {
            name: 'auth',
            type: 'json', // token/keys (store securely—use vault at runtime)
            smart_code: 'HERA.AMPLIFY.CHANNEL.DYN.AUTH.V1',
            ui: {
                visible: (role) => ['owner', 'manager'].includes(role)
            }
        },
        {
            name: 'rules',
            type: 'json', // platform limits, cadence windows
            smart_code: 'HERA.AMPLIFY.CHANNEL.DYN.RULES.V1'
        }
    ]
};
