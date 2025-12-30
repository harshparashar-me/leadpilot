export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;

  /** Width settings */
  width?: number;
  minWidth?: number;        // required for proper scroll + resize

  /** Optional custom cell renderer */
  render?: (row: T) => React.ReactNode;
}
