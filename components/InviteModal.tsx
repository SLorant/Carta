"use client";

import React, { useState } from "react";
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invite to "${room.name}"`}
      subtitle="Invite someone to collaborate on this map"
    >
      {message && (
        <div
          className={`mb-4 px-3 py-2 rounded-lg ${
            message.includes("sent")
              ? " text-green-400 border border-green-300"
              : " text-red-400 border border-red-300"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
          <CancelButton type="button" onClick={onClose} disabled={loading}>
            Cancel
          </CancelButton>
          <PrimaryButton type="submit" disabled={loading || !email.trim()}>
            {loading ? "Sending..." : "Send Invite"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};

export default InviteModal;
