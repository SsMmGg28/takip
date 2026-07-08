import { requireRole } from "@/lib/auth";
import { ProfileView } from "@/components/profile/profile-view";

export default async function ProfilePage() {
  const profile = await requireRole(["parent"]);
  return <ProfileView profile={profile} />;
}
