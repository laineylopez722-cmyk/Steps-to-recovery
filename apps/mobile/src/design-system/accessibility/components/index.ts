/**
 * Accessibility Components
 *
 * React components for building accessible UIs.
 *
 * @example
 * ```tsx
 * import { AccessibleWrapper, EmergencyButton } from '@/design-system/accessibility/components';
 *
 * <AccessibleWrapper label="Save button">
 *   <Button>Save</Button>
 * </AccessibleWrapper>
 *
 * <EmergencyButton label="Get help" onPress={handleEmergency}>
 *   Get Help Now
 * </EmergencyButton>
 * ```
 */

// Accessible wrapper
export {
  AccessibleWrapper,
  withAccessibility,
  AccessibleButton,
  AccessibleInput,
  AccessibleHeader,
  AccessibleImage,
  type AccessibleWrapperProps,
} from './AccessibleWrapper';

// Emergency components
export {
  EmergencyButton,
  EmergencyCard,
  EmergencyText,
  EmergencyContainer,
  useEmergencyAnnouncer,
  type EmergencyButtonProps,
  type EmergencyCardProps,
  type EmergencyTextProps,
  type EmergencyContainerProps,
} from './EmergencyAccessibility';


