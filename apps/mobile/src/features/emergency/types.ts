/**
 * Emergency Feature Types
 *
 * Types for SOS quick actions and emergency functionality.
 */

export interface SOSAction {
  id: string;
  label: string;
  icon: string;
  type: 'call' | 'navigate' | 'action';
  target: string;
  priority: number;
}

export const DEFAULT_SOS_ACTIONS: SOSAction[] = [
  {
    id: 'call-sponsor',
    label: 'Call Sponsor',
    icon: 'phone',
    type: 'call',
    target: 'sponsor',
    priority: 1,
  },
  {
    id: 'call-hotline',
    label: 'Crisis Hotline',
    icon: 'phone-alert',
    type: 'call',
    target: '988',
    priority: 2,
  },
  {
    id: 'breathing',
    label: 'Breathing Exercise',
    icon: 'lungs',
    type: 'navigate',
    target: 'CravingSurf',
    priority: 3,
  },
  {
    id: 'safety-plan',
    label: 'Safety Plan',
    icon: 'shield-check',
    type: 'navigate',
    target: 'Emergency',
    priority: 4,
  },
  {
    id: 'call-samhsa',
    label: 'SAMHSA Helpline',
    icon: 'hospital',
    type: 'call',
    target: '1-800-662-4357',
    priority: 5,
  },
  {
    id: 'journal',
    label: 'Write It Out',
    icon: 'pencil',
    type: 'navigate',
    target: 'JournalEditor',
    priority: 6,
  },
];
