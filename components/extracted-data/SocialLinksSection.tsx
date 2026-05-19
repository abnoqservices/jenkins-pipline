import {
    Linkedin, Instagram, Facebook, Twitter, Youtube, Globe
  } from "lucide-react";
  import { SocialLinkEditable } from "./SocialLinkEditable";
  import type { CardData } from "./types";
  
  interface SocialLinksSectionProps {
    social: CardData["social_handles"];
    updateSocial: (platform: keyof CardData["social_handles"], value: string | null) => void;
  }
  
  export function SocialLinksSection({ social, updateSocial }: SocialLinksSectionProps) {
    return (
      <div className="pt-6 border-t border-border">
        <p className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
          Social Media
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SocialLinkEditable
            icon={Linkedin}
            url={social.linkedin}
            label="LinkedIn"
            onChange={(v) => updateSocial("linkedin", v)}
          />
          <SocialLinkEditable
            icon={Instagram}
            url={social.instagram}
            label="Instagram"
            onChange={(v) => updateSocial("instagram", v)}
          />
          <SocialLinkEditable
            icon={Facebook}
            url={social.facebook}
            label="Facebook"
            onChange={(v) => updateSocial("facebook", v)}
          />
          <SocialLinkEditable
            icon={Twitter}
            url={social.x}
            label="X / Twitter"
            onChange={(v) => updateSocial("x", v)}
          />
          <SocialLinkEditable
            icon={Youtube}
            url={social.youtube}
            label="YouTube"
            onChange={(v) => updateSocial("youtube", v)}
          />
          <SocialLinkEditable
            icon={Globe}
            url={social.other}
            label="Other link"
            onChange={(v) => updateSocial("other", v)}
          />
        </div>
      </div>
    );
  }