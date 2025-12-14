// 🔹 ІМПОРТИ ПРАПОРІВ (Vite way — працює і локально, і на Netlify)
import flagBD from "../assets/lang/bd.png";
import flagCN from "../assets/lang/cn.png";
import flagEN from "../assets/lang/en.png";
import flagES from "../assets/lang/es.png";
import flagFR from "../assets/lang/fr.png";
import flagID from "../assets/lang/id.png";
import flagIN from "../assets/lang/in.png";
import flagPT from "../assets/lang/pt.png";
import flagRU from "../assets/lang/ru.png";
import flagSA from "../assets/lang/sa.png";
import flagUK from "../assets/lang/uk.png";

export const LANGS = [
  { code: "en", label: "EN" },
  { code: "uk", label: "UA" },
  { code: "ru", label: "RU" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
  { code: "pt", label: "PT" },
  { code: "cn", label: "CN" },
  { code: "in", label: "IN" },
  { code: "id", label: "ID" },
  { code: "sa", label: "SA" },
  { code: "bd", label: "BD" },
] as const;

export type LangCode = (typeof LANGS)[number]["code"];

// ✅ ТЕПЕР ПРАПОРИ ПРАЦЮЮТЬ СКРІЗЬ
export const FLAG_ICON: Record<LangCode, string> = {
  en: flagEN,
  uk: flagUK,
  ru: flagRU,
  es: flagES,
  fr: flagFR,
  pt: flagPT,
  cn: flagCN,
  in: flagIN,
  id: flagID,
  sa: flagSA,
  bd: flagBD,
};

const STORAGE_KEY = "magt_lang";

export function getSavedLang(): LangCode {
  const v = localStorage.getItem(STORAGE_KEY) as LangCode | null;
  return (LANGS as readonly any[]).some((x) => x.code === v) ? (v as LangCode) : "en";
}

export function saveLang(code: LangCode) {
  localStorage.setItem(STORAGE_KEY, code);
}

/* ====== DICTIONARY ====== */

const EN = {
  trust_title: "Why trust us",
  tokenomics_title: "Tokenomics",
  roadmap_title: "Roadmap",
  faq_title: "FAQ",
  copy_ref: "Copy referral link",
  copied: "Copied!",
  total_supply: "Total supply",
  presale: "Presale",
  liquidity: "Liquidity",
  team: "Team",
  marketing: "Marketing",
  other: "Other projects",
};

export const DICT: Record<LangCode, Record<string, string>> = {
  en: EN,

  uk: {
    trust_title: "Чому нам довіряти",
    tokenomics_title: "Токеноміка",
    roadmap_title: "Дорожня карта",
    faq_title: "FAQ",
    copy_ref: "Скопіювати реф. лінк",
    copied: "Скопійовано!",
    total_supply: "Загальна емісія",
    presale: "Пресейл",
    liquidity: "Ліквідність",
    team: "Команда",
    marketing: "Маркетинг",
    other: "Інші проєкти",
  },

  ru: {
    trust_title: "Почему нам доверять",
    tokenomics_title: "Токеномика",
    roadmap_title: "Дорожная карта",
    faq_title: "FAQ",
    copy_ref: "Скопировать реф. ссылку",
    copied: "Скопировано!",
    total_supply: "Общая эмиссия",
    presale: "Пресейл",
    liquidity: "Ликвидность",
    team: "Команда",
    marketing: "Маркетинг",
    other: "Другие проекты",
  },

  es: {
    trust_title: "Por qué confiar",
    tokenomics_title: "Tokenomics",
    roadmap_title: "Hoja de ruta",
    faq_title: "FAQ",
    copy_ref: "Copiar enlace referral",
    copied: "¡Copiado!",
    total_supply: "Suministro total",
    presale: "Preventa",
    liquidity: "Liquidez",
    team: "Equipo",
    marketing: "Marketing",
    other: "Otros proyectos",
  },

  fr: {
    trust_title: "Pourquoi nous faire confiance",
    tokenomics_title: "Tokenomics",
    roadmap_title: "Feuille de route",
    faq_title: "FAQ",
    copy_ref: "Copier le lien de parrainage",
    copied: "Copié !",
    total_supply: "Offre totale",
    presale: "Prévente",
    liquidity: "Liquidité",
    team: "Équipe",
    marketing: "Marketing",
    other: "Autres projets",
  },

  pt: {
    trust_title: "Por que confiar",
    tokenomics_title: "Tokenomics",
    roadmap_title: "Roadmap",
    faq_title: "FAQ",
    copy_ref: "Copiar link de referral",
    copied: "Copiado!",
    total_supply: "Oferta total",
    presale: "Pré-venda",
    liquidity: "Liquidez",
    team: "Equipe",
    marketing: "Marketing",
    other: "Outros projetos",
  },

  // ⏳ тимчасово EN
  cn: EN,
  in: EN,
  id: EN,
  sa: EN,
  bd: EN,
};

export function t(lang: LangCode, key: string) {
  return DICT[lang]?.[key] ?? DICT.en[key] ?? key;
}
