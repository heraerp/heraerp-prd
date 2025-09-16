export interface QuestionnaireTemplate {
  id: string
  name: string
  sections: any[]
}

export interface QuestionnaireSession {
  id: string
  templateId: string
  responses: any[]
}

export interface SessionAPI {
  saveProgress: (data: any) => Promise<void>
  loadSession: (id: string) => Promise<QuestionnaireSession>
}

export function createReadinessTemplate(): QuestionnaireTemplate {
  return {
    id: '1',
    name: 'Readiness Assessment',
    sections: []
  }
}
EOF < /dev/null