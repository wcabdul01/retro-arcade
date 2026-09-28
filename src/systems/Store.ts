import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { AppLauncher } from "@capacitor/app-launcher";
import { InAppReview } from "@capacitor-community/in-app-review";

// Which store this build was installed from, and the store-specific links
// used by "Rate this app", review prompts and score sharing. Android builds
// are Play unless built with `npm run build:huawei` (see vite.config.ts).

export type StoreId = "play" | "huawei" | "appstore" | "web";

const PACKAGE_ID = "com.retroarcade.app";
// Fill in once the listings exist: App Store Connect > App Information >
// Apple ID, and AppGallery Connect > App information > App ID (C + digits).
const APP_STORE_ID = "";
const APPGALLERY_APP_ID = "";

const PLAY_URL = `https://play.google.com/store/apps/details?id=${PACKAGE_ID}`;
const SUPPORT_EMAIL = "wcabdul01@gmail.com";

export function currentStore(): StoreId {
  switch (Capacitor.getPlatform()) {
    case "ios":
      return "appstore";
    case "android":
      return __HUAWEI_BUILD__ ? "huawei" : "play";
    default:
      return "web";
  }
}

/** Public https link to this app's listing, for share messages. Falls back
 * to the Play listing until the other stores' IDs are filled in above. */
export function storePageUrl(): string {
  const store = currentStore();
  if (store === "appstore" && APP_STORE_ID) return `https://apps.apple.com/app/id${APP_STORE_ID}`;
  if (store === "huawei" && APPGALLERY_APP_ID) return `https://appgallery.huawei.com/app/${APPGALLERY_APP_ID}`;
  return PLAY_URL;
}

/** Stores the in-app review sheet works on. Huawei phones have no Google
 * Play services, so the Play review API isn't available there. */
export function canPromptReview(): boolean {
  const store = currentStore();
  return store === "play" || store === "appstore";
}

export function canOpenStorePage(): boolean {
  return currentStore() !== "web";
}

async function openFirst(urls: string[]): Promise<boolean> {
  for (const url of urls) {
    // openUrl resolves { completed: false } (it doesn't reject) when no app
    // handles the URL, e.g. market:// on a phone without the Play Store.
    try {
      const { completed } = await AppLauncher.openUrl({ url });
      if (completed) return true;
    } catch {
      // Fall through to the next URL.
    }
  }
  return false;
}

/** "Rate this app": opens this app's page in the store app it came from. */
export async function openStorePage(): Promise<void> {
  switch (currentStore()) {
    case "play":
      await openFirst([`market://details?id=${PACKAGE_ID}`, PLAY_URL]);
      return;
    case "huawei":
      await openFirst([
        `appmarket://details?id=${PACKAGE_ID}`,
        ...(APPGALLERY_APP_ID ? [`https://appgallery.huawei.com/app/${APPGALLERY_APP_ID}`] : []),
      ]);
      return;
    case "appstore":
      if (APP_STORE_ID && (await openFirst([`itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`]))) {
        return;
      }
      await requestReview();
      return;
    case "web":
      return;
  }
}

/** Native review sheet. The OS decides whether it actually appears (both
 * Google and Apple cap how often), so this never nags and never throws. */
export async function requestReview(): Promise<void> {
  if (!canPromptReview()) return;
  try {
    await InAppReview.requestReview();
  } catch {
    // Review API unavailable on this device; nothing to do.
  }
}

export async function openFeedbackEmail(): Promise<void> {
  let version = "";
  try {
    if (Capacitor.isNativePlatform()) version = ` ${(await App.getInfo()).version}`;
  } catch {
    // Version is only a nicety in the subject line.
  }
  const subject = encodeURIComponent(`Retro Arcade${version} feedback (${currentStore()})`);
  const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
  if (Capacitor.isNativePlatform()) {
    await openFirst([url]);
  } else {
    window.location.href = url;
  }
}
