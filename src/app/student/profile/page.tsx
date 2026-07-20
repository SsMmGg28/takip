import { requireRole } from "@/lib/auth";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const profile = await requireRole(["student"]);
  return <ProfileView profile={profile} />;
}
