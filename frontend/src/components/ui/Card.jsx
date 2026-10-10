import React from "react";

export const Card = ({ children, title, subtitle, className = "", action, style }) => {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || subtitle || action) && (
        <div className="flex-between" style={{ marginBottom: "1rem" }}>
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
