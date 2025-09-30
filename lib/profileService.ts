import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/firebase.config";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  bio?: string;
  profilePictureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    console.log("Getting user profile for UID:", uid);
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        uid,
        email: data.email,
        displayName: data.displayName,
        bio: data.bio,
        profilePictureUrl: data.profilePictureUrl,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } else {
      console.log("No user profile found for UID:", uid);
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

export async function getUserProfileByEmail(
  email: string
): Promise<UserProfile | null> {
  try {
    console.log("Getting user profile for email:", email);
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        bio: data.bio,
        profilePictureUrl: data.profilePictureUrl,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } else {
      console.log("No user profile found for email:", email);
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile by email:", error);
    throw error;
  }
}

// Helper function to get user profile by either UID or email
export async function getUserProfileByIdOrEmail(
  identifier: string
): Promise<UserProfile | null> {
  try {
    // Check if identifier looks like an email
    if (identifier.includes("@")) {
      return await getUserProfileByEmail(identifier);
    } else {
      return await getUserProfile(identifier);
    }
  } catch (error) {
    console.error("Error getting user profile by identifier:", error);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    console.log("Saving user profile:", profile);
    const docRef = doc(db, "users", profile.uid);

    const profileData = {
      ...profile,
      createdAt: profile.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, profileData, { merge: true });
    console.log("User profile saved successfully");
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

export async function updateProfilePictureUrl(
  uid: string,
  profilePictureUrl: string
): Promise<void> {
  try {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, {
      profilePictureUrl,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating profile picture URL:", error);
    throw error;
  }
}

export async function removeProfilePictureUrl(uid: string): Promise<void> {
  try {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, {
      profilePictureUrl: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error removing profile picture URL:", error);
    throw error;
  }
}

export async function uploadProfilePicture(
  uid: string,
  file: File
): Promise<string> {
  try {
    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Please upload an image file (JPEG, PNG, GIF, or WebP)."
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error(
        "File size too large. Please upload an image smaller than 5MB."
      );
    }

    // Create a unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${timestamp}.${fileExtension}`;

    const storageRef = ref(storage, `profile-pictures/${uid}/${fileName}`);

    console.log("Uploading file to:", `profile-pictures/${uid}/${fileName}`);

    // Upload with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: uid,
        originalName: file.name,
      },
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log("File uploaded successfully, download URL:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
}

export async function deleteProfilePicture(downloadURL: string): Promise<void> {
  try {
    // Extract the path from the download URL
    const url = new URL(downloadURL);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);

    if (pathMatch) {
      const path = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      console.log("Profile picture deleted successfully");
    } else {
      console.warn("Could not extract path from URL:", downloadURL);
    }
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    // Don't throw here as the file might already be deleted
  }
}
