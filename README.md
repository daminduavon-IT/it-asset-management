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

## First run

1. Create user accounts in Firebase Console → Authentication → Users.
2. Sign in, open **All Assets** and use **Import Master Sheet** (shown only while there are no assets) to load `src/data/imported-assets.json`.

See `deployment-instructions.md` for hosting on Vercel.
