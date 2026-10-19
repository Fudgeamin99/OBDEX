# OBDEX

UK vehicle MOT, tax and HPI checks.

| Folder | What it is |
| --- | --- |
| [`obdex-mobile`](obdex-mobile) | The Android and iPhone app (Expo / React Native) |
| [`obdex-app`](obdex-app) | The server that holds the DVSA, DVLA and HPI keys, plus a web version of the app |

## Android APK

Every push to `main` that changes `obdex-mobile` builds an APK with GitHub Actions. Open the **Actions** tab, choose the latest **Android APK** run and download **obdex-android-apk** under Artifacts. You can also start a build by hand from the same page with **Run workflow**.

![Screens](obdex-mobile/screens-preview.png)
