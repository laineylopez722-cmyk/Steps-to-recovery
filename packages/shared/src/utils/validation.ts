/**
 * Validation Utilities
 *
 * Provides validation functions for user inputs to ensure data integrity
 * and prevent invalid data from being stored.
 */

import type { MeetingType, MeetingConnectionMode } from '../types';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate meeting creation/update data
 */
export function validateMeetingData(data: {
  name?: string;
  location?: string;
  type: MeetingType;
  moodBefore: number;
  moodAfter: number;
  keyTakeaways: string;
  topicTags: string[];
  attendedAt?: Date;
  whatILearned?: string;
  quoteHeard?: string;
  connectionsMode?: MeetingConnectionMode[];
  connectionNotes?: string;
  didShare?: boolean;
  shareReflection?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validate mood ratings (1-10 scale)
  if (data.moodBefore < 1 || data.moodBefore > 10) {
    errors.push('Mood before meeting must be between 1 and 10');
  }
  if (data.moodAfter < 1 || data.moodAfter > 10) {
    errors.push('Mood after meeting must be between 1 and 10');
  }

  // Validate required fields
  if (!data.keyTakeaways.trim()) {
    errors.push('Key takeaways cannot be empty');
  }

  // Validate string lengths
  if (data.keyTakeaways.length > 5000) {
    errors.push('Key takeaways cannot exceed 5000 characters');
  }
  if (data.whatILearned && data.whatILearned.length > 5000) {
    errors.push('What I learned cannot exceed 5000 characters');
  }
  if (data.quoteHeard && data.quoteHeard.length > 1000) {
    errors.push('Quote heard cannot exceed 1000 characters');
  }
  if (data.connectionNotes && data.connectionNotes.length > 5000) {
    errors.push('Connection notes cannot exceed 5000 characters');
  }
  if (data.shareReflection && data.shareReflection.length > 5000) {
    errors.push('Share reflection cannot exceed 5000 characters');
  }

  // Validate name and location lengths
  if (data.name && data.name.length > 100) {
    errors.push('Meeting name cannot exceed 100 characters');
  }
  if (data.location && data.location.length > 200) {
    errors.push('Meeting location cannot exceed 200 characters');
  }

  // Validate topic tags
  if (data.topicTags.length > 10) {
    errors.push('Cannot have more than 10 topic tags');
  }
  for (const tag of data.topicTags) {
    if (tag.length > 50) {
      errors.push('Topic tags cannot exceed 50 characters each');
    }
  }

  // Validate connections mode
  if (data.connectionsMode && data.connectionsMode.length > 10) {
    errors.push('Cannot have more than 10 connection modes');
  }

  // Validate attended date is not in future
  if (data.attendedAt && data.attendedAt > new Date()) {
    errors.push('Meeting attendance date cannot be in the future');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate meeting search/filter parameters
 */
export function validateSearchParams(params: {
  query?: string;
  startDate?: Date;
  endDate?: Date;
  type?: MeetingType;
  minMood?: number;
  maxMood?: number;
  limit?: number;
  offset?: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validate date range
  if (params.startDate && params.endDate && params.startDate > params.endDate) {
    errors.push('Start date cannot be after end date');
  }

  // Validate mood range
  if (params.minMood !== undefined && (params.minMood < 1 || params.minMood > 10)) {
    errors.push('Minimum mood must be between 1 and 10');
  }
  if (params.maxMood !== undefined && (params.maxMood < 1 || params.maxMood > 10)) {
    errors.push('Maximum mood must be between 1 and 10');
  }
  if (
    params.minMood !== undefined &&
    params.maxMood !== undefined &&
    params.minMood > params.maxMood
  ) {
    errors.push('Minimum mood cannot be greater than maximum mood');
  }

  // Validate pagination
  if (params.limit !== undefined && params.limit < 1) {
    errors.push('Limit must be at least 1');
  }
  if (params.limit !== undefined && params.limit > 100) {
    errors.push('Limit cannot exceed 100');
  }
  if (params.offset !== undefined && params.offset < 0) {
    errors.push('Offset cannot be negative');
  }

  // Validate search query
  if (params.query && params.query.length > 100) {
    errors.push('Search query cannot exceed 100 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
