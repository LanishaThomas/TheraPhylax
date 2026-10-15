const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("theraphylax_auth_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      localStorage.removeItem("theraphylax_auth_token");
      localStorage.removeItem("theraphylax_user");
    }

    const contentType = response.headers.get("content-type");
    let data = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || `HTTP Error ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Unable to connect to the backend server. Please verify FastAPI is running.");
    }
    throw error;
  }
}

export const apiService = {
  // Reports / Incidents
  getReports: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/reports${query ? `?${query}` : ""}`);
  },
  getReportById: async (id) => {
    return apiRequest(`/reports/${id}`);
  },
  createReport: async (reportData) => {
    return apiRequest("/reports", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
  },
  updateReportStatus: async (id, status, notes) => {
    return apiRequest(`/reports/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    });
  },

  // Disaster Alerts & Geographic Alerting
  getAlerts: async () => {
    return apiRequest("/alerts");
  },
  createGeographicAlert: async (alertData) => {
    return apiRequest("/alerts", {
      method: "POST",
      body: JSON.stringify(alertData),
    });
  },

  // Public Community Updates
  getPublicUpdates: async () => {
    return apiRequest("/updates");
  },
  createPublicUpdate: async (updateData) => {
    return apiRequest("/updates", {
      method: "POST",
      body: JSON.stringify(updateData),
    });
  },

  // Emergency Contacts
  getEmergencyContacts: async () => {
    return apiRequest("/emergency-contacts");
  },

  // Forest Officer Stations, Districts & Rapid Patrols
  getForestDistricts: async () => {
    return apiRequest("/forest/districts");
  },
  getForestStations: async (district = "") => {
    const q = district ? `?district=${encodeURIComponent(district)}` : "";
    return apiRequest(`/forest/stations${q}`);
  },
  getForestDispatches: async () => {
    return apiRequest("/forest/dispatches");
  },
  getMyReports: async (userEmail) => {
    const q = userEmail ? `?user_email=${encodeURIComponent(userEmail)}` : "";
    return apiRequest(`/reports${q}`);
  },

  // Stats & Risks
  getRisks: async () => {
    return apiRequest("/risks");
  },
  getDashboardStats: async () => {
    return apiRequest("/dashboard/stats");
  },
  getUserProfile: async () => {
    return apiRequest("/auth/me");
  },
  updateUserProfile: async (data) => {
    return apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  checkHealth: async () => {
    return apiRequest("/health");
  }
};
