import { redirect } from "next/navigation";

/** @deprecated Use /landing-pages/hub */
export default function PuckTemplatesRedirectPage() {
  redirect("/landing-pages/hub");
}
