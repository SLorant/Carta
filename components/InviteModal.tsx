"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RoomService, MapRoom } from "@/lib/roomService";
import { Select } from "./inputs/Select";
import { CancelButton, PrimaryButton } from "./general/Button";
import Modal from "./general/Modal";
import { TextInput } from "./inputs/TextInput";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: MapRoom;
  onInviteSent: () => void;
}

const InviteModal = ({
  isOpen,
  onClose,
  room,
  onInviteSent,
}: InviteModalProps) => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentRoom, setCurrentRoom] = useState<MapRoom | null>(room);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);

  // Refresh room data when modal opens
  useEffect(() => {
    if (isOpen) {
      const refreshRoom = async () => {
        const updatedRoom = await RoomService.getRoomById(room.id);
        setCurrentRoom(updatedRoom);
      };
      refreshRoom();
    }
  }, [isOpen, room.id]);

  const handleRemoveUser = async (userId: string) => {
    if (!user) return;

    setRemoveLoading(userId);
    setMessage("");

    try {
      const removerId = user.email || user.uid;
      const success = await RoomService.removeUserFromRoom(
        room.id,
        userId,
        removerId
      );

      if (success) {
        setMessage(`User removed from room`);
        // Refresh the room data
        const updatedRoom = await RoomService.getRoomById(room.id);
        setCurrentRoom(updatedRoom);
        onInviteSent(); // Notify parent that changes were made
        setTimeout(() => {
          setMessage("");
        }, 3000);
      } else {
        setMessage("Failed to remove user. You may not have permission.");
      }
    } catch (error) {
      console.error("Failed to remove user:", error);
      setMessage("Failed to remove user.");
    } finally {
      setRemoveLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      // Use email as the inviter ID for consistency
      const inviterId = user.email || user.uid;
      const success = await RoomService.inviteUserToRoom(
        room.id,
        email.trim(),
        role,
        inviterId
      );

      if (success) {
        setMessage(`Invitation sent to ${email}`);
        setEmail("");
        // Refresh the room data
        const updatedRoom = await RoomService.getRoomById(room.id);
        setCurrentRoom(updatedRoom);
        onInviteSent();
        setTimeout(() => {
          setMessage("");
        }, 3000);
      } else {
        setMessage("Failed to send invitation. You may not have permission.");
      }
    } catch (error) {
      console.error("Failed to invite user:", error);
      setMessage("Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  };

  const roomData = currentRoom || room;
  const isOwner =
    user &&
    (user.email === roomData.createdBy || user.uid === roomData.createdBy);

  // Get all users with permissions (excluding duplicates)
  const allUsers = roomData.permissions.filter(
    (permission, index, self) =>
      index === self.findIndex((p) => p.userId === permission.userId)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage "${roomData.name}"`}
      subtitle="Invite collaborators and manage access"
    >
      {message && (
        <div
          className={`mb-4 px-3 py-2 rounded-lg ${
            message.includes("sent") || message.includes("removed")
              ? " text-green-400 border border-green-300"
              : " text-red-400 border border-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* Current Users Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-secondary mb-3">
          Current Users
        </h3>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {allUsers.map((permission) => (
            <div
              key={permission.userId}
              className="flex items-center justify-between p-3 border border-primary rounded-lg"
            >
              <div className="flex-1">
                <div className="text-white font-medium">
                  {permission.userId}
                  {permission.userId === roomData.createdBy && (
                    <span className="ml-2 text-xs border border-green-400 text-white px-2 py-1 rounded">
                      Owner
                    </span>
                  )}
                </div>
                <div className="text-gray-400 text-sm capitalize">
                  {permission.role}
                </div>
              </div>

              {isOwner && permission.userId !== roomData.createdBy && (
                <button
                  onClick={() => handleRemoveUser(permission.userId)}
                  disabled={removeLoading === permission.userId}
                  className="ml-3 px-3 py-1 text-sm bg-red-700 hover:bg-red-400 cursor-pointer disabled:bg-red-800 text-white rounded transition-colors"
                >
                  {removeLoading === permission.userId
                    ? "Removing..."
                    : "Remove"}
                </button>
              )}
            </div>
          ))}

          {allUsers.length === 0 && (
            <div className="text-gray-400 text-center py-4">
              No users have been invited yet
            </div>
          )}
        </div>
      </div>

      {/* Invite New User Section */}
      {isOwner && (
        <>
          <hr className="border-gray-700 mb-6" />
          <div>
            <h3 className="text-lg font-semibold text-secondary mb-3">
              Invite New User
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextInput
                id="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address..."
                required
              />

              <Select
                id="role"
                value={role}
                label="Permission Level"
                onChange={(value) => setRole(value as "editor" | "viewer")}
                options={[
                  {
                    value: "editor",
                    label: "Editor - Can edit the map",
                  },
                  {
                    value: "viewer",
                    label: "Viewer - Can only view the map",
                  },
                ]}
              />

              <div className="flex gap-4 pt-2">
                <PrimaryButton
                  type="submit"
                  disabled={loading || !email.trim()}
                >
                  {loading ? "Sending..." : "Send Invite"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </>
      )}

      {!isOwner && (
        <div className="text-center py-4 text-gray-400">
          Only the room owner can manage invitations
        </div>
      )}

      <div className="flex justify-end pt-4 mt-6 border-t border-gray-700">
        <CancelButton type="button" onClick={onClose}>
          Close
        </CancelButton>
      </div>
    </Modal>
  );
};

export default InviteModal;
