import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { hasPermission } = useAuth();
  
  const canView = (module: string) => hasPermission(module, 'Visualiser');
  const canCreate = (module: string) => hasPermission(module, 'Créer');
  const canEdit = (module: string) => hasPermission(module, 'Modifier');
  const canDelete = (module: string) => hasPermission(module, 'Supprimer');
  const canSearch = (module: string) => hasPermission(module, 'Rechercher');
  const canManage = (module: string) => hasPermission(module, 'Gérer les privilèges') || hasPermission(module, 'Gérer les permissions');
  
  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
    canSearch,
    canManage,
    hasPermission
  };
};