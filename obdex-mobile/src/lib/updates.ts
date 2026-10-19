import { useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';

// Each GitHub build of the APK is published to the android-latest release,
// tagged with the commit it was built from. The build bakes in its own commit
// (EXPO_PUBLIC_BUILD_SHA), so a different commit on the release means a newer APK.
const REPO = 'Fudgeamin99/OBDEX';
export const RELEASE_PAGE = `https://github.com/${REPO}/releases/tag/android-latest`;
export const APK_URL = `https://github.com/${REPO}/releases/download/android-latest/OBDEX.apk`;
const BUILD_SHA = process.env.EXPO_PUBLIC_BUILD_SHA ?? '';

export type UpdateState = { status: 'checking' | 'current' | 'unknown' } | { status: 'available'; url: string; published: string };

export async function checkForUpdate(): Promise<UpdateState> {
  if (Platform.OS !== 'android' || !BUILD_SHA) return { status: 'unknown' };
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/android-latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return { status: 'unknown' }; // private repo, rate limit or offline
    const rel = await res.json();
    const latest: string = rel.target_commitish ?? '';
    if (!latest || latest === BUILD_SHA) return { status: 'current' };
    const asset = rel.assets?.find((a: { name: string }) => a.name.endsWith('.apk'));
    return { status: 'available', url: asset?.browser_download_url ?? APK_URL, published: rel.published_at ?? '' };
  } catch {
    return { status: 'unknown' };
  }
}

export function useUpdate() {
  const [state, setState] = useState<UpdateState>({ status: 'checking' });
  useEffect(() => { let live = true; checkForUpdate().then((s) => live && setState(s)); return () => { live = false; }; }, []);
  return state;
}

// Opens the new APK in the browser; Android downloads it and offers to install over the current app.
export const installUpdate = (url = APK_URL) => Linking.openURL(url);
