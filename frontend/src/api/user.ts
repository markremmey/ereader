export interface CurrentUser {
  id: string;
  email: string;
  is_subscribed: boolean;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
    credentials: 'include',
  });
  if (res.status === 401) {
    throw new Error('Not authenticated');
  }
  if (!res.ok) {
    throw new Error('Failed to fetch current user');
  }
  const userData = await res.json();
  console.log("user.ts: ", userData);
  return userData;
}