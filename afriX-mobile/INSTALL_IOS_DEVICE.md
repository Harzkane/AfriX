# Install the iOS app on your iPhone

You can install the AfriX development build on a physical iPhone (not just the simulator).

---

## 1. Connect your iPhone

- Connect your iPhone to your Mac with a USB cable.
- On the iPhone, tap **Trust** when prompted (“Trust This Computer”).
- Keep the phone unlocked during the first install (you can lock it again afterward).

---

## 2. Run the app on the device

From the **afriX-mobile** folder:

```bash
cd afriX-mobile
npx expo run:ios --device
```

- If only one device is connected, the app will build and install on it.
- If you have both a simulator and a device, you’ll get a menu to pick the device; choose your iPhone.

---

## 3. Signing (first time)

- Xcode will use your **Apple ID** to sign the app. If prompted, sign in under **Xcode → Settings → Accounts** (or **Xcode → Preferences → Accounts**).
- With a **free Apple ID**, the app runs on your iPhone but the signing certificate lasts about 7 days; after that you need to build and run again from your Mac (e.g. run `npx expo run:ios --device` again).
- With a **paid Apple Developer account**, you get longer-lasting signing and more distribution options.

---

## 4. If the device isn’t listed

- Confirm the cable is connected and you tapped **Trust** on the iPhone.
- In Xcode: **Window → Devices and Simulators** and check that the iPhone appears and isn’t in a “Preparing…” or error state.
- Unplug and reconnect the iPhone, then run again:

```bash
npx expo run:ios --device
```

---

## 5. After it’s installed

- The app appears on your iPhone home screen (e.g. “afriXmobile” or your display name).
- The first launch may need to load the JS bundle from Metro. Keep **Metro running** on your Mac (the terminal where you ran `npx expo run:ios` or `npx expo start`). For a **development build**, the device and Mac should be on the same Wi‑Fi so the phone can load the bundle from your Mac.

---

## 6. Updating the app after code changes

You usually **do not** need to run `npx expo run:ios --device` again.

- **JavaScript/React changes** (screens, logic, styles, e.g. app lock, new features in `.tsx`/`.ts`): The app on your iPhone loads the latest code from Metro. Just **reload** the app on the device:
  - Shake the iPhone → **Reload**, or
  - Save a file in your editor if Fast Refresh is on.
- Keep **Metro running** on your Mac (`npx expo start` or the terminal where you ran `run:ios`) so the device can fetch the updated bundle.

**When you do need to run `npx expo run:ios --device` again:**

- You add or change a **native** dependency or **app.json** plugin (e.g. Face ID permission text).
- You want to **reinstall** the app on the device.
- You see native build or signing errors, or the app no longer launches.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Connect iPhone via USB and tap **Trust** |
| 2 | Run `npx expo run:ios --device` from `afriX-mobile` |
| 3 | Sign in with Apple ID in Xcode if asked |
| 4 | Keep Metro running so the app can load the bundle |
| 5 | For most code changes: reload the app on the device; only run `run:ios --device` again for native changes or a fresh install |

That’s it — the iOS built app is installed on your iPhone.
