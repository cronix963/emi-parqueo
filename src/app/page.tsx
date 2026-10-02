import { redirect } from "next/navigation";

export default function HomePage() {
  // El middleware separa /login y /dashboard según exista o no sesión.
  redirect("/dashboard");
}
