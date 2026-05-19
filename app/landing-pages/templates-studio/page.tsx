import { redirect } from "next/navigation";

/** @deprecated Use /landing-pages/templates/library */
export default function LandingPageTemplatesStudioRedirectPage() {
  redirect("/landing-pages/templates/library");
}
