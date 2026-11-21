# Google Play Non-Trader & Privacy Compliance Audit

A complete forensic audit of the codebase, dependencies, permissions, and URLs confirms that Sanatan is **100% compliant** with Google Play's **Non-Trader** status under the EU Digital Services Act (DSA).

---

## Forensic Audit Checklist

| Category | Forensic Check in Codebase | Policy Status |
| :--- | :--- | :---: |
| **In-App Purchases & Billing** | Searched all dependencies and source code. **Zero** billing SDKs (`com.android.vending.BILLING`, Stripe, RevenueCat, or Google Play Billing). | **Clean** (No commercial sales) |
| **In-App Advertising** | **Zero** ad SDKs (No Google Mobile Ads, AdMob, Unity Ads, AppLovin, or Facebook Audience). | **Clean** (No ad revenue) |
| **Donation / External Payment Links** | Searched all `Linking.openURL` calls. **Zero** donation buttons, PayPal, UPI, "Buy Me a Coffee", Patreon, or crypto addresses. | **Clean** (No external transactions) |
| **Advertising ID (`AD_ID`)** | `app.json` does **not** request `com.google.android.gms.permission.AD_ID`. | **Clean** (No ad tracking) |
| **Data Commercialization** | **100% On-Device**: Zero network requests (`fetch` = 0), zero analytics brokers, zero user data sold or transmitted to third parties. | **Clean** (No commercial data usage) |
| **External URLs Linked** | Only 2 static destinations exist in the entire app: [github.com/dhirajnavghare/sanatan.cc](https://github.com/dhirajnavghare/sanatan.cc) (code repository) and [sanatan.cc](https://sanatan.cc) (free public web portal, contact & privacy). | **Clean** (Zero commercial redirects) |

---

## Google Play Console Form Declarations

When submitting your app to Google Play Console, use these declarations:

1. **Digital Services Act (DSA) / Trader Status**:
   - Select: **"I am not a trader"**
   - Reason: The app is free, open source, non-commercial, and does not offer goods, services, subscriptions, or advertising.
2. **Ads Declaration**:
   - Select: **"No, my app does not contain ads"**.
3. **App Access / Paywalls**:
   - Select: **"All functionality is available without restrictions"**.
4. **Financial Features**:
   - Select: **"My app does not provide any financial features"**.
5. **Data Safety Form**:
   - Location: Used exclusively on-device in foreground for astronomical sunrise/sunset calculations. **Not shared with any third party** and **not transmitted to any external server**.
