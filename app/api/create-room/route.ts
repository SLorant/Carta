import { Liveblocks } from "@liveblocks/node";
import { getFirebaseAuth } from "@/lib/firebase-admin";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  try {
    const { idToken, roomId, roomData } = await request.json();

    if (!idToken || !roomId) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Verify the Firebase ID token
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // Use email as userId for consistency with invitations
    const userId = email || uid;

    // Create the room on Liveblocks server
    const room = await liveblocks.createRoom(roomId, {
      defaultAccesses: [], // No default access
      usersAccesses: {
        [userId]: ["room:write"], // Give the creator full access
      },
      metadata: {
        createdBy: userId,
        name: roomData?.name || "Untitled Map",
        description: roomData?.description || "",
        createdAt: new Date().toISOString(),
      },
    });

    return Response.json({
      success: true,
      room: {
        id: room.id,
        metadata: room.metadata,
      },
    });
  } catch (error: unknown) {
    console.error("Error creating room:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // If room already exists, that's okay
    if (errorMessage.includes("already exists")) {
      return Response.json({
        success: true,
        message: "Room already exists",
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage || "Failed to create room",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
