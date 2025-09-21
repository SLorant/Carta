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
    const userId = email || uid;

    // Get all rooms and filter for ones where user has access
    const { data: rooms } = await liveblocks.getRooms({
      limit: 100, // Adjust as needed
    });

    // Filter rooms where the user has access
    const accessibleRooms = rooms.filter((room) => {
      const usersAccesses = room.usersAccesses || {};
      return usersAccesses[userId] && usersAccesses[userId].length > 0;
    });

    // Transform Liveblocks room data to our format
    const userRooms = accessibleRooms.map((room) => ({
      id: room.id,
      name: room.metadata?.name || "Untitled Map",
      description: room.metadata?.description || "",
      imageUrl: "/map2.jpg", // Default image
      createdBy: room.metadata?.createdBy || "",
      createdAt: room.metadata?.createdAt || new Date().toISOString(),
      permissions: Object.entries(room.usersAccesses || {}).map(
        ([userId, permissions]) => ({
          userId,
          role: (permissions as string[]).includes("room:write")
            ? "editor"
            : ("viewer" as "owner" | "editor" | "viewer"),
        })
      ),
    }));

    return Response.json({
      success: true,
      rooms: userRooms,
    });
  } catch (error: unknown) {
    console.error("Error fetching user rooms:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage || "Failed to fetch user rooms",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
