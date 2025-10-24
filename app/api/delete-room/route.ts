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
    const { idToken, roomId } = await request.json();

    if (!idToken || !roomId) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;
    const userId = email || uid;

    // Get the room to verify ownership
    const room = await liveblocks.getRoom(roomId);
    
    if (!room) {
      return new Response("Room not found", { status: 404 });
    }

    // Check if the user is the owner
    const createdBy = room.metadata?.createdBy;
    if (createdBy !== userId) {
      return new Response("Only the room owner can delete the room", { status: 403 });
    }

    // Delete the room from Liveblocks
    await liveblocks.deleteRoom(roomId);

    return Response.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting room:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage || "Failed to delete room",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
