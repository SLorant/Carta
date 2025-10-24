"use client";

import React, { useState } from "react";
import { MapRoom, RoomService } from "@/lib/roomService";
import Modal from "@/components/general/Modal";
import { TextInput } from "@/components/inputs/TextInput";
import { TextareaInput } from "@/components/inputs/Textarea";
import { PrimaryButton, CancelButton } from "@/components/general/Button";
import { useAuth } from "@/components/AuthProvider";

interface EditMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: MapRoom;
  onMapUpdated: () => void;
  onMapDeleted?: () => void;
}

export const EditMapModal = ({
  isOpen,
  onClose,
  room,
  onMapUpdated,
  onMapDeleted,
}: EditMapModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens with new room
  React.useEffect(() => {
    if (isOpen) {
      setName(room.name);
      setDescription(room.description);
      setError("");
      setShowDeleteConfirm(false);
    }
  }, [isOpen, room.name, room.description]);

  const handleDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    setError("");

    try {
      const userId = user.email || user.uid;
      const success = await RoomService.deleteRoom(room.id, userId);

      if (success) {
        onMapDeleted?.();
        onClose();
      } else {
        setError("Failed to delete map. You may not have permission.");
      }
    } catch (error) {
      console.error("Error deleting map:", error);
      setError("Failed to delete map. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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
    if (!isLoading && !isDeleting) {
      setShowDeleteConfirm(false);
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
            disabled={isLoading || isDeleting}
          >
            Cancel
          </CancelButton>
          <PrimaryButton
            type="submit"
            disabled={isLoading || isDeleting || !name.trim()}
          >
            {isLoading ? "Updating..." : "Update Map"}
          </PrimaryButton>
        </div>
      </form>

      {/* Delete Section - Only show for room owners */}
      {user &&
        (user.email === room.createdBy || user.uid === room.createdBy) && (
          <>
            <hr className="border-gray-700 my-6" />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-400">
                Danger Zone
              </h3>

              {!showDeleteConfirm ? (
                <div className="flex items-center justify-between p-4 border border-red-500/30 rounded-lg bg-red-500/5">
                  <div>
                    <p className="text-white font-medium">Delete this map</p>
                    <p className="text-gray-400 text-xs">
                      This action cannot be undone. All collaborators will lose
                      access.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isLoading || isDeleting}
                    className="px-4 py-2 w-40 cursor-pointer bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-md transition-colors"
                  >
                    Delete Map
                  </button>
                </div>
              ) : (
                <div className="p-4 border border-red-500 rounded-lg bg-red-500/10">
                  <p className="text-white font-medium mb-4">
                    Are you sure you want to delete this map?
                  </p>
                  <p className="text-gray-300 text-sm mb-4">
                    This will permanently delete &ldquo;{room.name}&rdquo; and
                    remove access for all collaborators. This action cannot be
                    undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="px-4 py-2 cursor-pointer bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 cursor-pointer bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-md transition-colors"
                    >
                      {isDeleting ? "Deleting..." : "Yes, Delete Map"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
    </Modal>
  );
};
