// Exportar screens
export { CompaniesListScreen } from './screens';

// Exportar componentes
export { CompanyCreateForm, CompanyEditForm } from './components';
export type { CompanyCreateFormProps, CompanyEditFormProps } from './components';

// Exportar servicios
export { CompaniesService } from './services';

// Exportar tipos
export type { Company, CompanyFilters, CompanyPayload } from './types/domain';
export type { CompanyApi } from './types/api';

// Exportar adaptadores
export { companyAdapter, companiesAdapter } from './adapters';
