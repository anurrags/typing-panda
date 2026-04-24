import { supabase } from "@/lib/supabaseClient";

/**
 * Returns a valid signed URL for a user's avatar, using localStorage as a cache
 * to avoid generating new signed URLs on every page load.
 */
export const getValidAvatarUrl = async (
  authId: string,
  filename: string,
): Promise<string> => {
  const cacheKey = `avatar_${authId}`;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    try {
      const { url, expiresAt, storedFilename } = JSON.parse(cachedData);
      // Check if not expired (with 1 hour buffer) and filename hasn't changed
      if (storedFilename === filename && expiresAt > Date.now() + 3600000) {
        return url;
      }
    } catch {
      // ignore parse error
    }
  }

  const filePath = `${authId}/${filename}`;
  // 7 days expiration
  const { data: signed } = await supabase.storage
    .from("user-data")
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  if (signed?.signedUrl) {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        url: signed.signedUrl,
        expiresAt: Date.now() + 60 * 60 * 24 * 7 * 1000,
        storedFilename: filename,
      }),
    );
    return signed.signedUrl;
  }
  return "";
};
