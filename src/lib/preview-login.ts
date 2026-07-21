export function isPreviewLoginEnvironment(env: {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
}) {
  return env.NODE_ENV !== "production" || env.VERCEL_ENV === "preview";
}

export const PREVIEW_ROLES = ["teacher", "student", "parent"] as const;
export type PreviewRole = (typeof PREVIEW_ROLES)[number];

export function isPreviewRole(value: string): value is PreviewRole {
  return PREVIEW_ROLES.some((role) => role === value);
}

export function isMatchingPreviewProfile(
  profile: { username: string; role: string; is_demo: boolean } | null,
  role: PreviewRole,
) {
  return (
    profile?.is_demo === true &&
    profile.role === role &&
    profile.username === `preview.${role}`
  );
}
