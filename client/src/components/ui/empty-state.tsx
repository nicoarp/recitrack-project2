import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface EmptyStateProps {
  icon: IconProp;
  message: string;
  className?: string;
}

export function EmptyState({ icon, message, className = "" }: EmptyStateProps) {
  return (
    <div className={`text-gray-500 text-center py-8 ${className}`}>
      <FontAwesomeIcon icon={icon} className="text-gray-300 text-4xl mb-2" />
      <p>{message}</p>
    </div>
  );
}
