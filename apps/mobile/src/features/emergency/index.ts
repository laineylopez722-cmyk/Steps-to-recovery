/**
 * Emergency Feature
 *
 * SOS quick actions, safe dial protection, and crisis resources.
 */

// Types
export { type SOSAction, DEFAULT_SOS_ACTIONS } from './types';

// Hooks
export { useSOSActions } from './hooks/useSOSActions';
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
} from './hooks';

// Components
export { SOSOverlay } from './components/SOSOverlay';
export { RiskyContactCard } from './components/RiskyContactCard';
export { CloseCallInsights } from './components/CloseCallInsights';
export { AddRiskyContactModal } from './components/AddRiskyContactModal';
