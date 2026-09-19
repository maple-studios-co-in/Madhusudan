export const SITE = {
  name: "SMC Agri Limited",
  shortName: "SMC",
  tagline: "Agri Limited",
  /** footer legal name (Figma 119:790) */
  legalName: "SMC Limited",
  email: "info@smcagri.com",
} as const;

export const NAVIGATION = {
  menuLabel: "Menu",
  contact: { label: "Contact us", href: "#contact" },
  links: [
    { label: "Products", href: "#products" },
    { label: "Farm to freezer", href: "#process" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],
} as const;

type FooterLink = { label: string; href: string };

/**
 * Footer (Figma 119:773). Pages that do not exist yet point at in-page anchors;
 * the LinkedIn, legal and credit URLs are still to be supplied.
 */
export const FOOTER: {
  groups: { title?: string; links: FooterLink[] }[];
  contactNote: [string, string];
  social: FooterLink[];
  legal: FooterLink[];
  credit: FooterLink;
} = {
  groups: [
    {
      title: "About",
      links: [
        { label: "About us", href: "#about" },
        { label: "Approach", href: "#process" },
        { label: "Sustainability", href: "#sustainability" },
      ],
    },
    {
      links: [
        { label: "Blog", href: "#blog" },
        { label: "Contact", href: "#contact" },
      ],
    },
  ],
  contactNote: ["If you have any questions", "feel free to contact us:"],
  social: [{ label: "LinkedIn", href: "#linkedin" }],
  legal: [
    { label: "Privacy policy", href: "#privacy" },
    { label: "Terms of use", href: "#terms" },
  ],
  credit: { label: "Website by Maple Studios", href: "#maple-studios" },
};
