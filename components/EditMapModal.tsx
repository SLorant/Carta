"use client";

import React, { useState } from "react";
import { MapRoom, RoomService } from "@/lib/roomService";
import Modal from "@/components/general/Modal";
import { TextInput } from "@/components/inputs/TextInput";
import { TextareaInput } from "@/components/inputs/Textarea";
import { PrimaryButton, CancelButton } from "@/components/general/Button";

interface EditMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: MapRoom;
  onMapUpdated: () => void;
}

export const EditMapModal = ({
  isOpen,
  onClose,
  room,
  onMapUpdated,
}: EditMapModalProps) => {
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens with new room
  React.useEffect(() => {
    if (isOpen) {
      setName(room.name);
      setDescription(room.description);
      setError("");
    }
  }, [isOpen, room.name, room.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Map name is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const updatedRoom = await RoomService.updateRoom(room.id, {
        name: name.trim(),
        description: description.trim(),
      });

      if (updatedRoom) {
        await onMapUpdated();
        onClose();
      } else {
        setError("Failed to update map");
      }
    } catch (error) {
      console.error("Error updating map:", error);
      setError("Failed to update map. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Map"
      subtitle="Update your map's name and description"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Map Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter map name"
          required
          disabled={isLoading}
        />

        <TextareaInput
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter map description (optional)"
          rows={3}
          disabled={isLoading}
        />

        {error && <div className="text-red-400 text-sm mt-2">{error}</div>}

        <div className="flex gap-4 mt-6">
          <CancelButton
            type="button"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </CancelButton>
          <PrimaryButton type="submit" disabled={isLoading || !name.trim()}>
            {isLoading ? "Updating..." : "Update Map"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};
