interface JWTPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}

export function getCurrentUserId(): number {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) {
      throw new Error("Invalid token format");
    }
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload: JWTPayload = JSON.parse(jsonPayload);
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
      throw new Error("Token expired");
    }
    return payload.id;
  } catch {
    throw new Error("Failed to decode JWT token");
  }
}

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function setAuthToken(token: string, maxAgeSeconds: number = 604800): void {
  const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
  // Add Secure flag when running over HTTPS (production)
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `token=${token}; Path=/; SameSite=Lax; Expires=${expires}${secureFlag}`;
}

export function clearAuthToken(): void {
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `token=; Path=/; SameSite=Lax; Max-Age=0${secureFlag}`;
}
