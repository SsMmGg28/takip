export function isPreviewLoginEnvironment(env: {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
}) {
  return env.NODE_ENV !== "production" || env.VERCEL_ENV === "preview";
}
