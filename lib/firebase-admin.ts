import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let firebaseApp: App | null = null;

export function getFirebaseAdmin() {
  // Check if we already have an initialized app
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if any apps exist
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    return firebaseApp;
  }

  // Validate required environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase configuration. Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
    );
  }

  try {
    // Initialize Firebase Admin
    firebaseApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });

    return firebaseApp;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw new Error("Failed to initialize Firebase Admin SDK");
  }
}

export function getFirebaseAuth() {
  const app = getFirebaseAdmin();
  return getAuth(app);
}
