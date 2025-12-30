import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { tableRegistry, ResourceKey, TableConfig } from "./registry";
import { ChevronDown, ChevronUp, CheckSquare, Square, Edit, Trash2 } from "lucide-react";
import { TableToolbar } from "./TableToolbar";
import { TablePagination } from "./TablePagination";
import { TableSkeleton } from "./TableSkeleton";
import { BulkActions } from "./BulkActions";
import { exportToCSV } from "./utils/export";
import { DensityMode, getDensityClass } from "./ViewDensity";
import { SavedView } from "./SavedViews";
import { ColumnResizer } from "./ColumnResizer";
import { CopyToClipboard } from "./CopyToClipboard";
import { RowActionsMenu } from "./RowActionsMenu";
import { SearchHighlight } from "./SearchHighlight";
import { EnhancedEmptyState } from "./EnhancedEmptyState";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { QuickFilters } from "./QuickFilters";

interface Props {
  resource: ResourceKey;
  pageSize?: number;
  onEdit?: (row: DataRow) => void;
  onDelete?: (row: DataRow) => void;
  onRowClick?: (row: DataRow) => void;
  refreshTrigger?: number | string | boolean;
  initialFilters?: Record<string, string>;
}

interface DataRow {
  id?: string | number;
  [key: string]: unknown;
}

