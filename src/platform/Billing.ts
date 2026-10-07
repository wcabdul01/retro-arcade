import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export type PurchaseStatus = "owned" | "pending" | "cancelled" | "error";

// Bridges to android/app/src/play/java/.../BillingPlugin.java (Google Play
// Billing) or src/huawei/java/.../BillingPlugin.java (Huawei IAP); gradle
// builds in exactly one. Every method resolves rather than rejects, except
// on platforms with no native plugin at all (web, iOS).
export interface BillingPlugin {
  /** Localized price from the store, or available=false if the product isn't set up. */
  getProduct(options: { productId: string }): Promise<{ available: boolean; price: string }>;
  purchase(options: { productId: string }): Promise<{ status: PurchaseStatus; message?: string }>;
  /** checked=false means the store couldn't be asked (offline, signed out): keep the local state. */
  restore(options: { productId: string }): Promise<{ owned: boolean; pending: boolean; checked: boolean }>;
  /** A pending payment completed later (Play only). */
  addListener(event: "purchaseUpdated", listener: (data: { owned: boolean }) => void): Promise<PluginListenerHandle>;
}

export const Billing = registerPlugin<BillingPlugin>("Billing");
