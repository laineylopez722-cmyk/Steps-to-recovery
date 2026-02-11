/**
 * AccessibleWrapper Component
 *
 * HOC that wraps components with accessibility features:
 * - Auto-generates accessibilityLabel if not provided
 * - Handles focus management
 * - Announces state changes to screen reader
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AccessibleWrapper label="Save button">
 *   <Button onPress={handleSave}>Save</Button>
 * </AccessibleWrapper>
 *
 * // With state announcement
 * <AccessibleWrapper
 *   label="Journal entry"
 *   announceChanges
 *   state={isSaved ? 'Saved' : 'Unsaved'}
 * >
 *   <TextInput value={text} />
 * </AccessibleWrapper>
 *
 * // With focus management
 * <AccessibleWrapper
 *   label="Error message"
 *   autoFocus
 *   focusPriority="high"
 * >
 *   <ErrorText>{error}</ErrorText>
 * </AccessibleWrapper>
 * ```
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  AccessibilityInfo,
  findNodeHandle,
  type ViewProps,
  type AccessibilityProps,
  type AccessibilityState,
  type AccessibilityRole,
  type AccessibilityActionEvent,
} from 'react-native';
import { useA11yAnnouncer } from '../hooks/useA11yAnnouncer';

// ============================================================================
// TYPES
// ============================================================================

/** Props for AccessibleWrapper */
export interface AccessibleWrapperProps extends Omit<ViewProps, 'role'> {
  /** Children to wrap */
  children: React.ReactNode;
  /** Accessibility label (auto-generated if not provided) */
  label?: string;
  /** Accessibility hint */
  hint?: string;
  /** Accessibility role */
  role?: AccessibilityRole;
  /** Accessibility state */
  state?: AccessibilityState;
  /** Current state value to announce */
  stateValue?: string;
  /** Whether to announce state changes */
  announceChanges?: boolean;
  /** Auto-focus when component mounts */
  autoFocus?: boolean;
  /** Focus priority (affects delay) */
  focusPriority?: 'low' | 'normal' | 'high' | 'critical';
  /** Whether the element is busy */
  busy?: boolean;
  /** Custom action handler */
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
  /** Actions supported by this component */
  accessibilityActions?: AccessibilityProps['accessibilityActions'];
  /** Whether to live region announce changes */
  liveRegion?: 'none' | 'polite' | 'assertive';
  /** Test ID for testing */
  testID?: string;
}

