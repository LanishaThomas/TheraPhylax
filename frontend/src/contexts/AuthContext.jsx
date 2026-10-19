import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, isCognitoConfigured } from "../services/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = authService.getCurrentUser();
    const token = authService.getToken();
    if (savedUser && token) {
      if ((savedUser.assigned_station || savedUser.role?.toLowerCase() === "officer") && savedUser.role !== "Officer") {
        savedUser.role = "Officer";
        localStorage.setItem("theraphylax_user", JSON.stringify(savedUser));
      }
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setUser(res.user);
    return res;
  };

  const register = async (data) => {
    return await authService.register(data);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    localStorage.setItem("theraphylax_user", JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        role: user?.role || "Citizen",
        loading,
        login,
        register,
        logout,
        updateUser,
        cognitoActive: isCognitoConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
