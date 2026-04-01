import { redirect } from "next/navigation";

/** Crear prode ya no existe: producto solo con competencias oficiales. */
export default function CrearPage() {
  redirect("/prodes");
}
