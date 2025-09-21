import { Liveblocks } from "@liveblocks/node";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // Use email as userId for consistency with invitations
    // Fall back to uid if email is not available
    const userId = email || uid;

    console.log(decodedToken);

    // Use identifyUser for ID token authentication
    // The permissions are managed on the room level, not here
    const { status, body } = await liveblocks.identifyUser({
      userId: userId, // Use email as the primary identifier for consistency
      groupIds: [], // No groups for now
    });

    return new Response(body, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
