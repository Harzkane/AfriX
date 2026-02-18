# App lock (biometric on resume)

When you leave the AfriX app (e.g. switch to another app or go to the home screen) and then open AfriX again, the app asks you to unlock with Face ID (or Touch ID) before you can use it again.

---

## Why this is a good idea

- **Security:** If someone picks up your unlocked phone, they can’t open AfriX and see your balance or actions without passing Face ID.
- **Financial app:** For an app that holds or moves value, re-authenticating when returning from background is a common and recommended practice.

---

## How it works

1. **Biometric login is on** (Profile → Security → Biometric Login).
2. You **leave the app** (switch to another app or send AfriX to background).
3. You **open AfriX again**.
4. **Face ID (or Touch ID) is shown** automatically. After you unlock, you continue in the app.
5. If you **cancel** or **fail** the biometric prompt, the app shows a **lock screen** (“AfriX is locked”) with an **“Unlock with Face ID”** button. You must unlock to use the app again; you are not logged out.

---

## When it applies

- Only if **Biometric login** is enabled in Settings.
- Only when the app was in the **background** and becomes **active** again (not on first launch; that flow is separate).
- If biometric is off, returning to the app does **not** show a lock screen.

---

## Summary

| Action                         | Result                          |
|--------------------------------|---------------------------------|
| Leave app → come back          | Face ID prompt (if biometric on) |
| Pass Face ID                   | Continue in app                 |
| Cancel / fail Face ID         | Lock screen; tap to try again   |

This keeps the app secure when you briefly hand the phone to someone or leave it unlocked, without forcing a full login each time.
