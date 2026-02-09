/**
 * Tipos del componente SearchFilterBar
 */

export interface FilterOption {
  key: string;
  label: string;
  value: any;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'boolean';
  options?: FilterOption[];
  placeholder?: string;
}

export interface SearchFilterBarProps {
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  filters?: FilterConfig[];
  activeFilters?: Record<string, any>;
  onAdvancedFilterChange?: (key: string, value: any) => void;
  onClearFilters?: () => void;
  showClearButton?: boolean;
  filterPlaceholder?: string;
  searchPlaceholder?: string;
  defaultCollapsed?: boolean;
  filteredCount?: number;
  totalCount?: number;
  showSearchHint?: boolean;
}