export default function DataTable({
  resource,
  pageSize: initialPageSize = 30,
  onEdit,
  onDelete,
  onRowClick,
  refreshTrigger,
  initialFilters
}: Props) {
  const config: TableConfig = tableRegistry[resource];

  // State
  const [rows, setRows] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side Params
  const [pagination, setPagination] = useState({ page: 1, limit: initialPageSize, total: 0 });
  const [sort, setSort] = useState<{ col: string; asc: boolean } | null>(
    config.defaultSort
      ? {
        col: config.defaultSort.column,
        asc: config.defaultSort.ascending ?? false,
      }
      : null
  );
  const [query, setQuery] = useState(""); // Global Search
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters || {}); // Specific Filters

  // UI State
  const [selected, setSelected] = useState<Array<string | number>>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    config.columns.forEach(col => {
      if (col.width) widths[col.key] = col.width;
    });
    return widths;
  });
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // ---------------- FETCH DATA ----------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Base Query with Filters
      let q = supabase.from(config.table).select(config.select, { count: 'exact' });
      (void refreshTrigger); // Use the trigger to ensure callback recreation

      // Apply Global Search (naive implementation on multiple columns)
      if (query) {
        // Construct an OR filter for text columns
        const textColumns = config.columns.filter(c => c.filterType === 'text').map(c => c.key);
        if (textColumns.length > 0) {
          const orString = textColumns.map(col => `${col}.ilike.%${query}%`).join(',');
          q = q.or(orString);
        }
      }

      // Apply Specific Dropdown Filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) q = q.eq(key, value);
      });

      // 2. Sorting
      if (sort) {
        q = q.order(sort.col, { ascending: sort.asc });
      }

      // 3. Pagination
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;

      if (error) throw error;

      setRows((data as unknown as DataRow[]) || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [config.table, config.select, config.columns, sort, pagination.page, pagination.limit, query, filters, refreshTrigger]);

  // Debounce Fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Apply initial filters when they change (e.g., deep-link navigation)
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
      setPagination(p => ({ ...p, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters]);

  // ---------------- HANDLERS ----------------
  const toggleSort = (col: string) => {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, asc: true };
      if (prev.asc) return { col, asc: false };
      return null;
    });
  };

  const visibleColumns = useMemo(() =>
    config.columns.filter(c => columnVisibility[c.key] !== false),
    [config.columns, columnVisibility]);

  // Keyboard Navigation
  useKeyboardNavigation({
    enabled: true,
    rowCount: rows.length,
    columnCount: visibleColumns.length,
    onNavigate: (row, col) => {
      if (tableRef.current && row >= 0) {
        const cells = tableRef.current.querySelectorAll(`tbody tr:nth-child(${row + 1}) td`);
        if (cells[col + 1]) { // +1 for checkbox column
          (cells[col + 1] as HTMLElement)?.focus();
        }
      }
    },
    onSelect: (row) => {
      if (rows[row]) {
        toggleRow(rows[row], row);
      }
    },
    onEnter: (row) => {
      if (rows[row] && onRowClick) {
        onRowClick(rows[row]);
      }
    },
  });

  const getRowKey = (row: DataRow, idx: number) => row?.id ?? idx;
  const allSelected = rows.length > 0 && selected.length === rows.length; // Only checks current page

  const toggleRow = (row: DataRow, idx: number) => {
    const key = getRowKey(row, idx);
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected(rows.map((r, i) => getRowKey(r, i)));
    }
  };

  // Mock Bulk Delete
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selected.length} items?`)) return;
    // In a real app, call supabase delete here
    console.log("Deleting keys:", selected);
    setSelected([]);
    fetchData(); // Refresh
  };

  // Export Handler
  const handleExport = (selectedColumns: string[]) => {
    const dataToExport = rows.map(row => {
      const filtered: Record<string, unknown> = {};
      selectedColumns.forEach(col => {
        filtered[col] = row[col];
      });
      return filtered;
    });
    exportToCSV(dataToExport, config.table, selectedColumns);
  };

  // Column Resize Handler
  const handleColumnResize = (columnKey: string, newWidth: number) => {
    setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
  };

  // Get column width
  const getColumnWidth = (columnKey: string) => {
    return columnWidths[columnKey] || config.columns.find(c => c.key === columnKey)?.width || 160;
  };

  // Saved Views Handler
  const handleApplyView = (view: SavedView) => {
    setFilters(view.filters);
    setColumnVisibility(view.columnVisibility);
    if (view.sort) {
      setSort(view.sort);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative">
      <TableToolbar
        query={query}
        setQuery={(q) => { setQuery(q); setPagination(p => ({ ...p, page: 1 })); }}
        columns={config.columns}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        filters={filters}
        setFilters={(f) => { setFilters(f); setPagination(p => ({ ...p, page: 1 })); }}
        onRefresh={fetchData}
        onExport={handleExport}
        sort={sort}
        density={density}
        setDensity={setDensity}
        onApplyView={handleApplyView}
      />

      {error && (
        <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-b">{error}</div>
      )}

      <QuickFilters
        filters={filters}
        columns={config.columns}
        onRemove={(key) => {
          const newFilters = { ...filters };
          delete newFilters[key];
          setFilters(newFilters);
        }}
        onClearAll={() => setFilters({})}
      />

      <div className="overflow-auto flex-1" style={{ scrollbarGutter: "stable" }}>
        <table ref={tableRef} className="w-full text-sm min-w-max border-collapse">
          <colgroup>
            <col style={{ width: 40 }} />
            {visibleColumns.map((c) => (
              <col key={c.key} style={{ width: getColumnWidth(c.key) }} />
            ))}
            {(onEdit || onDelete) && <col style={{ width: 80 }} />}
          </colgroup>

          <thead className="bg-white border-b border-gray-200">
            <tr>
              <th className="p-0 sticky left-0 top-0 z-30 bg-white border-b border-r border-gray-200 w-10">
                <div className="flex items-center justify-center h-10 leading-none">
                  <button onClick={toggleAll} className="text-gray-500 hover:text-blue-600 transition-colors">
                    {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </div>
              </th>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer select-none sticky top-0 z-10 bg-white border-b border-gray-200 relative group hover:bg-gray-50 transition-colors"
                  style={{ width: getColumnWidth(col.key) }}
                  onClick={() => toggleSort(col.key)}
                >
                  <div className="flex items-center gap-2 pr-2">
                    <span>{col.label}</span>
                    {sort?.col === col.key &&
                      (sort.asc ? (
                        <ChevronUp className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-blue-600" />
                      ))}
                  </div>
                  <ColumnResizer
                    initialWidth={getColumnWidth(col.key)}
                    onResize={(newWidth) => handleColumnResize(col.key, newWidth)}
                  />
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-center sticky right-0 top-0 z-30 bg-white border-b border-l border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <TableSkeleton columns={visibleColumns} rowCount={pagination.limit} showActions={!!(onEdit || onDelete)} />
            ) : rows.length === 0 ? (
              <EnhancedEmptyState
                colSpan={visibleColumns.length + (onEdit || onDelete ? 2 : 1)}
                onClearFilters={() => {
                  setFilters({});
                  setQuery("");
                }}
                hasFilters={Object.keys(filters).length > 0}
                searchTerm={query}
              />
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={getRowKey(row, idx) as string}
                  className={`group hover:bg-blue-50/30 transition-colors cursor-pointer border-b border-gray-100 ${selected.includes(getRowKey(row, idx)) ? "bg-blue-50" : "bg-white"} ${hoveredRow === idx ? "bg-blue-50/50" : ""}`}
                  onClick={() => onRowClick?.(row)}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="p-0 sticky left-0 bg-white group-hover:bg-blue-50/30 border-r border-gray-200 z-20 w-10 transition-colors">
                    <div className="flex items-center justify-center h-11 leading-none">
                      <button onClick={(e) => { e.stopPropagation(); toggleRow(row, idx); }} className="text-gray-400 hover:text-blue-600 transition-colors">
                        {selected.includes(getRowKey(row, idx)) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  {visibleColumns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${getDensityClass(density)} text-gray-900 whitespace-nowrap group/cell relative border-b border-gray-100`}>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 min-w-0 text-sm">
                          {col.render ? (
                            col.render(row)
                          ) : (
                            <SearchHighlight
                              text={row[col.key] as string | number | null | undefined}
                              searchTerm={query}
                            />
                          )}
                        </span>
                        <CopyToClipboard value={row[col.key] as string | number | null | undefined} />
                      </div>
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-blue-50/30 border-l border-gray-200 z-20 transition-colors">
                      <div className="flex justify-center">
                        <RowActionsMenu
                          row={row}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onView={onRowClick}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={pagination.page}
        pageSize={pagination.limit}
        total={pagination.total}
        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
        onPageSizeChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))}
      />

      <BulkActions
        selectedCount={selected.length}
        onClear={() => setSelected([])}
        onDelete={handleBulkDelete}
      />
    </div>
  );
}
