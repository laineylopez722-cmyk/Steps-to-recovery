/**
 * Personal Inventory Types (Tenth Step)
 *
 * Structured nightly inventory based on the AA Tenth Step.
 * All user-generated content is encrypted before storage.
 */

export interface InventoryQuestion {
  id: string;
  text: string;
  category: 'character_defect' | 'positive_action' | 'amends';
}

export interface InventoryAnswer {
  questionId: string;
  answer: boolean;
  note?: string;
}

export interface PersonalInventory {
  id: string;
  userId: string;
  checkDate: string;
  answers: InventoryAnswer[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const INVENTORY_QUESTIONS: InventoryQuestion[] = [
  { id: 'resentful', text: 'Was I resentful today?', category: 'character_defect' },
  { id: 'selfish', text: 'Was I selfish today?', category: 'character_defect' },
  { id: 'dishonest', text: 'Was I dishonest today?', category: 'character_defect' },
  { id: 'afraid', text: 'Was I afraid today?', category: 'character_defect' },
  { id: 'owe_apology', text: 'Do I owe an apology?', category: 'amends' },
  {
    id: 'kept_to_myself',
    text: 'Have I kept something to myself that should be discussed?',
    category: 'character_defect',
  },
  { id: 'kind_loving', text: 'Was I kind and loving toward all?', category: 'positive_action' },
  {
    id: 'good_day',
    text: 'What could I have done better today?',
    category: 'positive_action',
  },
];
