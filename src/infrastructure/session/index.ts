/**
 * Sistema de gestión de sesión
 * Exporta SessionManager, hooks y tipos
 */

export {
    useCachedData, useCachedState,
    usePersistedState, type CachedStateOptions
} from './hooks/use-cached-state.hook';
export { useSession } from './hooks/use-session.hook';
export { SessionManager, sessionManager, type SessionNamespace } from './session-manager';

