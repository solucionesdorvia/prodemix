import type { Metadata } from "next";

import { OnboardingUsernameScreen } from "@/components/auth/OnboardingUsernameScreen";

export const metadata: Metadata = {
  title: "Elegí tu usuario",
  description: "Completá tu perfil en ProdeMix.",
};

export default function OnboardingUsernamePage() {
  return <OnboardingUsernameScreen />;
}
