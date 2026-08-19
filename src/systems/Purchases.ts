import Phaser from "phaser";
import { getPlatformAdapter, type SaveData } from "../platform";
import { AdsManager } from "./AdsManager";

// Placeholder purchase flow: no real payment is collected here. Real Google
// Play Billing needs a signed app listing with the $10 product configured
// in Play Console before it can be tested end-to-end, so for now this just
// flips the entitlement flag directly and persists it — the same flag a
// real purchase would set once billing is wired in. AdsManager and
// BootScene's offline gate both key off SaveData.noAdsPurchased, so nothing
// else needs to change when real billing replaces this.
class PurchasesImpl {
  async buyNoAds(scene: Phaser.Scene): Promise<SaveData> {
    const adapter = getPlatformAdapter();
    const current = (scene.registry.get("saveData") as SaveData | undefined) ?? (await adapter.loadData());
    const updated: SaveData = { ...current, noAdsPurchased: true };
    await adapter.saveData(updated);
    scene.registry.set("saveData", updated);
    AdsManager.setAdFree(true);
    return updated;
  }
}

export const Purchases = new PurchasesImpl();
