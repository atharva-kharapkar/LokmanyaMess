Security note for Firebase configuration

- Do NOT commit production API keys or service account JSON into the repository's history.
- This project contains firebase configuration in src/firebase.js and src/firebase/firebaseConfig.js. Keep only one canonical configuration in src/firebase/*. If you need to change keys, update that file or use environment variables.

Recommended safe approaches (non-breaking):
1. For local development, keep keys in a local .env and load them at build time. Ensure .env is in .gitignore.
2. For production packaged Electron apps, embed config at build time via secure CI secrets (avoid committing keys).

If duplicate firebase configs exist (e.g., in scratch/ or old files), remove them. The /scratch/ folder is already ignored by .gitignore.

If you want, the guardian can consolidate configs into a single src/firebase/config.js that reads from environment variables (VITE_FIREBASE_*) and avoids committing keys. This is already implemented: update your CI/build env to provide VITE_FIREBASE_* variables.

Rotation steps (manual):
1. In Firebase Console > Project Settings > Web API Keys, generate new API key and restrict it to your app's domains.
2. Replace VITE_FIREBASE_API_KEY in your CI secrets and rebuild the app.
3. Revoke the old key in Firebase console once new builds are verified.

If you want, the guardian can prepare a PR with a .env.example and CI instructions to automate replacement.

Firestore rules guidance

- This repo now includes a `firestore.rules` file and `firebase.json`.
- The checked-in rules are intentionally deny-by-default for zero-cost safety until you choose a real cloud auth model.
- If you deploy those rules as-is, the app's Firestore sync will be blocked. Local Electron backup mode will still protect local data, but cloud sync will show as degraded.
- That is safer than leaving permissive cloud rules active when you do not want to pay for a full auth setup yet.

Suggested free rollout order

1. Keep using the app locally with the hardened backup flow.
2. Review `firestore.rules` before deploying anything to Firebase.
3. Only deploy cloud rules when you are ready to accept stricter cloud access behavior.
4. When you later choose an auth model, replace the deny-by-default rules with authenticated schema-checked rules.
