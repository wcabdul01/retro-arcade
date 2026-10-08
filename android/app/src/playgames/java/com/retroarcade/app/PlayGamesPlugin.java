package com.retroarcade.app;

import android.util.Log;

import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;
import com.google.android.gms.games.SnapshotsClient;
import com.google.android.gms.games.snapshot.Snapshot;
import com.google.android.gms.games.snapshot.SnapshotMetadataChange;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.tasks.Tasks;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;

/**
 * Google Play Games Saved Games: one snapshot holding the same JSON the app
 * keeps in Preferences (src/platform/CloudSave.ts merges the two). Only
 * compiled into the Play build, and only once a Play Games project ID is set
 * in android/app/build.gradle; MainActivity looks it up by name.
 *
 * Play Games v2 signs the player in automatically at launch, so there's no
 * sign-in screen here; signIn() is only for a player who dismissed it.
 * Every method resolves (never rejects): a player who isn't signed in just
 * keeps playing with the on-device save.
 */
@CapacitorPlugin(name = "PlayGames")
public class PlayGamesPlugin extends Plugin {

    private static final String TAG = "RetroArcadePlayGames";
    private static final String SNAPSHOT = "retro-arcade-save";

    @Override
    public void load() {
        PlayGamesSdk.initialize(getContext());
    }

    @PluginMethod
    public void isSignedIn(PluginCall call) {
        PlayGames.getGamesSignInClient(getActivity()).isAuthenticated().addOnCompleteListener(task -> {
            JSObject ret = new JSObject();
            ret.put("signedIn", task.isSuccessful() && task.getResult().isAuthenticated());
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        PlayGames.getGamesSignInClient(getActivity()).signIn().addOnCompleteListener(task -> {
            JSObject ret = new JSObject();
            ret.put("signedIn", task.isSuccessful() && task.getResult().isAuthenticated());
            call.resolve(ret);
        });
    }

    /** Opens the save once the player is signed in. isAuthenticated() waits for
     * the automatic sign-in that runs at launch, which can take a few seconds,
     * so the first load right after launch doesn't fail just for being early. */
    private Task<SnapshotsClient.DataOrConflict<Snapshot>> open() {
        return PlayGames.getGamesSignInClient(getActivity()).isAuthenticated().continueWithTask(auth -> {
            if (!auth.isSuccessful() || !auth.getResult().isAuthenticated()) {
                return Tasks.forException(new IllegalStateException("Not signed in to Play Games"));
            }
            // Conflicts (two phones saving offline) resolve to the newest copy;
            // CloudSave.ts merges that with the local save, so nothing is lost
            // that either phone still has.
            return PlayGames.getSnapshotsClient(getActivity())
                    .open(SNAPSHOT, true, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED);
        });
    }

    @PluginMethod
    public void load(PluginCall call) {
        open().addOnCompleteListener(task -> {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            if (!task.isSuccessful()) Log.w(TAG, "load: " + task.getException());
            if (task.isSuccessful() && !task.getResult().isConflict()) {
                Snapshot snapshot = task.getResult().getData();
                try {
                    byte[] bytes = snapshot.getSnapshotContents().readFully();
                    ret.put("ok", true);
                    ret.put("data", bytes.length > 0 ? new String(bytes, StandardCharsets.UTF_8) : null);
                    Log.i(TAG, "load: " + bytes.length + " bytes");
                } catch (Exception ignored) {
                    // Unreadable: treat as unavailable.
                }
                PlayGames.getSnapshotsClient(getActivity()).discardAndClose(snapshot);
            }
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void save(PluginCall call) {
        String data = call.getString("data", "");
        open().addOnCompleteListener(task -> {
            if (!task.isSuccessful() || task.getResult().isConflict()) {
                Log.w(TAG, "save: open failed " + task.getException());
                resolveOk(call, false);
                return;
            }
            Snapshot snapshot = task.getResult().getData();
            snapshot.getSnapshotContents().writeBytes(data.getBytes(StandardCharsets.UTF_8));
            PlayGames.getSnapshotsClient(getActivity())
                    .commitAndClose(snapshot, SnapshotMetadataChange.EMPTY_CHANGE)
                    .addOnCompleteListener(commit -> {
                        Log.i(TAG, "save: " + (commit.isSuccessful() ? "ok" : String.valueOf(commit.getException())));
                        resolveOk(call, commit.isSuccessful());
                    });
        });
    }

    private static void resolveOk(PluginCall call, boolean ok) {
        JSObject ret = new JSObject();
        ret.put("ok", ok);
        call.resolve(ret);
    }
}
