import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '../api/user';
import type { CurrentUser } from '../api/user';
import { useAuth } from '../context/AuthContext';

export function useCurrentUser() {
  const { isAuthenticated } = useAuth();
  return useQuery<CurrentUser, Error>({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (cacheTime was renamed to gcTime in v5)
    retry: false,
    enabled: isAuthenticated
  });
}