import { Suspense } from "react";
import { SettingsScreen } from "./settings";

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsScreen />
    </Suspense>
  );
}