/** Auto-label generation options */
interface AutoLabelOptions {
  /** Child element to extract text from */
  child: React.ReactElement;
  /** Role for context */
  role?: AccessibilityRole;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract text content from React children for auto-labeling
 */
function extractTextContent(element: React.ReactNode): string {
  if (typeof element === 'string') {
    return element;
  }

  if (typeof element === 'number') {
    return String(element);
  }

  if (!element || typeof element !== 'object') {
    return '';
  }

  if ('props' in element) {
    const elProps = (element as React.ReactElement<Record<string, unknown>>).props;
    // Check for common text props
    if (elProps.children) {
      if (typeof elProps.children === 'string') {
        return elProps.children;
      }
      if (Array.isArray(elProps.children)) {
        return elProps.children.map(extractTextContent).join(' ');
      }
      return extractTextContent(elProps.children as React.ReactNode);
    }

    // Check for label/title/accessibilityLabel props
    if (elProps.accessibilityLabel) {
      return elProps.accessibilityLabel as string;
    }
    if (elProps.label) {
      return elProps.label as string;
    }
    if (elProps.title) {
      return elProps.title as string;
    }
    if (elProps.placeholder) {
      return elProps.placeholder as string;
    }
  }

  return '';
}

/**
 * Generate accessibility label from child content
 */
function generateAutoLabel({ child, role }: AutoLabelOptions): string {
  const textContent = extractTextContent(child);

  if (textContent) {
    // Add role context if available
    if (role) {
      const roleLabels: Record<string, string> = {
        button: 'button',
        link: 'link',
        header: 'heading',
        image: 'image',
        text: 'text',
        search: 'search field',
        switch: 'switch',
        checkbox: 'checkbox',
        radio: 'radio button',
        menu: 'menu',
        menuitem: 'menu item',
        progressbar: 'progress',
        adjustable: 'adjustable',
      };

      const roleLabel = roleLabels[role];
      if (roleLabel && !textContent.toLowerCase().includes(roleLabel)) {
        return `${textContent}, ${roleLabel}`;
      }
    }

    return textContent;
  }

  // Fallback labels based on role
  const fallbackLabels: Record<string, string> = {
    button: 'Button',
    link: 'Link',
    header: 'Header',
    image: 'Image',
    search: 'Search field',
    switch: 'Switch',
    checkbox: 'Checkbox',
    radio: 'Radio button',
  };

  return fallbackLabels[role || ''] || 'Interactive element';
}

/**
 * Get focus delay based on priority
 */
function getFocusDelay(priority: AccessibleWrapperProps['focusPriority']): number {
  switch (priority) {
    case 'critical':
      return 0;
    case 'high':
      return 100;
    case 'low':
      return 500;
    default:
      return 250;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AccessibleWrapper - Wraps components with comprehensive accessibility features
 */
export function AccessibleWrapper({
  children,
  label,
  hint,
  role,
  state,
  stateValue,
  announceChanges = false,
  autoFocus = false,
  focusPriority = 'normal',
  busy = false,
  onAccessibilityAction,
  accessibilityActions,
  liveRegion,
  testID,
  style,
  ...viewProps
}: AccessibleWrapperProps): React.ReactElement {
  const viewRef = useRef<View>(null);
  const { announce } = useA11yAnnouncer();
  const prevStateValueRef = useRef(stateValue);
  const [generatedLabel, setGeneratedLabel] = useState<string>('');

  // Generate auto-label on mount
  useEffect(() => {
    if (!label) {
      const child = React.Children.only(children) as React.ReactElement;
      const autoLabel = generateAutoLabel({ child, role });
      setGeneratedLabel(autoLabel);
    }
  }, [label, children, role]);

  // Handle auto-focus
  useEffect(() => {
    if (!autoFocus) return;

    const delay = getFocusDelay(focusPriority);
    const timer = setTimeout(() => {
      if (viewRef.current) {
        const node = findNodeHandle(viewRef.current);
        if (node) {
          AccessibilityInfo.setAccessibilityFocus(node);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [autoFocus, focusPriority]);

  // Announce state changes
  useEffect(() => {
    if (!announceChanges || !stateValue) return;
    if (stateValue !== prevStateValueRef.current) {
      const message = generatedLabel || label
        ? `${generatedLabel || label}: ${stateValue}`
        : stateValue;
      announce(message, { priority: 'normal' });
      prevStateValueRef.current = stateValue;
    }
  }, [stateValue, announceChanges, announce, label, generatedLabel]);

  // Handle accessibility actions
  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      onAccessibilityAction?.(event);
    },
    [onAccessibilityAction]
  );

  const accessibilityLabel = label || generatedLabel || undefined;

  return (
    <View
      ref={viewRef}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={hint}
      accessibilityRole={role}
      accessibilityState={{ ...state, busy }}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={handleAccessibilityAction}
      accessibilityLiveRegion={liveRegion}
      testID={testID}
      style={style}
      {...viewProps}
    >
      {children}
    </View>
  );
}

// ============================================================================
// HIGHER-ORDER COMPONENT
// ============================================================================

/**
 * HOC to make any component accessible
 * @param Component - Component to wrap
 * @param defaultProps - Default accessibility props
 * @returns Wrapped component with accessibility features
 *
 * @example
 * ```tsx
 * const AccessibleButton = withAccessibility(Button, {
 *   role: 'button',
 *   announceChanges: true,
 * });
 *
 * <AccessibleButton onPress={handlePress}>
 *   Save
 * </AccessibleButton>
 * ```
 */
export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>,
  defaultProps: Partial<AccessibleWrapperProps> = {}
): React.FC<P & AccessibleWrapperProps> {
  return function AccessibleComponent(props: P & AccessibleWrapperProps) {
    const { children, ...componentProps } = props;
    const mergedProps = { ...defaultProps, ...props };

    return (
      <AccessibleWrapper {...mergedProps}>
        <Component {...(componentProps as P)}>{children}</Component>
      </AccessibleWrapper>
    );
  };
}

// ============================================================================
// SPECIALIZED WRAPPERS
// ============================================================================

/** Accessible button wrapper */
export function AccessibleButton({
  children,
  label,
  ...props
}: Omit<AccessibleWrapperProps, 'role'>): React.ReactElement {
  return (
    <AccessibleWrapper role="button" label={label} {...props}>
      {children}
    </AccessibleWrapper>
  );
}

/** Accessible text input wrapper */
export function AccessibleInput({
  children,
  label,
  announceChanges = true,
  ...props
}: Omit<AccessibleWrapperProps, 'role'>): React.ReactElement {
  return (
    <AccessibleWrapper
      role="text"
      label={label}
      announceChanges={announceChanges}
      liveRegion="polite"
      {...props}
    >
      {children}
    </AccessibleWrapper>
  );
}

/** Accessible header wrapper */
export function AccessibleHeader({
  children,
  label,
  ...props
}: Omit<AccessibleWrapperProps, 'role'>): React.ReactElement {
  return (
    <AccessibleWrapper role="header" label={label} {...props}>
      {children}
    </AccessibleWrapper>
  );
}

/** Accessible image wrapper */
export function AccessibleImage({
  children,
  label,
  ...props
}: Omit<AccessibleWrapperProps, 'role'>): React.ReactElement {
  return (
    <AccessibleWrapper
      role="image"
      label={label || 'Image'}
      {...props}
    >
      {children}
    </AccessibleWrapper>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AccessibleWrapper;
