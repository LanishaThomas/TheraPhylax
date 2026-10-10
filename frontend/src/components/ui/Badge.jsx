import React from "react";

export const Badge = ({ children, variant = "default", className = "" }) => {
  const variantClass = `badge-${variant.toLowerCase()}`;
  return (
    <span className={`badge ${variantClass} ${className}`}>
      {children}
    </span>
  );
};
