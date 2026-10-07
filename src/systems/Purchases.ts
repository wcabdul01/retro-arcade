import Phaser from "phaser";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { getPlatformAdapter, type SaveData } from "../platform";
import { Billing, type PurchaseStatus } from "../platform/Billing";
import { AdsManager } from "./AdsManager";
import { EventBus } from "./EventBus";

// The one-time "Remove Ads" purchase: Google Play Billing on the Play build,
// Huawei IAP on the AppGallery build (android/app/src/{play,huawei}/java).
// Owning it sets SaveData.noAdsPurchased, which turns off every ad -- banner,
// full-screen and the "watch an ad for a reward" options (AdsManager.isAdFree).
// The store is the record of the purchase: restoreAtLaunch() re-reads it on
// every launch, so a reinstall gets it back and a refund takes it away.

/** Same ID in Play Console and AppGallery Connect. */
export const REMOVE_ADS_PRODUCT_ID = "remove_ads";
export const AD_FREE_CHANGED = "adFreeChanged";

const RESTORE_WAIT_MS = 1_500;

export interface PurchaseResult {
  status: PurchaseStatus;
  message: string;
}

class PurchasesImpl {
  private price = "";
  private listener: Promise<PluginListenerHandle> | null = null;

  /** Purchases only exist in the Android builds (the iOS build has no ads). */
  get isSupported(): boolean {
    return Capacitor.getPlatform() === "android";
  }

  /** Store-formatted price ("$9.99", "€10,99"...), or "" until known. */
  get priceLabel(): string {
    return this.price;
  }

  /** Called at boot. Waits briefly so an owner never sees a banner flash,
   * then lets the store answer in the background if it's slow. */
  async restoreAtLaunch(registry: Phaser.Data.DataManager): Promise<void> {
    if (!this.isSupported) return;
    this.listenForLatePurchases(registry);
    const restore = this.restore(registry).catch(() => undefined);
    await Promise.race([restore, new Promise((resolve) => setTimeout(resolve, RESTORE_WAIT_MS))]);
    Billing.getProduct({ productId: REMOVE_ADS_PRODUCT_ID })
      .then(({ available, price }) => {
        this.price = available ? price : "";
      })
      .catch(() => undefined);
  }

  /** Asks the store what this account owns. Returns whether the player owns Remove Ads. */
  async restore(registry: Phaser.Data.DataManager): Promise<{ owned: boolean; checked: boolean }> {
    if (!this.isSupported) return { owned: false, checked: false };
    try {
      const { owned, pending, checked } = await Billing.restore({ productId: REMOVE_ADS_PRODUCT_ID });
      if (owned) {
        await this.setOwned(registry, true);
      } else if (checked && !pending) {
        // Refunded/revoked: the store no longer lists it.
        await this.setOwned(registry, false);
      }
      return { owned, checked };
    } catch {
      return { owned: false, checked: false };
    }
  }

  async buy(registry: Phaser.Data.DataManager): Promise<PurchaseResult> {
    if (!this.isSupported) return { status: "error", message: "Purchases aren't available here." };
    try {
      const { status, message } = await Billing.purchase({ productId: REMOVE_ADS_PRODUCT_ID });
      if (status === "owned") await this.setOwned(registry, true);
      return { status, message: message ?? MESSAGES[status] };
    } catch {
      return { status: "error", message: MESSAGES.error };
    }
  }

  private listenForLatePurchases(registry: Phaser.Data.DataManager): void {
    if (this.listener) return;
    this.listener = Billing.addListener("purchaseUpdated", ({ owned }) => {
      if (owned) void this.setOwned(registry, true);
    });
    this.listener.catch(() => undefined);
  }

  private async setOwned(registry: Phaser.Data.DataManager, owned: boolean): Promise<void> {
    const adapter = getPlatformAdapter();
    const current = (registry.get("saveData") as SaveData | undefined) ?? (await adapter.loadData());
    AdsManager.setAdFree(owned);
    if (current.noAdsPurchased === owned) return;
    // Re-read so a score saved meanwhile isn't overwritten with a stale copy.
    const latest = await adapter.loadData().catch(() => current);
    const updated: SaveData = { ...latest, noAdsPurchased: owned };
    await adapter.saveData(updated);
    registry.set("saveData", updated);
    EventBus.emit(AD_FREE_CHANGED, owned);
  }
}

const MESSAGES: Record<PurchaseStatus, string> = {
  owned: "Thanks! Ads are gone for good.",
  pending: "Payment pending. Ads go away once it's paid.",
  cancelled: "",
  error: "The purchase didn't go through. Try again later.",
};

export const Purchases = new PurchasesImpl();
