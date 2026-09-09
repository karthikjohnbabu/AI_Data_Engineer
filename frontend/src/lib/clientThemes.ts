export type ClientThemeId = "betfred" | "busybees" | "default";

export interface ClientTheme {
  id: ClientThemeId;
  productLabel: string;
  accent: string;
  accentSoft: string;
  /** Soft nav selection — avoid loud accent text on menus. */
  navActiveBg: string;
  navActiveText: string;
  rail: string;
  railBorder: string;
  /** Text/icons on the left rail (may differ from page text). */
  railText: string;
  railMuted: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  chip: string;
  heroGradient: string;
  fontDisplay: string;
  vibe: string;
}

/**
 * Brand-led tenant skins.
 * Betfred ≈ black + signature yellow/gold.
 * Busy Bees ≈ navy rail + bee yellow on a warm light canvas.
 */
const THEMES: Record<string, ClientTheme> = {
  betfred: {
    id: "betfred",
    productLabel: "Betfred Data Workspace",
    accent: "#ffcc00",
    accentSoft: "rgba(255, 204, 0, 0.16)",
    navActiveBg: "rgba(255, 204, 0, 0.14)",
    navActiveText: "#ffcc00",
    rail: "#0a0a0a",
    railBorder: "#2a2a2a",
    railText: "#f5f5f5",
    railMuted: "#a3a3a3",
    surface: "#121212",
    surfaceAlt: "#1a1a1a",
    text: "#f5f5f5",
    muted: "#a3a3a3",
    chip: "#262626",
    heroGradient:
      "radial-gradient(ellipse 65% 45% at 0% 0%, rgba(255,204,0,0.2), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(255,204,0,0.07), transparent 50%), linear-gradient(180deg, #0a0a0a 0%, #111111 100%)",
    fontDisplay: "var(--font-geist-sans)",
    vibe: "Betfred black & gold",
  },
  busybees: {
    id: "busybees",
    productLabel: "Busy Bees Analytics",
    accent: "#f5b800",
    accentSoft: "rgba(245, 184, 0, 0.28)",
    navActiveBg: "rgba(245, 184, 0, 0.22)",
    navActiveText: "#ffe566",
    rail: "#003366",
    railBorder: "#004c99",
    railText: "#ffffff",
    railMuted: "#b8c9de",
    surface: "#fffdf7",
    surfaceAlt: "#fff8e8",
    text: "#003366",
    muted: "#4a6a8a",
    chip: "#ffe9a8",
    heroGradient:
      "radial-gradient(ellipse 70% 50% at 100% 0%, rgba(245,184,0,0.32), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 0%, rgba(0,51,102,0.1), transparent 50%), linear-gradient(180deg, #fffdf7 0%, #fff3d1 100%)",
    fontDisplay: "var(--font-geist-sans)",
    vibe: "Busy Bees navy & bee yellow",
  },
  default: {
    id: "default",
    productLabel: "Client workspace",
    accent: "#0ea5e9",
    accentSoft: "rgba(14, 165, 233, 0.14)",
    navActiveBg: "rgba(255, 255, 255, 0.06)",
    navActiveText: "#e8eef7",
    rail: "#0b0f17",
    railBorder: "#1e293b",
    railText: "#e8eef7",
    railMuted: "#94a3b8",
    surface: "#0f1520",
    surfaceAlt: "#121a27",
    text: "#e8eef7",
    muted: "#94a3b8",
    chip: "#1e293b",
    heroGradient:
      "radial-gradient(ellipse 70% 50% at 10% 0%, rgba(14,165,233,0.18), transparent 55%)",
    fontDisplay: "var(--font-geist-sans)",
    vibe: "Newton default",
  },
};

export function getClientTheme(tenantId: string): ClientTheme {
  return THEMES[tenantId] ?? THEMES.default;
}
