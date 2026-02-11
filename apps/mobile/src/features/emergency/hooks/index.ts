/**
 * Safe Dial Protection Hooks
 *
 * Barrel export for all emergency hooks
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

export { useSOSActions } from './useSOSActions';
