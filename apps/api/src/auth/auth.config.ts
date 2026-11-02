export interface AuthConfig {
  rpId: string;
  origin: string;
  cookieName: string;
  sessionDays: number;
}

export function getAuthConfig(): AuthConfig {
  const production = process.env.NODE_ENV === "production";
  const rpId = process.env.WEBAUTHN_RP_ID ?? (production ? "" : "localhost");
  const origin = process.env.WEBAUTHN_ORIGIN ?? (production ? "" : "http://localhost:3000");

  if (!rpId || !origin) {
    throw new Error("WEBAUTHN_RP_ID and WEBAUTHN_ORIGIN are required in production");
  }

  const parsedOrigin = new URL(origin);
  if (parsedOrigin.origin !== origin || (production && parsedOrigin.protocol !== "https:")) {
    throw new Error("WEBAUTHN_ORIGIN must be an origin URL and use HTTPS in production");
  }

  if (parsedOrigin.hostname !== rpId && !parsedOrigin.hostname.endsWith(`.${rpId}`)) {
    throw new Error("WEBAUTHN_RP_ID must match WEBAUTHN_ORIGIN host");
  }

  return {
    rpId,
    origin,
    cookieName: "proofbase_session",
    sessionDays: 7,
  };
}
