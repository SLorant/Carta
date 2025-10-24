export interface MapRoom {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  createdBy: string;
  createdAt: string;
  permissions: {
    userId: string;
    role: "owner" | "editor" | "viewer";
  }[];
}

export class RoomService {
  static async getUserRooms(userId: string): Promise<MapRoom[]> {
    if (typeof window === "undefined") return [];

    const allRooms = await this.getAllRooms();
    return allRooms.filter(
      (room) =>
        room.createdBy === userId ||
        room.permissions.some((p) => p.userId === userId)
    );
  }

  static async getUserRoomsByEmail(userEmail: string): Promise<MapRoom[]> {
    if (typeof window === "undefined") return [];

    const allRooms = await this.getAllRooms();
    return allRooms.filter(
      (room) =>
        room.createdBy === userEmail ||
        room.permissions.some((p) => p.userId === userEmail)
    );
  }

  // Get all rooms for the current user (from Liveblocks server)
  static async getAllUserRooms(): Promise<MapRoom[]> {
    if (typeof window === "undefined") return [];

    // Since getAllRooms now fetches from Liveblocks, just use it directly
    return await this.getAllRooms();
  }

  static async getAllRooms(): Promise<MapRoom[]> {
    if (typeof window === "undefined") return [];

    try {
      // Get Firebase ID token for authentication
      const { auth } = await import("@/firebase.config");
      const user = auth.currentUser;

      if (!user) {
        return [];
      }

      const idToken = await user.getIdToken();

      // Fetch rooms from Liveblocks server
      const response = await fetch("/api/get-user-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        console.error("Failed to fetch rooms from server");
        return [];
      }

      const { success, rooms } = await response.json();

      if (!success || !rooms) {
        return [];
      }

      return rooms;
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return [];
    }
  }

  static async createRoom(
    userId: string,
    name: string,
    description: string,
    imageUrl: string = "/map2.jpg"
  ): Promise<MapRoom> {
    const roomId = `room_${userId}_${Date.now()}`;

    const newRoom: MapRoom = {
      id: roomId,
      name,
      description,
      imageUrl,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      permissions: [
        {
          userId,
          role: "owner",
        },
      ],
    };

    // Create the room on Liveblocks server first
    await this.createLiveblocksRoom(roomId, newRoom);

    // Create the room on Liveblocks server
    await this.createLiveblocksRoom(roomId, newRoom);

    return newRoom;
  }

  private static async createLiveblocksRoom(
    roomId: string,
    roomData: MapRoom
  ): Promise<void> {
    try {
      // Get Firebase ID token for authentication
      const { auth } = await import("@/firebase.config");
      const user = auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated");
      }

      const idToken = await user.getIdToken();

      // Call our API to create the room on Liveblocks
      const response = await fetch("/api/create-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          roomId,
          roomData: {
            name: roomData.name,
            description: roomData.description,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create room on Liveblocks");
      }
    } catch (error) {
      console.error("Error creating room on Liveblocks:", error);
      throw error; // Re-throw to let the caller handle it
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async deleteRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      // Get Firebase ID token for authentication
      const { auth } = await import("@/firebase.config");
      const user = auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated");
      }

      const idToken = await user.getIdToken();

      // Call our API to delete the room from Liveblocks
      const response = await fetch("/api/delete-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          roomId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete room");
      }

      return true;
    } catch (error) {
      console.error("Error deleting room:", error);
      return false;
    }
  }

  static async shareRoom(
    roomId: string,
    targetUserId: string,
    role: "editor" | "viewer" = "editor"
  ): Promise<boolean> {
    try {
      // Update Liveblocks room permissions directly
      await this.updateLiveblocksRoomPermissions(roomId, targetUserId, role);
      return true;
    } catch (error) {
      console.error("Failed to share room:", error);
      return false;
    }
  }

  static async getRoomById(roomId: string): Promise<MapRoom | null> {
    const allRooms = await this.getAllRooms();
    return allRooms.find((room) => room.id === roomId) || null;
  }

  static async updateRoom(
    roomId: string,
    updates: { name?: string; description?: string }
  ): Promise<MapRoom | null> {
    // For now, return null since we need to implement room updates in Liveblocks
    // This would require a new API endpoint to update room metadata in Liveblocks
    console.warn(
      `Room updates not implemented for Liveblocks. Room: ${roomId}, Updates:`,
      updates
    );
    return null;
  }

  static async getUserPermission(
    roomId: string,
    userId: string
  ): Promise<"owner" | "editor" | "viewer" | null> {
    const room = await this.getRoomById(roomId);
    if (!room) return null;

    if (room.createdBy === userId) return "owner";

    const permission = room.permissions.find((p) => p.userId === userId);
    return permission?.role || null;
  }

  static async inviteUserToRoom(
    roomId: string,
    userEmail: string,
    role: "editor" | "viewer",
    inviterId: string
  ): Promise<boolean> {
    try {
      // Check if the inviter has permission to invite
      const inviterPermission = await this.getUserPermission(roomId, inviterId);
      if (inviterPermission !== "owner") {
        return false;
      }

      // For now, use email as userId (in a real app, you'd look up the user)
      const userId = userEmail;

      // Update Liveblocks room permissions
      const success = await this.shareRoom(roomId, userId, role);
      if (!success) return false;

      return true;
    } catch (error) {
      console.error("Failed to invite user:", error);
      return false;
    }
  }

  static async removeUserFromRoom(
    roomId: string,
    userIdToRemove: string,
    removerId: string
  ): Promise<boolean> {
    try {
      // Check if the remover has permission to remove users (must be owner)
      const removerPermission = await this.getUserPermission(roomId, removerId);
      if (removerPermission !== "owner") {
        return false;
      }

      // Get the room
      const room = await this.getRoomById(roomId);
      if (!room) return false;

      // Can't remove the owner
      if (room.createdBy === userIdToRemove) {
        return false;
      }

      // Remove from Liveblocks
      await this.removeLiveblocksRoomPermissions(roomId, userIdToRemove);

      return true;
    } catch (error) {
      console.error("Failed to remove user from room:", error);
      return false;
    }
  }

  private static async removeLiveblocksRoomPermissions(
    roomId: string,
    userId: string
  ): Promise<void> {
    try {
      // Call our API to remove Liveblocks room permissions
      const response = await fetch("/api/update-room-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          userId,
          permissions: null, // null removes access completely
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove room permissions");
      }
    } catch (error) {
      console.error("Error removing Liveblocks permissions:", error);
      // Don't throw here - we don't want to break the local removal if Liveblocks fails
    }
  }

  private static async updateLiveblocksRoomPermissions(
    roomId: string,
    userId: string,
    role: "editor" | "viewer"
  ): Promise<void> {
    try {
      // Call our API to update Liveblocks room permissions
      const response = await fetch("/api/update-room-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          userId,
          permissions:
            role === "editor"
              ? ["room:write"]
              : ["room:read", "room:presence:write"],
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update room permissions");
      }
    } catch (error) {
      console.error("Error updating Liveblocks permissions:", error);
      // Don't throw here - we don't want to break the local invite if Liveblocks fails
    }
  }
}
