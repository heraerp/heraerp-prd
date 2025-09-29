export type PartnerTier = "Technology" | "Implementation" | "Channel";
export type PartnerRegion = "EMEA" | "Americas" | "APAC" | "Global";

export type Partner = {
  slug: string;
  name: string;
  tier: PartnerTier;
  region: PartnerRegion;
  summary: string;
  tags: string[];
  website?: string;
  logo?: string;      // public path or URL; optional
  contactEmail?: string;
  socials?: { x?: string; linkedin?: string; github?: string; };
  metrics?: { customers?: string; projects?: string; years?: string };
  smart_code?: string;
};

export const PARTNERS: Partner[] = [
  {
    slug: "regi-kerala",
    name: "Regi",
    tier: "Implementation",
    region: "APAC",
    summary: "Implementation partner for HERA deployments in Kerala, India.",
    tags: ["Accounting", "SMB", "Onboarding"],
    website: "#",
    smart_code: "HERA.PARTNER.PROFILE.REGI.V1"
  },
  {
    slug: "prince-gspu-dubai",
    name: "Prince — GSPU Dubai",
    tier: "Channel",
    region: "EMEA",
    summary: "GSPU Dubai partner for HERA rollouts across the UAE and GCC.",
    tags: ["Accounting", "Advisory", "Channel"],
    website: "#",
    smart_code: "HERA.PARTNER.PROFILE.PRINCE_GSPU.V1"
  }
];