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
   - You must add all your Firebase variables from your local `.env` file one by one:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`

4. **Deploy Options**
   - Framework Preset should automatically be detected as **Vite**.
   - Build Command should be: `npm run build`
   - Output Directory should be: `dist`
   - Click **Deploy**.

## Testing Production
Once deployed, Vercel will give you a live URL. Make sure to log into the Firebase Console, go to **Authentication -> Settings -> Authorized Domains**, and add your new Vercel domain to that list, otherwise Firebase Auth will block logins!
