Firebase API Key Rotation Guide

1. In Firebase Console: Project Settings -> General -> Web API Key
   - Create a new API key and restrict it to your allowed origins (localhost for dev, file:// not allowed so use app signing domain or IP). Add HTTP referrers or IP restrictions.
2. Update CI/Build secrets:
   - Set VITE_FIREBASE_API_KEY and VITE_FIREBASE_APP_ID (and other VITE_FIREBASE_* vars) in your CI provider or build environment.
   - For GitHub Actions, add them as repository secrets and reference in workflow using env: VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}.
3. Rebuild and release the app using the new keys.
4. Verify the new build works and reads/writes to Firestore.
5. Revoke the old API key in Firebase Console once verification complete.

Notes:
- Do NOT commit keys to repo. Use environment-based injection at build time.
- If you used the key in other services (scratch scripts), remove or replace them with environment variables.
