"use client";

import React from "react";
import LoadingScreen from "./LoadingScreen";

interface WithLoadingProps {
  isLoading: boolean;
  loadingMessage?: string;
  children: React.ReactNode;
}

const WithLoading: React.FC<WithLoadingProps> = ({
  isLoading,
  loadingMessage = "Loading...",
  children,
}) => {
  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return <>{children}</>;
};

export default WithLoading;
