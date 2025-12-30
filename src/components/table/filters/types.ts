/**
 * Filter Types & Operators System
 * Inspired by Zoho CRM filter functionality
 */

// ========================================
// FILTER CONDITION
// ========================================

export type FilterOperator = 
  // Text operators
  | 'equals'           // Exact match
  | 'notEquals'        // Not equal
  | 'contains'         // Contains substring (ILIKE)
  | 'notContains'      // Does not contain
  | 'startsWith'       // Starts with
  | 'endsWith'         // Ends with
  | 'isEmpty'          // IS NULL or empty
  | 'isNotEmpty'       // IS NOT NULL
  | 'regex'            // Regex pattern match
  
  // Number operators
  | 'greaterThan'      // >
  | 'lessThan'         // <
  | 'greaterEqual'     // >=
  | 'lessEqual'        // <=
  | 'between'          // value BETWEEN min AND max
  | 'notBetween'       // NOT BETWEEN
  
  // Date operators
  | 'dateEquals'       // Exact date
  | 'dateNotEquals'    // Not equal date
  | 'dateBefore'       // Before date
  | 'dateAfter'        // After date
  | 'daysAgo'          // Within last N days
  | 'daysAfter'        // In next N days
  | 'currentMonth'     // Current month
  | 'currentYear'      // Current year
  | 'isToday'          // Today
  | 'isYesterday'      // Yesterday
  | 'isTomorrow'       // Tomorrow
  
  // Array operators
  | 'in'               // IN array
  | 'notIn'            // NOT IN array
  | 'contains_any'     // Array contains any of values
  | 'contains_all'     // Array contains all values
  
  // Special
  | 'isNull'           // IS NULL
  | 'isNotNull'        // IS NOT NULL
  | 'isTrue'           // Boolean true
  | 'isFalse';         // Boolean false

export type FilterLogic = 'and' | 'or';

export type FieldType = 
  | 'text'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'tags'
  | 'email'
  | 'phone'
  | 'url'
  | 'json';

export interface FilterCondition {
  id: string;                    // Unique ID for this condition
  field: string;                 // Column key
  operator: FilterOperator;      // Operation to perform
  value: any;                    // Value(s) - can be string, number, [min, max], etc.
  fieldType: FieldType;          // Detected field type
  label?: string;                // Display label for field
}

export interface FilterGroup {
  id: string;
  logic: FilterLogic;            // 'and' | 'or'
  conditions: FilterCondition[];
  groups?: FilterGroup[];         // Nested groups for complex logic
}

