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
  private static readonly ROOMS_KEY = "carta_user_rooms";

  static getUserRooms(userId: string): MapRoom[] {
    if (typeof window === "undefined") return [];

    const allRooms = this.getAllRooms();
    return allRooms.filter(
      (room) =>
        room.createdBy === userId ||
        room.permissions.some((p) => p.userId === userId)
    );
  }

  static getUserRoomsByEmail(userEmail: string): MapRoom[] {
    if (typeof window === "undefined") return [];

    const allRooms = this.getAllRooms();
    return allRooms.filter(
      (room) =>
        room.createdBy === userEmail ||
        room.permissions.some((p) => p.userId === userEmail)
    );
  }

  // Get all rooms for the current user (local and from server)
  static async getAllUserRooms(
    userId: string,
    idToken?: string
  ): Promise<MapRoom[]> {
    if (typeof window === "undefined") return [];

    const localRooms = this.getAllRooms().filter(
      (room) =>
        room.createdBy === userId ||
        room.permissions.some((p) => p.userId === userId)
    );

    // If no ID token, only return local rooms
    if (!idToken) {
      return localRooms;
    }

    try {
      // Fetch rooms from server that user has access to
      const response = await fetch("/api/get-user-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        console.error("Failed to fetch server rooms");
        return localRooms;
      }

      const { success, rooms: serverRooms } = await response.json();

      if (!success || !serverRooms) {
        return localRooms;
      }

      // Merge local and server rooms, removing duplicates
      const allRooms = [...localRooms];

      for (const serverRoom of serverRooms) {
        if (!allRooms.find((room) => room.id === serverRoom.id)) {
          allRooms.push(serverRoom);
        }
      }

      return allRooms;
    } catch (error) {
      console.error("Error fetching server rooms:", error);
      return localRooms;
    }
  }

  static getAllRooms(): MapRoom[] {
    if (typeof window === "undefined") return [];

    const rooms = localStorage.getItem(this.ROOMS_KEY);
    return rooms ? JSON.parse(rooms) : [];
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

    // Store locally first
    const allRooms = this.getAllRooms();
    allRooms.push(newRoom);
    localStorage.setItem(this.ROOMS_KEY, JSON.stringify(allRooms));

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

      console.log("Room created successfully on Liveblocks:", roomId);
    } catch (error) {
      console.error("Error creating room on Liveblocks:", error);
      // Remove the locally created room if Liveblocks creation fails
      const allRooms = this.getAllRooms();
      const filteredRooms = allRooms.filter((room) => room.id !== roomId);
      localStorage.setItem(this.ROOMS_KEY, JSON.stringify(filteredRooms));
      throw error; // Re-throw to let the caller handle it
    }
  }

  static deleteRoom(roomId: string, userId: string): boolean {
    const allRooms = this.getAllRooms();
    const roomIndex = allRooms.findIndex(
      (room) => room.id === roomId && room.createdBy === userId
    );

    if (roomIndex === -1) return false;

    allRooms.splice(roomIndex, 1);
    localStorage.setItem(this.ROOMS_KEY, JSON.stringify(allRooms));
    return true;
  }

  static shareRoom(
    roomId: string,
    targetUserId: string,
    role: "editor" | "viewer" = "editor"
  ): boolean {
    const allRooms = this.getAllRooms();
    const room = allRooms.find((r) => r.id === roomId);

    if (!room) return false;

    // Check if user already has permission
    const existingPermission = room.permissions.find(
      (p) => p.userId === targetUserId
    );
    if (existingPermission) {
      existingPermission.role = role;
    } else {
      room.permissions.push({ userId: targetUserId, role });
    }

    localStorage.setItem(this.ROOMS_KEY, JSON.stringify(allRooms));
    return true;
  }

  static getRoomById(roomId: string): MapRoom | null {
    const allRooms = this.getAllRooms();
    return allRooms.find((room) => room.id === roomId) || null;
  }

  static getUserPermission(
    roomId: string,
    userId: string
  ): "owner" | "editor" | "viewer" | null {
    const room = this.getRoomById(roomId);
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
      const inviterPermission = this.getUserPermission(roomId, inviterId);
      if (inviterPermission !== "owner") {
        return false;
      }

      // For now, use email as userId (in a real app, you'd look up the user)
      const userId = userEmail;

      // Update local storage
      const success = this.shareRoom(roomId, userId, role);
      if (!success) return false;

      // Update Liveblocks room permissions
      await this.updateLiveblocksRoomPermissions(roomId, userId, role);

      return true;
    } catch (error) {
      console.error("Failed to invite user:", error);
      return false;
    }
  }

  private static async updateLiveblocksRoomPermissions(
    roomId: string,
    userId: string,
    role: "editor" | "viewer"
  ): Promise<void> {
    try {
      console.log("calling api");
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
      console.log(response);
      if (!response.ok) {
        throw new Error("Failed to update room permissions");
      }
    } catch (error) {
      console.error("Error updating Liveblocks permissions:", error);
      // Don't throw here - we don't want to break the local invite if Liveblocks fails
    }
  }
}
