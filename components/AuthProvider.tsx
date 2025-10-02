"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase.config";
import { LiveblocksProvider } from "@liveblocks/react/suspense";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthContext.Provider value={{ user, loading }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <LiveblocksProvider
        authEndpoint={async () => {
          const idToken = await user.getIdToken();
          const response = await fetch("/api/liveblocks-auth", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
          });

          if (!response.ok) {
            throw new Error("Failed to authenticate with Liveblocks");
          }

          const result = await response.json();
          return result;
        }}
        resolveUsers={async ({ userIds }) => {
          // For each userId (which is an email in our case), return user info
          return userIds.map((userId) => ({
            name: userId.split("@")[0], // Use the username part of the email
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              userId
            )}&background=random`, // Generate avatar from email
          }));
        }}
      >
        {children}
      </LiveblocksProvider>
    </AuthContext.Provider>
  );
}
