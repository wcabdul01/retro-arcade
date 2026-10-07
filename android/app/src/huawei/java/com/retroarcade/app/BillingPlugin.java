package com.retroarcade.app;

import android.app.PendingIntent;
import android.content.Intent;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;

import com.huawei.hms.iap.Iap;
import com.huawei.hms.iap.IapApiException;
import com.huawei.hms.iap.IapClient;
import com.huawei.hms.iap.entity.InAppPurchaseData;
import com.huawei.hms.iap.entity.OrderStatusCode;
import com.huawei.hms.iap.entity.OwnedPurchasesReq;
import com.huawei.hms.iap.entity.ProductInfo;
import com.huawei.hms.iap.entity.ProductInfoReq;
import com.huawei.hms.iap.entity.PurchaseIntentReq;
import com.huawei.hms.iap.entity.PurchaseResultInfo;
import com.huawei.hms.support.api.client.Status;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Collections;
import java.util.List;

/**
 * Huawei IAP for the non-consumable "remove_ads" product. Same JS contract
 * as the Google Play version in src/play/java (see that file for the result
 * shapes); android/app/build.gradle compiles this one in when built with
 * `-Pstore=huawei`, so the Play build never contains HMS code.
 *
 * The app ID comes from the com.huawei.hms.client.appid manifest entry
 * (src/huawei/AndroidManifest.xml), so no agconnect-services.json is needed.
 *
 * IAP hands back a Status whose resolution is the checkout (or the Huawei ID
 * sign-in) screen; it's started with launchers registered in load(), which
 * runs during the activity's onCreate, as registerForActivityResult requires.
 */
@CapacitorPlugin(name = "Billing")
public class BillingPlugin extends Plugin {

    private IapClient iap;
    private ActivityResultLauncher<IntentSenderRequest> senderLauncher;
    private ActivityResultLauncher<Intent> intentLauncher;
    private PluginCall purchaseCall;

