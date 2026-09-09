import { MobileShell } from "@/components/layout/mobile-shell";
import { EditProfileForm } from "./form";

export default function EditProfilePage() {
  return (
    <MobileShell back="/resident/profile" title="Edit Profile" narrowTitle>
      <EditProfileForm />
    </MobileShell>
  );
}
