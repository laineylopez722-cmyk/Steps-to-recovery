/**
 * Safe Dial Protection Hooks
 *
 * Barrel export for all safe dial hooks
 */

export {
  useRiskyContacts,
  useCheckRiskyContact,
  useCloseCallTracking,
  type UseRiskyContactsReturn,
  type UseCheckRiskyContactReturn,
  type UseCloseCallTrackingReturn,
  type RiskyContact,
  type CloseCall,
  type CloseCallStats,
  type AddRiskyContactParams,
  type LogCloseCallParams,
  type ActionTaken,
  type RelationshipType,
} from './useSafeDialProtection';
