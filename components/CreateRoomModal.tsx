"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RoomService } from "@/lib/roomService";
import Modal from "./general/Modal";
import { CancelButton, PrimaryButton } from "./general/Button";
import { TextInput } from "./inputs/TextInput";
import { TextareaInput } from "./inputs/Textarea";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: () => void;
}

export function CreateRoomModal({
  isOpen,
  onClose,
  onRoomCreated,
}: CreateRoomModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    try {
      // Use email as the userId for consistency with Liveblocks auth
      const userId = user.email || user.uid;
      await RoomService.createRoom(userId, name.trim(), description.trim());
      setName("");
      setDescription("");
      onRoomCreated();
      onClose();
    } catch (error) {
      console.error("Failed to create room:", error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Create New Map`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter map name..."
          label="Map Name"
          required
        />

        <TextareaInput
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description..."
          label="Description"
          rows={3}
        />

        <div className="flex gap-4 pt-2">
          <CancelButton type="button" onClick={onClose} disabled={loading}>
            Cancel
          </CancelButton>
          <PrimaryButton type="submit" disabled={loading || !name.trim()}>
            {loading ? "Creating..." : "Create Map"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
