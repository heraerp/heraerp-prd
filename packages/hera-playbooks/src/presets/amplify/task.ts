import { EntityPreset } from '../../types/preset'

export const AMPLIFY_TASK_PRESET: EntityPreset = {
  entityType: 'AMPLIFY_TASK',
  smartCode: 'HERA.AMPLIFY.TASK.ENTITY.V1',
  label: 'Tasks',
  labels: {
    singular: 'Task',
    plural: 'Tasks'
  },
  dynamicFields: [
    {
      name: 'kind',
      type: 'text',
      required: true,
      smart_code: 'HERA.AMPLIFY.TASK.DYN.KIND.V1',
      ui: {
        widget: 'select',
        options: [
          'ingestion',
          'optimize',
          'publish',
          'amplify',
          'analytics',
          'refresh'
        ]
      }
    },
    {
      name: 'status',
      type: 'text',
      required: true,
      smart_code: 'HERA.AMPLIFY.TASK.DYN.STATUS.V1',
      ui: {
        widget: 'badge',
        options: ['created', 'assigned', 'running', 'done', 'failed']
      }
    },
    {
      name: 'assignee',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.TASK.DYN.ASSIGNEE.V1'
    },
    {
      name: 'trace',
      type: 'json',
      smart_code: 'HERA.AMPLIFY.TASK.DYN.TRACE.V1'
    }
  ]
} as const