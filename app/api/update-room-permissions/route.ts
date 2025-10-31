import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  try {
    const { roomId, userId, permissions } = await request.json();

    if (!roomId || !userId) {
      return new Response("Missing required fields", { status: 400 });
    }

    // If permissions is null, we're removing the user
    const usersAccesses =
      permissions === null ? { [userId]: null } : { [userId]: permissions };

    // Update the room permissions on Liveblocks
    await liveblocks.updateRoom(roomId, {
      usersAccesses,
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
