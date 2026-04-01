import type { Metadata } from "next";

import { EditProfileClient } from "@/components/perfil/EditProfileClient";

export const metadata: Metadata = {
  title: "Editar perfil",
  description: "Nombre, usuario e imagen de perfil.",
};

export default function EditarPerfilPage() {
  return <EditProfileClient />;
}