    @Override
    public void load() {
        iap = Iap.getIapClient(getActivity());
        senderLauncher = getActivity().registerForActivityResult(
                new ActivityResultContracts.StartIntentSenderForResult(), this::onCheckoutResult);
        intentLauncher = getActivity().registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(), this::onCheckoutResult);
    }

    private static int codeOf(Exception e) {
        return e instanceof IapApiException ? ((IapApiException) e).getStatusCode() : OrderStatusCode.ORDER_STATE_FAILED;
    }

    @PluginMethod
    public void getProduct(PluginCall call) {
        ProductInfoReq req = new ProductInfoReq();
        req.setPriceType(IapClient.PriceType.IN_APP_NONCONSUMABLE);
        req.setProductIds(Collections.singletonList(call.getString("productId", "")));
        iap.obtainProductInfo(req)
                .addOnSuccessListener(result -> {
                    List<ProductInfo> list = result.getProductInfoList();
                    ProductInfo info = list == null || list.isEmpty() ? null : list.get(0);
                    JSObject ret = new JSObject();
                    ret.put("available", info != null);
                    ret.put("price", info != null ? info.getPrice() : "");
                    call.resolve(ret);
                })
                .addOnFailureListener(e -> {
                    JSObject ret = new JSObject();
                    ret.put("available", false);
                    ret.put("price", "");
                    call.resolve(ret);
                });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        synchronized (this) {
            if (purchaseCall != null) {
                resolvePurchase(call, "error", "A purchase is already in progress.");
                return;
            }
            purchaseCall = call;
        }
        PurchaseIntentReq req = new PurchaseIntentReq();
        req.setProductId(call.getString("productId", ""));
        req.setPriceType(IapClient.PriceType.IN_APP_NONCONSUMABLE);
        iap.createPurchaseIntent(req)
                .addOnSuccessListener(result -> startResolution(result.getStatus()))
                .addOnFailureListener(e -> {
                    int code = codeOf(e);
                    if (code == OrderStatusCode.ORDER_PRODUCT_OWNED) {
                        finishPurchase("owned", null);
                    } else if (e instanceof IapApiException && ((IapApiException) e).getStatus().hasResolution()) {
                        // Not signed in to a Huawei ID, or the IAP agreement isn't accepted yet.
                        startResolution(((IapApiException) e).getStatus());
                    } else {
                        finishPurchase("error", messageFor(code));
                    }
                });
    }

    private void startResolution(Status status) {
        getActivity().runOnUiThread(() -> {
            try {
                PendingIntent pending = status == null ? null : status.getResolution();
                Intent intent = status == null ? null : status.getResolutionIntent();
                if (pending != null) {
                    senderLauncher.launch(new IntentSenderRequest.Builder(pending.getIntentSender()).build());
                } else if (intent != null) {
                    intentLauncher.launch(intent);
                } else {
                    finishPurchase("error", "Couldn't open Huawei checkout.");
                }
            } catch (RuntimeException e) {
                finishPurchase("error", "Couldn't open Huawei checkout.");
            }
        });
    }

    private void onCheckoutResult(ActivityResult activityResult) {
        Intent data = activityResult.getData();
        if (data == null) {
            finishPurchase("cancelled", null);
            return;
        }
        PurchaseResultInfo info = iap.parsePurchaseResultInfoFromIntent(data);
        int code = info.getReturnCode();
        if (code == OrderStatusCode.ORDER_STATE_SUCCESS) {
            if (isPurchased(info.getInAppPurchaseData())) {
                finishPurchase("owned", null);
            } else {
                // Sign-in/agreement screen finished; the player can tap again to buy.
                finishPurchase("cancelled", null);
            }
        } else if (code == OrderStatusCode.ORDER_PRODUCT_OWNED) {
            finishPurchase("owned", null);
        } else if (code == OrderStatusCode.ORDER_STATE_CANCEL) {
            finishPurchase("cancelled", null);
        } else if (code == OrderStatusCode.ORDER_STATE_PENDING) {
            finishPurchase("pending", null);
        } else {
            finishPurchase("error", messageFor(code));
        }
    }

    private static boolean isPurchased(String json) {
        if (json == null) return false;
        try {
            // purchaseState 0 = purchased.
            return new InAppPurchaseData(json).getPurchaseState() == 0;
        } catch (org.json.JSONException e) {
            return false;
        }
    }

    private static String messageFor(int code) {
        switch (code) {
            case OrderStatusCode.ORDER_STATE_NET_ERROR:
                return "No connection. Try again when you're online.";
            case OrderStatusCode.ORDER_STATE_PRODUCT_COUNTRY_NOT_SUPPORTED:
            case OrderStatusCode.ORDER_ACCOUNT_AREA_NOT_SUPPORTED:
                return "Purchases aren't available in your region.";
            case OrderStatusCode.ORDER_HWID_NOT_LOGIN:
                return "Sign in to your HUAWEI ID to buy.";
            default:
                return "The purchase failed (" + code + ").";
        }
    }

    private void finishPurchase(String status, String message) {
        PluginCall call;
        synchronized (this) {
            call = purchaseCall;
            purchaseCall = null;
        }
        if (call != null) resolvePurchase(call, status, message);
    }

    private static void resolvePurchase(PluginCall call, String status, String message) {
        JSObject ret = new JSObject();
        ret.put("status", status);
        if (message != null) ret.put("message", message);
        call.resolve(ret);
    }

    @PluginMethod
    public void restore(PluginCall call) {
        String productId = call.getString("productId", "");
        OwnedPurchasesReq req = new OwnedPurchasesReq();
        req.setPriceType(IapClient.PriceType.IN_APP_NONCONSUMABLE);
        iap.obtainOwnedPurchases(req)
                .addOnSuccessListener(result -> {
                    boolean owned = false;
                    List<String> items = result.getInAppPurchaseDataList();
                    if (items != null) {
                        for (String json : items) {
                            try {
                                InAppPurchaseData data = new InAppPurchaseData(json);
                                if (productId.equals(data.getProductId()) && data.getPurchaseState() == 0) owned = true;
                            } catch (org.json.JSONException ignored) {
                                // Skip malformed entries.
                            }
                        }
                    }
                    JSObject ret = new JSObject();
                    ret.put("owned", owned);
                    ret.put("pending", false);
                    ret.put("checked", true);
                    call.resolve(ret);
                })
                .addOnFailureListener(e -> {
                    // Not signed in, no HMS Core, offline: keep whatever is saved locally.
                    JSObject ret = new JSObject();
                    ret.put("owned", false);
                    ret.put("pending", false);
                    ret.put("checked", false);
                    call.resolve(ret);
                });
    }
}
