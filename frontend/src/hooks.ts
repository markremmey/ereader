import { useQuery, type UseQueryResult } from '@tanstack/react-query';

// 1) Two-step fetch for EPUB
async function fetchEpub(blobName: string): Promise<ArrayBuffer> {
  console.log("fetchEpub, blobName: ", blobName);
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/books/get_full_blob_url/${blobName}`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error('Failed to fetch blob URL');
  const url = await res.json();
  console.log("fetchEpub, url: ", url);
  const epubRes = await fetch(url);
  console.log("fetchEpub, epubRes: ", epubRes);
  if (!epubRes.ok) throw new Error('Failed to fetch epub');
  return epubRes.arrayBuffer();
}

// 2) Custom hook for data fetching
export function useEpub(blobName: string | null): UseQueryResult<ArrayBuffer, Error> {
  return useQuery({
    queryKey: ['epub', blobName],
    queryFn: () => fetchEpub(blobName!),
    enabled: !!blobName,
    staleTime: 1000 * 60 * 60 * 24 * 7, // EPUB files rarely change - only refetch once per week
    gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in memory for a full day
  });
}