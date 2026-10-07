package com.retroarcade.app;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Google Play Billing for the one-time "remove_ads" product, as a small
 * Capacitor plugin (same shape as the Huawei one in src/huawei/java, picked
 * by android/app/build.gradle's `store` property). src/platform/Billing.ts is
 * the JS side; src/systems/Purchases.ts decides what an owned product means.
 *
 * Every method resolves (never rejects) with a plain status so the JS side
 * can show a message instead of handling exceptions:
 *   getProduct -> { available, price }
 *   purchase   -> { status: "owned" | "pending" | "cancelled" | "error", message? }
 *   restore    -> { owned, pending }
 * A purchase that completes later (pending payment, e.g. cash at a shop) is
 * pushed to JS as a "purchaseUpdated" event with { owned: true }.
 *
 * Billing client callbacks arrive on the main thread; PluginMethod bodies run
 * on the plugin thread, so shared state is guarded by `this`.
 */
@CapacitorPlugin(name = "Billing")
public class BillingPlugin extends Plugin {

    private BillingClient client;
    private boolean connecting = false;
    private final List<Runnable> whenConnected = new ArrayList<>();
    private final List<Runnable> whenFailed = new ArrayList<>();
    private final java.util.Map<String, ProductDetails> details = new java.util.HashMap<>();
    private PluginCall purchaseCall;

    @Override
    public void load() {
        client = BillingClient.newBuilder(getContext())
                .setListener(this::onPurchasesUpdated)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .enableAutoServiceReconnection()
                .build();
    }

    @Override
    protected void handleOnDestroy() {
        if (client != null) client.endConnection();
    }

    /** Runs `ready` once connected, or `failed` if Play Billing is unavailable. */
    private void connect(Runnable ready, Runnable failed) {
        synchronized (this) {
            if (client.isReady()) {
                ready.run();
                return;
            }
            whenConnected.add(ready);
            whenFailed.add(failed);
            if (connecting) return;
            connecting = true;
        }
        client.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                List<Runnable> run;
                synchronized (BillingPlugin.this) {
                    connecting = false;
                    run = new ArrayList<>(result.getResponseCode() == BillingClient.BillingResponseCode.OK ? whenConnected : whenFailed);
                    whenConnected.clear();
                    whenFailed.clear();
                }
                for (Runnable r : run) r.run();
            }

            @Override
            public void onBillingServiceDisconnected() {
                // enableAutoServiceReconnection() reconnects on the next call.
                List<Runnable> run;
                synchronized (BillingPlugin.this) {
                    if (!connecting) return;
                    connecting = false;
                    run = new ArrayList<>(whenFailed);
                    whenConnected.clear();
                    whenFailed.clear();
                }
                for (Runnable r : run) r.run();
            }
        });
    }

    private void queryProduct(String productId, ProductCallback callback) {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build()))
                .build();
        client.queryProductDetailsAsync(params, (result, detailsResult) -> {
            ProductDetails found = null;
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                for (ProductDetails d : detailsResult.getProductDetailsList()) {
                    if (productId.equals(d.getProductId())) found = d;
                }
            }
            if (found != null) {
                synchronized (this) {
                    details.put(productId, found);
                }
            }
            callback.done(found);
        });
    }

    private interface ProductCallback {
        void done(ProductDetails details);
    }

    @PluginMethod
    public void getProduct(PluginCall call) {
        String productId = call.getString("productId", "");
        connect(() -> queryProduct(productId, d -> {
            JSObject ret = new JSObject();
            ProductDetails.OneTimePurchaseOfferDetails offer = d == null ? null : d.getOneTimePurchaseOfferDetails();
            ret.put("available", offer != null);
            ret.put("price", offer != null ? offer.getFormattedPrice() : "");
            call.resolve(ret);
        }), () -> {
            JSObject ret = new JSObject();
            ret.put("available", false);
            ret.put("price", "");
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId", "");
        synchronized (this) {
            if (purchaseCall != null) {
                resolvePurchase(call, "error", "A purchase is already in progress.");
                return;
            }
            purchaseCall = call;
        }
        connect(() -> {
            ProductDetails cached;
            synchronized (this) {
                cached = details.get(productId);
            }
            if (cached != null) {
                launch(cached);
            } else {
                queryProduct(productId, d -> {
                    if (d == null) {
                        finishPurchase("error", "This item isn't available right now.");
                    } else {
                        launch(d);
                    }
                });
            }
        }, () -> finishPurchase("error", "Google Play isn't available. Check your connection."));
    }

    private void launch(ProductDetails d) {
        getActivity().runOnUiThread(() -> {
            BillingFlowParams params = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(
                            BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(d).build()))
                    .build();
            BillingResult result = client.launchBillingFlow(getActivity(), params);
            int code = result.getResponseCode();
            if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
                finishPurchase("owned", null);
            } else if (code != BillingClient.BillingResponseCode.OK) {
                finishPurchase("error", "Couldn't open Google Play (" + code + ").");
            }
            // OK: the result arrives in onPurchasesUpdated.
        });
    }

    private void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null) {
            boolean owned = false;
            boolean pending = false;
            for (Purchase p : purchases) {
                if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    owned = true;
                    acknowledge(p);
                } else if (p.getPurchaseState() == Purchase.PurchaseState.PENDING) {
                    pending = true;
                }
            }
            if (owned) {
                if (!finishPurchase("owned", null)) {
                    // A pending purchase completed while no purchase was in progress.
                    JSObject event = new JSObject();
                    event.put("owned", true);
                    notifyListeners("purchaseUpdated", event);
                }
            } else if (pending) {
                finishPurchase("pending", null);
            } else {
                finishPurchase("error", "The purchase didn't complete.");
            }
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            finishPurchase("cancelled", null);
        } else if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            finishPurchase("owned", null);
        } else {
            finishPurchase("error", "The purchase failed (" + code + ").");
        }
    }

    /** Resolves the in-flight purchase call, if any; returns whether there was one. */
    private boolean finishPurchase(String status, String message) {
        PluginCall call;
        synchronized (this) {
            call = purchaseCall;
            purchaseCall = null;
        }
        if (call == null) return false;
        resolvePurchase(call, status, message);
        return true;
    }

    private static void resolvePurchase(PluginCall call, String status, String message) {
        JSObject ret = new JSObject();
        ret.put("status", status);
        if (message != null) ret.put("message", message);
        call.resolve(ret);
    }

    /** Play refunds purchases that aren't acknowledged within 3 days. */
    private void acknowledge(Purchase p) {
        if (p.isAcknowledged()) return;
        client.acknowledgePurchase(
                AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(),
                ackResult -> {
                    // Not acknowledged (offline etc.): restore() retries on the next launch.
                });
    }

    @PluginMethod
    public void restore(PluginCall call) {
        String productId = call.getString("productId", "");
        connect(() -> client.queryPurchasesAsync(
                QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
                (result, purchases) -> {
                    boolean owned = false;
                    boolean pending = false;
                    if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        for (Purchase p : purchases) {
                            if (!p.getProducts().contains(productId)) continue;
                            if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                                owned = true;
                                acknowledge(p);
                            } else if (p.getPurchaseState() == Purchase.PurchaseState.PENDING) {
                                pending = true;
                            }
                        }
                    }
                    JSObject ret = new JSObject();
                    ret.put("owned", owned);
                    ret.put("pending", pending);
                    ret.put("checked", result.getResponseCode() == BillingClient.BillingResponseCode.OK);
                    call.resolve(ret);
                }), () -> {
            JSObject ret = new JSObject();
            ret.put("owned", false);
            ret.put("pending", false);
            ret.put("checked", false);
            call.resolve(ret);
        });
    }
}
