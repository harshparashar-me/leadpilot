/**
 * Zoho CRM-like Visual Filter Builder Component
 */

import React, { useState, useCallback } from 'react';
import {
  Plus,
  X,
  ChevronDown,
  Filter,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Settings
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  FilterCondition,
  FilterGroup,
  FilterConfig,
  FieldType,
  FilterOperator,
  getOperatorsForFieldType,
  getOperatorLabel,
  getOperatorInputType,
  validateFilterCondition,
  OPERATOR_CONFIG
} from './types';
import {
  translateFilterConfig,
  getFilterDescription
} from './translator';

interface ZohoCRMFilterProps {
  // Data configuration
  availableFields: Array<{
    key: string;
    label: string;
    type: FieldType;
    filterOptions?: string[];
  }>;

  // Current state
  currentFilter?: FilterConfig;
  savedFilters?: FilterConfig[];

  // Callbacks
  onApplyFilter: (config: FilterConfig) => void;
  onSaveFilter: (config: FilterConfig) => void;
  onDeleteFilter: (id: string) => void;
  onClearFilter: () => void;
}

export const ZohoCRMFilter: React.FC<ZohoCRMFilterProps> = ({
  availableFields,
  currentFilter,
  savedFilters = [],
  onApplyFilter,
  onSaveFilter,
  onDeleteFilter,
  onClearFilter
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterName, setFilterName] = useState(currentFilter?.name || '');
  const [filterLogic, setFilterLogic] = useState<'and' | 'or'>(currentFilter?.logic || 'and');
  const [conditions, setConditions] = useState<FilterCondition[]>(currentFilter?.conditions || []);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Add new condition
  const addCondition = useCallback(() => {
    const newCondition: FilterCondition = {
      id: Math.random().toString(36).substr(2, 9),
      field: availableFields[0]?.key || '',
      fieldType: availableFields[0]?.type || 'text',
      operator: 'equals',
      value: '',
      label: availableFields[0]?.label
    };
    setConditions([...conditions, newCondition]);
    setErrorMessage(null);
  }, [availableFields]);

  // Update condition
  const updateCondition = useCallback((id: string, updates: Partial<FilterCondition>) => {
    setConditions(conditions.map(c => (c.id === id ? { ...c, ...updates } : c)));
    setErrorMessage(null);
  }, [conditions]);

  // Remove condition
  const removeCondition = useCallback((id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  }, [conditions]);

  // Apply filters
  const handleApply = useCallback(() => {
    // Validate all conditions
    for (const condition of conditions) {
      const validation = validateFilterCondition(condition);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid filter configuration');
        return;
      }
    }

    const config: FilterConfig = {
      id: currentFilter?.id || Math.random().toString(36).substr(2, 9),
      name: filterName || 'Filter',
      logic: filterLogic,
      conditions,
      createdAt: currentFilter?.createdAt || new Date(),
      updatedAt: new Date()
    };

    onApplyFilter(config);
    setErrorMessage(null);
  }, [conditions, filterLogic, filterName, currentFilter, onApplyFilter]);

  // Save filter preset
  const handleSave = useCallback(async () => {
    if (!filterName.trim()) {
      setErrorMessage('Filter name is required');
      return;
    }

    // Validate all conditions
    for (const condition of conditions) {
      const validation = validateFilterCondition(condition);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid filter configuration');
        return;
      }
    }

    setIsSaving(true);
    try {
      const config: FilterConfig = {
        id: currentFilter?.id || Math.random().toString(36).substr(2, 9),
        name: filterName,
        logic: filterLogic,
        conditions,
        createdAt: currentFilter?.createdAt || new Date(),
        updatedAt: new Date()
      };

      onSaveFilter(config);
      setErrorMessage(null);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  }, [conditions, filterLogic, filterName, currentFilter, onSaveFilter]);

  const hasActiveFilters = conditions.length > 0;
  const filterDescription = hasActiveFilters
    ? getFilterDescription({
        id: 'temp',
        name: '',
        logic: filterLogic,
        conditions,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    : 'No filters applied';

  return (
    <div className="flex items-center gap-2">
      {/* Main Filter Button */}
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition ${
              hasActiveFilters
                ? 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {hasActiveFilters ? `Filter (${conditions.length})` : 'Filter'}
          </button>
        </Dialog.Trigger>

        {/* Filter Modal */}
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <Dialog.Title className="text-lg font-semibold">Advanced Filters</Dialog.Title>
                <p className="text-xs text-gray-500 mt-1">{filterDescription}</p>
              </div>
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Filter Name */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Filter Name (optional)
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="e.g., Hot Leads, High-Value Deals..."
                  className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Root Logic (AND/OR) */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                <span className="text-xs font-medium text-gray-700">Match</span>
                <select
                  value={filterLogic}
                  onChange={(e) => setFilterLogic(e.target.value as 'and' | 'or')}
                  className="px-2 py-1 text-xs border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="and">ALL of the following conditions</option>
                  <option value="or">ANY of the following conditions</option>
                </select>
              </div>

              {/* Conditions */}
              <div className="space-y-2">
                {conditions.length === 0 ? (
                  <div className="text-center py-8">
                    <Filter className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No filters added yet</p>
                    <p className="text-xs text-gray-400">Click "Add Condition" to get started</p>
                  </div>
                ) : (
                  conditions.map((condition, index) => (
                    <FilterConditionRow
                      key={condition.id}
                      condition={condition}
                      availableFields={availableFields}
                      index={index}
                      onUpdate={(updates) => updateCondition(condition.id, updates)}
                      onRemove={() => removeCondition(condition.id)}
                      logic={filterLogic}
                    />
                  ))
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs text-red-700">{errorMessage}</p>
                </div>
              )}

              {/* Add Condition Button */}
              <button
                onClick={addCondition}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 w-full justify-center transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Condition
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 p-4 border-t">
              <button
                onClick={onClearFilter}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition"
              >
                Clear All
              </button>

              <div className="flex gap-2">
                <Dialog.Close asChild>
                  <button className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition">
                    Cancel
                  </button>
                </Dialog.Close>

                <button
                  onClick={handleApply}
                  className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Apply Filter
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition disabled:opacity-50"
                  title="Save this filter for reuse"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Saved Filters Dropdown */}
      {savedFilters.length > 0 && (
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            <Eye className="w-3.5 h-3.5" />
            Saved ({savedFilters.length})
          </button>

          <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-300 rounded-lg shadow-lg hidden group-hover:block z-50 p-2">
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-600 border-b mb-1">
              Saved Filters
            </div>
            {savedFilters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded text-xs group/item"
              >
                <button
                  onClick={() => onApplyFilter(filter)}
                  className="flex-1 text-left hover:text-blue-600 truncate"
                  title={filter.description || filter.name}
                >
                  <div className="font-medium">{filter.name}</div>
                  {filter.description && (
                    <div className="text-gray-500 truncate">{filter.description}</div>
                  )}
                </button>
                <button
                  onClick={() => onDeleteFilter(filter.id)}
                  className="p-1 text-red-600 opacity-0 group-hover/item:opacity-100 hover:bg-red-50 rounded transition"
                  title="Delete filter"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ========================================
// Filter Condition Row Component
// ========================================

interface FilterConditionRowProps {
  condition: FilterCondition;
  availableFields: Array<{
    key: string;
    label: string;
    type: FieldType;
    filterOptions?: string[];
  }>;
  index: number;
  logic: 'and' | 'or';
  onUpdate: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

function FilterConditionRow({
  condition,
  availableFields,
  index,
  logic,
  onUpdate,
  onRemove
}: FilterConditionRowProps) {
  const currentField = availableFields.find((f) => f.key === condition.field);
  const operators = currentField ? getOperatorsForFieldType(currentField.type) : [];
  const inputType = getOperatorInputType(condition.operator);
  const isFirstRow = index === 0;

  return (
    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border">
      {/* Logic Connector */}
      {!isFirstRow && (
        <div className="flex items-center justify-center w-12 pt-1.5">
          <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-300">
            {logic.toUpperCase()}
          </span>
        </div>
      )}
      {isFirstRow && <div className="w-12" />}

      {/* Field Selector */}
      <select
        value={condition.field}
        onChange={(e) => {
          const field = availableFields.find((f) => f.key === e.target.value);
          if (field) {
            onUpdate({
              field: field.key,
              fieldType: field.type,
              label: field.label,
              operator: getOperatorsForFieldType(field.type)[0],
              value: ''
            });
          }
        }}
        className="px-2 py-1.5 text-xs border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none min-w-0 flex-shrink-0"
      >
        {availableFields.map((field) => (
          <option key={field.key} value={field.key}>
            {field.label}
          </option>
        ))}
      </select>

      {/* Operator Selector */}
      <select
        value={condition.operator}
        onChange={(e) => onUpdate({ operator: e.target.value as FilterOperator })}
        className="px-2 py-1.5 text-xs border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none flex-shrink-0"
      >
        {operators.map((op) => (
          <option key={op} value={op}>
            {getOperatorLabel(op)}
          </option>
        ))}
      </select>

      {/* Value Input */}
      <FilterValueInput
        condition={condition}
        fieldType={condition.fieldType}
        inputType={inputType}
        filterOptions={currentField?.filterOptions}
        onChange={(value) => onUpdate({ value })}
      />

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition flex-shrink-0"
        title="Remove condition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ========================================
// Value Input Component (Dynamic)
// ========================================

interface FilterValueInputProps {
  condition: FilterCondition;
  fieldType: FieldType;
  inputType: 'single' | 'multiple' | 'range' | 'date' | 'daterange' | 'none';
  filterOptions?: string[];
  onChange: (value: any) => void;
}

function FilterValueInput({
  condition,
  fieldType,
  inputType,
  filterOptions,
  onChange
}: FilterValueInputProps) {
  if (inputType === 'none') {
    return null;  // No input needed
  }

  if (inputType === 'single') {
    if (fieldType === 'select' && filterOptions) {
      // Dropdown for select fields
      return (
        <select
          value={condition.value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="px-2 py-1.5 text-xs border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none flex-1"
        >
          <option value="">Select value...</option>
          {filterOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (fieldType === 'date' || fieldType === 'datetime') {
      // Date input
      return (
        <input
          type="date"
          value={condition.value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="px-2 py-1.5 text-xs border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none flex-1"
        />
      );
    }

    if (fieldType === 'number' || fieldType === 'currency' || fieldType === 'percentage') {
      // Number input
      return (
        <input
          type="number"
          value={condition.value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          placeholder="Enter value"
          className="px-2 py-1.5 text-xs border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none flex-1"
        />
      );
    }

    // Text input (default)
    return (
      <input
        type="text"
        value={condition.value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter value"
        className="px-2 py-1.5 text-xs border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none flex-1"
      />
    );
  }

  if (inputType === 'range') {
    // Range input [min, max]
    const [min, max] = Array.isArray(condition.value) ? condition.value : ['', ''];
    return (
      <div className="flex items-center gap-1 flex-1">
        <input
          type="number"
          value={min}
          onChange={(e) => onChange([e.target.value ? Number(e.target.value) : '', max])}
          placeholder="Min"
          className="px-2 py-1.5 text-xs border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none flex-1"
        />
        <span className="text-gray-400 text-xs">to</span>
        <input
          type="number"
          value={max}
          onChange={(e) => onChange([min, e.target.value ? Number(e.target.value) : ''])}
          placeholder="Max"
          className="px-2 py-1.5 text-xs border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none flex-1"
        />
      </div>
    );
  }

  if (inputType === 'multiple') {
    // Multi-select for array fields
    if (filterOptions) {
      return (
        <div className="flex flex-wrap gap-2 flex-1">
          {filterOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-1 px-2 py-1 bg-white border rounded-md text-xs cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={Array.isArray(condition.value) && condition.value.includes(opt)}
                onChange={(e) => {
                  const current = Array.isArray(condition.value) ? condition.value : [];
                  if (e.target.checked) {
                    onChange([...current, opt]);
                  } else {
                    onChange(current.filter((v: string) => v !== opt));
                  }
                }}
                className="w-3 h-3"
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    // Fallback: text input with comma-separated values
    return (
      <input
        type="text"
        value={Array.isArray(condition.value) ? condition.value.join(', ') : ''}
        onChange={(e) => onChange(e.target.value.split(',').map((v: string) => v.trim()))}
        placeholder="Comma-separated values"
        className="px-2 py-1.5 text-xs border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none flex-1"
      />
    );
  }

  return null;
}

export default ZohoCRMFilter;
