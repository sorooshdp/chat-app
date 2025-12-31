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
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      throw new Error("Invalid token format");
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload: JWTPayload = JSON.parse(jsonPayload);
    return payload.id;
  } catch {
    throw new Error("Failed to decode JWT token");
  }
}

export function getAuthToken(): string {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    throw new Error("No authentication token found");
  }

  return token;
}

/**
 * Set the auth token cookie with sane defaults
 * @param token JWT token string
 * @param maxAgeSeconds Optional max-age in seconds (default 3600 = 1h)
 */
export function setAuthToken(token: string, maxAgeSeconds: number = 3600): void {
  const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
  document.cookie = `token=${token}; Path=/; SameSite=Strict; Expires=${expires}`;
}
