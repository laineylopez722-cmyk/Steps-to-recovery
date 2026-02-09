import { useAuth } from '../../../contexts/AuthContext';

export function useCurrentUserId() {
  const { user } = useAuth();
  return user?.id || '';
}
