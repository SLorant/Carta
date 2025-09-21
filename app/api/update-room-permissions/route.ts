import { Liveblocks } from "@liveblocks/node";
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
    const { roomId, userId, permissions } = await request.json();
    console.log("loading api");

    if (!roomId || !userId || !permissions) {
      console.log("missing fields");
      return new Response("Missing required fields", { status: 400 });
    }

    // Update the room permissions on Liveblocks
    await liveblocks.updateRoom(roomId, {
      usersAccesses: {
        [userId]: permissions,
      },
    });

    return Response.json({
      success: true,
      message: "Room permissions updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating room permissions:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage || "Failed to update room permissions",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
