"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RoomService, MapRoom } from "@/lib/roomService";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: MapRoom;
  onInviteSent: () => void;
}

export function InviteModal({
  isOpen,
  onClose,
  room,
  onInviteSent,
}: InviteModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
        onInviteSent();
        setTimeout(() => {
          setMessage("");
          onClose();
        }, 2000);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background rounded-lg p-8 w-full max-w-md mx-4 border border-gray-200">
        <h2 className="text-2xl font-bold text-primary mb-2">
          Invite to &quot;{room.name}&quot;
        </h2>
        <p className="text-gray-600 mb-6">
          Invite someone to collaborate on this map
        </p>

        {message && (
          <div
            className={`mb-4 p-3 rounded ${
              message.includes("sent")
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter email address..."
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Permission Level
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="editor">Editor - Can edit the map</option>
              <option value="viewer">Viewer - Can only view the map</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-background rounded-md hover:bg-primary/90 disabled:opacity-50"
              disabled={loading || !email.trim()}
            >
              {loading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
