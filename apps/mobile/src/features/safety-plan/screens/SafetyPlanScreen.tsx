/**
 * Safety Plan Screen
 *
 * Multi-step wizard (7 steps) based on the VA/Stanley-Brown Safety Plan model.
 * If a plan already exists, shows the read-only summary with an Edit button.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '../../../design-system/components/Text';
import { Button } from '../../../design-system/components/Button';
import { ProgressBar } from '../../../design-system/components/ProgressBar';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';
import { useSafetyPlan, useSaveSafetyPlan } from '../hooks/useSafetyPlan';
import { SafetyPlanStepView } from '../components/SafetyPlanStepView';
import { SafetyPlanSummary } from '../components/SafetyPlanSummary';
import { SAFETY_PLAN_STEPS } from '../types';
import type { SafetyContact } from '../types';

const TOTAL_STEPS = SAFETY_PLAN_STEPS.length;

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    progressContainer: {
      paddingHorizontal: ds.space[4],
      paddingTop: ds.space[3],
      paddingBottom: ds.space[2],
    },
    stepLabel: {
      textAlign: 'center' as const,
      marginBottom: ds.space[2],
    },
    navigationRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[3],
      gap: ds.space[3],
    },
    navButton: {
      flex: 1,
      minHeight: 48,
    },
    content: {
      flex: 1,
    },
  }) as const;

interface SafetyPlanScreenProps {
  userId: string;
}

export function SafetyPlanScreen({ userId: propUserId }: SafetyPlanScreenProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { user } = useAuth();
  const userId = propUserId || user?.id || '';

  const { plan, isLoading } = useSafetyPlan(userId);
  const { savePlan, isPending } = useSaveSafetyPlan(userId);

  const [isEditing, setIsEditing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Editable state for each step
  const [warningSigns, setWarningSigns] = useState<string[]>(['']);
  const [copingStrategies, setCopingStrategies] = useState<string[]>(['']);
  const [distractionPeople, setDistractionPeople] = useState<string[]>(['']);
  const [supportContacts, setSupportContacts] = useState<SafetyContact[]>([
    { name: '', phone: '', relationship: '' },
  ]);
  const [professionalContacts, setProfessionalContacts] = useState<SafetyContact[]>([
    { name: '', phone: '', relationship: '' },
  ]);
  const [safeEnvironment, setSafeEnvironment] = useState<string[]>(['']);
  const [reasonsToLive, setReasonsToLive] = useState<string[]>(['']);

  const populateFromPlan = useCallback(() => {
    if (!plan) return;
    setWarningSigns(plan.warningSigns.length > 0 ? plan.warningSigns : ['']);
    setCopingStrategies(plan.copingStrategies.length > 0 ? plan.copingStrategies : ['']);
    setDistractionPeople(plan.distractionPeople.length > 0 ? plan.distractionPeople : ['']);
    setSupportContacts(
      plan.supportContacts.length > 0
        ? plan.supportContacts
        : [{ name: '', phone: '', relationship: '' }],
    );
    setProfessionalContacts(
      plan.professionalContacts.length > 0
        ? plan.professionalContacts
        : [{ name: '', phone: '', relationship: '' }],
    );
    setSafeEnvironment(plan.safeEnvironment.length > 0 ? plan.safeEnvironment : ['']);
    setReasonsToLive(plan.reasonsToLive.length > 0 ? plan.reasonsToLive : ['']);
  }, [plan]);

  const handleEdit = useCallback(() => {
    populateFromPlan();
    setCurrentStep(0);
    setIsEditing(true);
  }, [populateFromPlan]);

  const handleStartNew = useCallback(() => {
    setCurrentStep(0);
    setIsEditing(true);
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const filterNonEmpty = useCallback((items: string[]): string[] => {
    return items.filter((item) => item.trim().length > 0);
  }, []);

  const filterNonEmptyContacts = useCallback((contacts: SafetyContact[]): SafetyContact[] => {
    return contacts.filter((c) => c.name.trim().length > 0 || c.phone.trim().length > 0);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await savePlan({
        warningSigns: filterNonEmpty(warningSigns),
        copingStrategies: filterNonEmpty(copingStrategies),
        distractionPeople: filterNonEmpty(distractionPeople),
        supportContacts: filterNonEmptyContacts(supportContacts),
        professionalContacts: filterNonEmptyContacts(professionalContacts),
        safeEnvironment: filterNonEmpty(safeEnvironment),
        reasonsToLive: filterNonEmpty(reasonsToLive),
      });
      setIsEditing(false);
    } catch (err) {
      logger.error('Failed to save safety plan', err);
    }
  }, [
    savePlan,
    warningSigns,
    copingStrategies,
    distractionPeople,
    supportContacts,
    professionalContacts,
    safeEnvironment,
    reasonsToLive,
    filterNonEmpty,
    filterNonEmptyContacts,
  ]);

  const stepConfig = useMemo(
    () => SAFETY_PLAN_STEPS[currentStep],
    [currentStep],
  );

  const progress = useMemo(
    () => (currentStep + 1) / TOTAL_STEPS,
    [currentStep],
  );

  const currentItems = useMemo((): string[] => {
    switch (currentStep) {
      case 0:
        return warningSigns;
      case 1:
        return copingStrategies;
      case 2:
        return distractionPeople;
      case 5:
        return safeEnvironment;
      case 6:
        return reasonsToLive;
      default:
        return [];
    }
  }, [currentStep, warningSigns, copingStrategies, distractionPeople, safeEnvironment, reasonsToLive]);

  const currentContacts = useMemo((): SafetyContact[] | undefined => {
    switch (currentStep) {
      case 3:
        return supportContacts;
      case 4:
        return professionalContacts;
      default:
        return undefined;
    }
  }, [currentStep, supportContacts, professionalContacts]);

  const handleItemsChange = useCallback(
    (items: string[]) => {
      switch (currentStep) {
        case 0:
          setWarningSigns(items);
          break;
        case 1:
          setCopingStrategies(items);
          break;
        case 2:
          setDistractionPeople(items);
          break;
        case 5:
          setSafeEnvironment(items);
          break;
        case 6:
          setReasonsToLive(items);
          break;
      }
    },
    [currentStep],
  );

  const handleContactsChange = useCallback(
    (contacts: SafetyContact[]) => {
      switch (currentStep) {
        case 3:
          setSupportContacts(contacts);
          break;
        case 4:
          setProfessionalContacts(contacts);
          break;
      }
    },
    [currentStep],
  );

  const isContactStep = currentStep === 3 || currentStep === 4;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={ds.colors.accent} />
        <Text variant="body" color="textSecondary">
          Loading safety plan...
        </Text>
      </View>
    );
  }

  // Show summary if plan exists and not editing
  if (plan && !isEditing) {
    return (
      <View style={styles.container}>
        <SafetyPlanSummary plan={plan} onEdit={handleEdit} />
      </View>
    );
  }

  // Show create prompt if no plan exists and not editing
  if (!plan && !isEditing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text variant="h2" align="center">
          Safety Plan
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          Create your personalized safety plan based on the Stanley-Brown model.
        </Text>
        <Button
          variant="primary"
          title="Create Safety Plan"
          onPress={handleStartNew}
          accessibilityLabel="Create safety plan"
          accessibilityRole="button"
        />
      </View>
    );
  }

  // Wizard view
  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text
          variant="caption"
          color="textSecondary"
          style={styles.stepLabel}
          accessibilityLabel={`Step ${currentStep + 1} of ${TOTAL_STEPS}`}
          accessibilityRole="text"
        >
          Step {currentStep + 1} of {TOTAL_STEPS}
        </Text>
        <ProgressBar
          progress={progress}
          accessibilityLabel={`Step ${currentStep + 1} of ${TOTAL_STEPS}`}
          accessibilityRole="progressbar"
        />
      </View>

      <View style={styles.content}>
        <SafetyPlanStepView
          step={stepConfig}
          items={currentItems}
          contacts={currentContacts}
          onItemsChange={handleItemsChange}
          onContactsChange={handleContactsChange}
          isContactStep={isContactStep}
        />
      </View>

      <View style={styles.navigationRow}>
        <Button
          variant="outline"
          title="Back"
          onPress={handleBack}
          disabled={currentStep === 0}
          style={styles.navButton}
          accessibilityLabel="Go to previous step"
          accessibilityRole="button"
          accessibilityState={{ disabled: currentStep === 0 }}
        />
        {isLastStep ? (
          <Button
            variant="primary"
            title="Save Plan"
            onPress={handleSave}
            loading={isPending}
            disabled={isPending}
            style={styles.navButton}
            accessibilityLabel="Save safety plan"
            accessibilityRole="button"
            accessibilityState={{ disabled: isPending }}
          />
        ) : (
          <Button
            variant="primary"
            title="Next"
            onPress={handleNext}
            style={styles.navButton}
            accessibilityLabel="Go to next step"
            accessibilityRole="button"
          />
        )}
      </View>
    </View>
  );
}
