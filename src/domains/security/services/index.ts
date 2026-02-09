/**
 * Servicios del dominio de Seguridades
 * NOTA: Los servicios de users, roles, companies y branches han sido migrados a src/features/security/
 * Estos servicios se mantienen temporalmente para compatibilidad con componentes que aún no se han migrado
 */

export { AccessesService } from './accesses.service';
export { PermissionsService } from './permissions.service';

// Los siguientes servicios han sido migrados a src/features/security/
// export { BranchesService } from './branches.service'; // → src/features/security/branches
// export { CompaniesService } from './companies.service'; // → src/features/security/companies
// export { RolesService } from './roles.service'; // → src/features/security/roles
// export { UsersService } from './users.service'; // → src/features/security/users
