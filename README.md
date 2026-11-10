# Avon Pharmo Chem — IT Asset Management

React + TypeScript + Vite app for tracking IT assets, their allocation and service history, backed by Firebase (Cloud Firestore + Firebase Authentication).

## Setup

```bash
npm install
cp .env.example .env   # fill in the VITE_FIREBASE_* values
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build |

## Data model (Cloud Firestore)

- `assets` — one document per asset. Dates are stored as `YYYY-MM-DD` strings; `createdAt`/`updatedAt` are server timestamps.
- `service_logs` — service history per asset (`assetId` = the asset's document id). Deleting an asset also deletes its service logs.
- `login_logs`, `activity_logs` — audit trail written by the app.

## Asset stickers

**Asset Stickers** (sidebar) generates printable labels straight from the inventory. Every laptop and desktop is ticked by default; untick, search or switch the group to print a smaller batch, then press **Print**. An asset's details page also has a **Print Sticker** button for a single label.

- Device sticker: 3.5" × 2.2", 8 per A4 sheet. Shows the logo, asset name, category/brand/model, serial number, asset ref no, specs and a Code 128 barcode of the serial number (or of the asset ref no when no serial is saved).
- Laptop charger sticker: 2.33" × 1.5", 18 per A4 sheet, matched to the laptop by its serial number.
- Optional: assigned user and department on the sticker, and an inventory log page listing the printed batch.

Print on A4 at 100% scale ("Actual size", not "Fit to page") with the default margins, so the labels come out at their real size.

## User accounts

Everyone signs in with an `@avonpc.com` email address and a password. Administrators add people under **Users** in the sidebar: name, sign-in email, role and a starting password. The password is shown once so it can be passed on; each person can then replace it under **Change Password** (at least 12 characters, with upper and lower case letters and a number).

| Role | Can do |
| --- | --- |
| Editor | View, add and edit assets and service records |
| Auditor (read-only) | View everything, change nothing |
| Administrator | Everything an editor can do, plus managing user accounts |

- Each account's role is stored in Firestore under `users/{uid}`, and `firestore.rules` enforces it. A sign-in that no administrator added cannot read or change any data and sees a "does not have access" screen.
- **Remove access** on the Users page blocks an account completely and can be undone with **Restore access**. The app cannot delete a sign-in or reset someone else's password: delete in Firebase Console → Authentication → Users, and use "Forgot your password?" on the sign-in page for a forgotten password.
- The main administrator account (`admin@avonpc.com`) is named by its account id in `src/constants/accounts.ts` (`OWNER_UID`) and in `firestore.rules` (`isOwner()`), so it is always an administrator and cannot be locked out. If that account is ever replaced, change the id in both files.

## First run

1. Publish `firestore.rules` in Firebase Console → Firestore → Rules (see `deployment-instructions.md`). Until the rules are published, the **Users** page cannot save accounts.
2. Sign in as the main administrator and add the other people under **Users**.
3. Open **All Assets** and use **Import Master Sheet** (shown only while there are no assets) to load `src/data/imported-assets.json`.

See `deployment-instructions.md` for hosting on Vercel.