export interface FilterConfig {
  id: string;
  name: string;
  description?: string;
  logic: FilterLogic;            // Root logic (AND/OR)
  conditions: FilterCondition[];
  groups?: FilterGroup[];
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

// ========================================
// OPERATOR DEFINITIONS
// ========================================

export const OPERATOR_CONFIG: Record<FilterOperator, {
  label: string;
  inputType: 'single' | 'multiple' | 'range' | 'date' | 'daterange' | 'none';
  appliesTo: FieldType[];
  description: string;
}> = {
  // TEXT OPERATORS
  equals: {
    label: 'Equals',
    inputType: 'single',
    appliesTo: ['text', 'select', 'email', 'phone', 'url'],
    description: 'Exact match'
  },
  notEquals: {
    label: 'Not Equals',
    inputType: 'single',
    appliesTo: ['text', 'select', 'email', 'phone', 'url'],
    description: 'Does not match exactly'
  },
  contains: {
    label: 'Contains',
    inputType: 'single',
    appliesTo: ['text', 'email', 'phone', 'url'],
    description: 'Contains the text (case-insensitive)'
  },
  notContains: {
    label: 'Does Not Contain',
    inputType: 'single',
    appliesTo: ['text', 'email', 'phone', 'url'],
    description: 'Does not contain the text'
  },
  startsWith: {
    label: 'Starts With',
    inputType: 'single',
    appliesTo: ['text', 'email', 'phone'],
    description: 'Text starts with...'
  },
  endsWith: {
    label: 'Ends With',
    inputType: 'single',
    appliesTo: ['text', 'email', 'phone'],
    description: 'Text ends with...'
  },
  isEmpty: {
    label: 'Is Empty',
    inputType: 'none',
    appliesTo: ['text', 'email', 'phone', 'url', 'number', 'currency'],
    description: 'Field is empty or null'
  },
  isNotEmpty: {
    label: 'Is Not Empty',
    inputType: 'none',
    appliesTo: ['text', 'email', 'phone', 'url', 'number', 'currency'],
    description: 'Field has a value'
  },
  regex: {
    label: 'Matches Pattern',
    inputType: 'single',
    appliesTo: ['text'],
    description: 'Matches regex pattern'
  },

  // NUMBER OPERATORS
  greaterThan: {
    label: 'Greater Than',
    inputType: 'single',
    appliesTo: ['number', 'currency', 'percentage'],
    description: 'Value > specified number'
  },
  lessThan: {
    label: 'Less Than',
    inputType: 'single',
    appliesTo: ['number', 'currency', 'percentage'],
    description: 'Value < specified number'
  },
  greaterEqual: {
    label: 'Greater or Equal',
    inputType: 'single',
    appliesTo: ['number', 'currency', 'percentage'],
    description: 'Value >= specified number'
  },
  lessEqual: {
    label: 'Less or Equal',
    inputType: 'single',
    appliesTo: ['number', 'currency', 'percentage'],
    description: 'Value <= specified number'
  },
  between: {
    label: 'Between',
    inputType: 'range',
    appliesTo: ['number', 'currency', 'percentage'],
    description: 'Value between min and max'
  },
  notBetween: {
    label: 'Not Between',
    inputType: 'range',
    appliesTo: ['number', 'currency', 'percentage'],
    description: 'Value outside range'
  },

  // DATE OPERATORS
  dateEquals: {
    label: 'Date Equals',
    inputType: 'date',
    appliesTo: ['date', 'datetime'],
    description: 'Exactly on this date'
  },
  dateNotEquals: {
    label: 'Date Not Equals',
    inputType: 'date',
    appliesTo: ['date', 'datetime'],
    description: 'Not on this date'
  },
  dateBefore: {
    label: 'Before',
    inputType: 'date',
    appliesTo: ['date', 'datetime'],
    description: 'Before this date'
  },
  dateAfter: {
    label: 'After',
    inputType: 'date',
    appliesTo: ['date', 'datetime'],
    description: 'After this date'
  },
  daysAgo: {
    label: 'Days Ago',
    inputType: 'single',
    appliesTo: ['date', 'datetime'],
    description: 'Within last N days'
  },
  daysAfter: {
    label: 'Days After',
    inputType: 'single',
    appliesTo: ['date', 'datetime'],
    description: 'In next N days'
  },
  currentMonth: {
    label: 'Current Month',
    inputType: 'none',
    appliesTo: ['date', 'datetime'],
    description: 'Within current month'
  },
  currentYear: {
    label: 'Current Year',
    inputType: 'none',
    appliesTo: ['date', 'datetime'],
    description: 'Within current year'
  },
  isToday: {
    label: 'Is Today',
    inputType: 'none',
    appliesTo: ['date', 'datetime'],
    description: 'Today\'s date'
  },
  isYesterday: {
    label: 'Is Yesterday',
    inputType: 'none',
    appliesTo: ['date', 'datetime'],
    description: 'Yesterday\'s date'
  },
  isTomorrow: {
    label: 'Is Tomorrow',
    inputType: 'none',
    appliesTo: ['date', 'datetime'],
    description: 'Tomorrow\'s date'
  },

  // ARRAY OPERATORS
  in: {
    label: 'In',
    inputType: 'multiple',
    appliesTo: ['select', 'multiselect', 'tags'],
    description: 'In the list of values'
  },
  notIn: {
    label: 'Not In',
    inputType: 'multiple',
    appliesTo: ['select', 'multiselect', 'tags'],
    description: 'Not in the list of values'
  },
  contains_any: {
    label: 'Contains Any',
    inputType: 'multiple',
    appliesTo: ['tags', 'multiselect'],
    description: 'Contains any of these values'
  },
  contains_all: {
    label: 'Contains All',
    inputType: 'multiple',
    appliesTo: ['tags', 'multiselect'],
    description: 'Contains all of these values'
  },

  // SPECIAL
  isNull: {
    label: 'Is Empty',
    inputType: 'none',
    appliesTo: ['text', 'number', 'currency', 'date'],
    description: 'Field is null'
  },
  isNotNull: {
    label: 'Is Not Empty',
    inputType: 'none',
    appliesTo: ['text', 'number', 'currency', 'date'],
    description: 'Field is not null'
  },
  isTrue: {
    label: 'Is True',
    inputType: 'none',
    appliesTo: ['boolean'],
    description: 'Boolean field is true'
  },
  isFalse: {
    label: 'Is False',
    inputType: 'none',
    appliesTo: ['boolean'],
    description: 'Boolean field is false'
  },
};

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getOperatorsForFieldType(fieldType: FieldType): FilterOperator[] {
  return Object.entries(OPERATOR_CONFIG)
    .filter(([, config]) => config.appliesTo.includes(fieldType))
    .map(([operator]) => operator as FilterOperator);
}

export function getOperatorLabel(operator: FilterOperator): string {
  return OPERATOR_CONFIG[operator]?.label || operator;
}

export function getOperatorInputType(
  operator: FilterOperator
): 'single' | 'multiple' | 'range' | 'date' | 'daterange' | 'none' {
  return OPERATOR_CONFIG[operator]?.inputType || 'single';
}

export function isOperatorValidForFieldType(operator: FilterOperator, fieldType: FieldType): boolean {
  const config = OPERATOR_CONFIG[operator];
  return config?.appliesTo.includes(fieldType) ?? false;
}

export function validateFilterCondition(condition: FilterCondition): { valid: boolean; error?: string } {
  // Check if operator applies to field type
  if (!isOperatorValidForFieldType(condition.operator, condition.fieldType)) {
    return {
      valid: false,
      error: `${condition.operator} is not valid for ${condition.fieldType} fields`
    };
  }

  // Check if value is required
  const inputType = getOperatorInputType(condition.operator);
  if (inputType === 'none') {
    return { valid: true };  // No value needed
  }

  if (!condition.value) {
    return {
      valid: false,
      error: `Value is required for ${getOperatorLabel(condition.operator)}`
    };
  }

  // Validate based on input type
  if (inputType === 'range' && Array.isArray(condition.value)) {
    if (condition.value.length !== 2 || condition.value[0] >= condition.value[1]) {
      return {
        valid: false,
        error: 'Invalid range: min must be less than max'
      };
    }
  }

  if (inputType === 'multiple' && !Array.isArray(condition.value)) {
    return {
      valid: false,
      error: 'Value must be an array for this operator'
    };
  }

  return { valid: true };
}
