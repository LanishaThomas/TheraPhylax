import React from "react";
import { Loader2 } from "lucide-react";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  className = "",
  icon: Icon,
  style,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${className}`}
      style={style}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === "sm" ? 14 : size === "lg" ? 22 : 18} />
      ) : Icon ? (
        <Icon size={size === "sm" ? 14 : size === "lg" ? 22 : 18} />
      ) : null}
      <span>{children}</span>
    </button>
  );
};
