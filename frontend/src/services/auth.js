import { apiRequest } from "./api";

const COGNITO_REGION = import.meta.env.VITE_AWS_REGION || "ap-south-1";
const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || "";
const COGNITO_APP_CLIENT_ID = import.meta.env.VITE_COGNITO_APP_CLIENT_ID || "";

export const isCognitoConfigured = () => {
  return Boolean(COGNITO_USER_POOL_ID && COGNITO_APP_CLIENT_ID);
};

export const getRedirectPathForRole = (role) => {
  const r = (role || "").toLowerCase();
  if (r === "officer" || r === "responder") return "/officer/dashboard";
  if (r === "ngo") return "/ngo/dashboard";
  if (r === "admin") return "/admin";
  return "/dashboard";
};

export const authService = {
  login: async (email, password) => {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    if (isCognitoConfigured()) {
      try {
        const response = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-amz-json-1.1",
            "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
          },
          body: JSON.stringify({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: COGNITO_APP_CLIENT_ID,
            AuthParameters: {
              USERNAME: email,
              PASSWORD: password,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorType = data.__type || "";
          if (errorType.includes("NotAuthorizedException")) {
            throw new Error("Incorrect email or password.");
          } else if (errorType.includes("UserNotFoundException")) {
            throw new Error("User account not found.");
          } else if (errorType.includes("UserNotConfirmedException")) {
            const err = new Error("Email address is not yet verified. Please verify your email code.");
            err.code = "UserNotConfirmedException";
            err.email = email;
            throw err;
          } else {
            throw new Error(data.message || "Cognito authentication failed.");
          }
        }

        const authResult = data.AuthenticationResult;
        const idToken = authResult.IdToken;
        const accessToken = authResult.AccessToken;
        const refreshToken = authResult.RefreshToken;

        let payload = {};
        try {
          const base64Url = idToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          payload = JSON.parse(window.atob(base64));
        } catch {
          payload = { email };
        }

        const user = {
          email: payload.email || email,
          name: payload.name || payload.given_name || email.split("@")[0],
          role: payload["custom:role"] || payload.role || "Citizen",
          sub: payload.sub,
        };

        localStorage.setItem("theraphylax_auth_token", idToken);
        localStorage.setItem("theraphylax_access_token", accessToken);
        if (refreshToken) localStorage.setItem("theraphylax_refresh_token", refreshToken);
        localStorage.setItem("theraphylax_user", JSON.stringify(user));

        return { user, token: idToken, redirectPath: getRedirectPathForRole(user.role) };
      } catch (err) {
        if (err.code === "UserNotConfirmedException") throw err;
        try {
          const apiRes = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          const user = apiRes.user || { email, name: email.split("@")[0], role: "Citizen" };
          localStorage.setItem("theraphylax_auth_token", apiRes.token || apiRes.access_token);
          localStorage.setItem("theraphylax_user", JSON.stringify(user));
          return { user, token: apiRes.token, redirectPath: getRedirectPathForRole(user.role) };
        } catch {
          throw err;
        }
      }
    } else {
      const apiRes = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const user = apiRes.user || { email, name: email.split("@")[0], role: "Citizen" };
      localStorage.setItem("theraphylax_auth_token", apiRes.token || apiRes.access_token);
      localStorage.setItem("theraphylax_user", JSON.stringify(user));
      return { user, token: apiRes.token, redirectPath: getRedirectPathForRole(user.role) };
    }
  },

  register: async ({ name, email, password }) => {
    if (!name || !email || !password) {
      throw new Error("All fields are required.");
    }

    if (password.length < 12) {
      throw new Error("Password must be at least 12 characters long.");
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      throw new Error("Password must contain uppercase, lowercase, numbers, and special symbols.");
    }

    if (isCognitoConfigured()) {
      let userAttrs = [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
        { Name: "custom:role", Value: "Citizen" },
      ];

      let response = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp",
        },
        body: JSON.stringify({
          ClientId: COGNITO_APP_CLIENT_ID,
          Username: email,
          Password: password,
          UserAttributes: userAttrs,
        }),
      });

      let data = await response.json();

      if (!response.ok && data.message?.includes("custom:role")) {
        response = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-amz-json-1.1",
            "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp",
          },
          body: JSON.stringify({
            ClientId: COGNITO_APP_CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [
              { Name: "email", Value: email },
              { Name: "name", Value: name },
            ],
          }),
        });
        data = await response.json();
      }

      if (!response.ok) {
        if (data.__type?.includes("UsernameExistsException")) {
          throw new Error("An account with this email address already exists.");
        } else if (data.__type?.includes("InvalidPasswordException")) {
          throw new Error("Password does not meet AWS Cognito security requirements.");
        } else {
          throw new Error(data.message || "Registration failed.");
        }
      }

      return {
        success: true,
        email: email,
        userSub: data.UserSub,
        userConfirmed: data.UserConfirmed,
        message: "Registration successful! Enter the 6-digit code sent to your email to verify.",
      };
    } else {
      return apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role: "Citizen" }),
      });
    }
  },

  confirmSignUp: async (email, code) => {
    if (!email || !code) {
      throw new Error("Email and verification code are required.");
    }

    if (isCognitoConfigured()) {
      const response = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.ConfirmSignUp",
        },
        body: JSON.stringify({
          ClientId: COGNITO_APP_CLIENT_ID,
          Username: email,
          ConfirmationCode: code,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.__type?.includes("CodeMismatchException")) {
          throw new Error("Invalid verification code. Please check your email and try again.");
        } else if (data.__type?.includes("ExpiredCodeException")) {
          throw new Error("Verification code has expired. Please click 'Resend Code'.");
        } else if (data.__type?.includes("NotAuthorizedException")) {
          throw new Error("User account is already verified.");
        }
        throw new Error(data.message || "Failed to verify email.");
      }

      return { success: true, message: "Email address verified successfully! You can now sign in." };
    } else {
      return apiRequest("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
    }
  },

  resendConfirmationCode: async (email) => {
    if (!email) throw new Error("Email address is required.");

    if (isCognitoConfigured()) {
      const response = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.ResendConfirmationCode",
        },
        body: JSON.stringify({
          ClientId: COGNITO_APP_CLIENT_ID,
          Username: email,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to resend confirmation code.");
      }
      return { success: true, message: "A new verification code has been sent to your email inbox." };
    } else {
      return apiRequest("/auth/resend-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    }
  },

  forgotPassword: async (email) => {
    if (!email) throw new Error("Email address is required.");

    if (isCognitoConfigured()) {
      const response = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.ForgotPassword",
        },
        body: JSON.stringify({
          ClientId: COGNITO_APP_CLIENT_ID,
          Username: email,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset code.");
      }
      return { success: true, message: "Verification code sent to your email address." };
    } else {
      return apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    }
  },

  confirmForgotPassword: async (email, code, newPassword) => {
    if (!email || !code || !newPassword) {
      throw new Error("All fields are required.");
    }

    if (isCognitoConfigured()) {
      const response = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.ConfirmForgotPassword",
        },
        body: JSON.stringify({
          ClientId: COGNITO_APP_CLIENT_ID,
          Username: email,
          ConfirmationCode: code,
          Password: newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.__type?.includes("CodeMismatchException")) {
          throw new Error("Invalid verification code.");
        } else if (data.__type?.includes("ExpiredCodeException")) {
          throw new Error("Verification code has expired. Please request a new code.");
        }
        throw new Error(data.message || "Failed to reset password.");
      }
      return { success: true, message: "Password reset successful! You may now sign in with your new password." };
    } else {
      return apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword }),
      });
    }
  },

  logout: () => {
    localStorage.removeItem("theraphylax_auth_token");
    localStorage.removeItem("theraphylax_access_token");
    localStorage.removeItem("theraphylax_refresh_token");
    localStorage.removeItem("theraphylax_user");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("theraphylax_user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem("theraphylax_auth_token");
  },
};
