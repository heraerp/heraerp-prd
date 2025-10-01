// src/ui/index.ts
export * from './HeraProvider';
export * from './hooks/useHera';
export * from './hooks/useFormSpec';
export * from './components/DataTable';
export * from './components/FilterBar';
export * from './components/ObjectHeader';
export * from './components/CardKpi';
export * from './components/LinesTable';
export * from './components/RelatedPanel';
export * from './components/WizardForm';
export * from './components/LinesEditor';
export * from './theme';

// Re-export specific hooks for clarity
export { 
  useEntities, 
  useEntity,
  useCreateEntity, 
  useUpdateEntity, 
  useDeleteEntity,
  useTransactions,
  useTransaction,
  useCreateTransaction,
  useDynamicFields,
  useSetDynamicField,
  useRelationships
} from './hooks/useHera';