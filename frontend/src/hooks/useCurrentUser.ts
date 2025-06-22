import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '../api/user';
import type { CurrentUser } from '../api/user';

export function useCurrentUser() {
  return useQuery<CurrentUser, Error>({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (cacheTime was renamed to gcTime in v5)
    retry: false,
  });
}