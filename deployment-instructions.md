# Deployment to Vercel

Since you are using Vite and React Router, Vercel is the perfect hosting platform for your IT Asset Management System. We have already generated the `vercel.json` file needed to fix the "Page Not Found (404)" errors that happen on refresh.

## Exact Deployment Steps

1. **Push your code to GitHub (Recommended)**
   - Open your terminal and run the following to commit your code:
     ```bash
     git add .
     git commit -m "Initial commit of IT Asset Management System"
     ```
   - Push this up to your GitHub account repository.

2. **Deploy via Vercel Dashboard**
   - Go to [Vercel.com](https://vercel.com/) and create a free account if you don't have one.
   - Click **Add New Project**.
   - Connect your GitHub account and import your `it-asset-management` repository.

3. **Configure Environment Variables (CRITICAL)**
   - On the Vercel deployment screen, expand the **Environment Variables** section.
   - Add the Firebase variables from your local `.env` (Firebase Console → Project settings → General → Your apps):
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
   - Without them the app shows a blank page ("Missing Firebase environment variables" in the console).
   - Do **not** set `VITE_USE_FIREBASE_EMULATORS` on Vercel; it is for local testing only.

4. **Deploy Options**
   - Framework Preset should automatically be detected as **Vite**.
   - Build Command should be: `npm run build`
   - Output Directory should be: `dist`
   - Click **Deploy**.

## Firebase settings for production

In the Firebase Console for the `it-asset-management-42c27` project:

- **Authentication → Settings → Authorized domains**: add your Vercel domain, otherwise sign-in is blocked there.
- **Authentication → Templates → Password reset** (optional): to use the app's own reset page, set the action URL to `https://<your-domain>/reset-password`. Otherwise Firebase's hosted page handles "Forgot your password?" links.
- **Firestore → Rules**: only signed-in users should read and write; accounts should only be created by an admin (Authentication → Users → Add user).
