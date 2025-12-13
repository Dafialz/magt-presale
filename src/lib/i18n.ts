export const LANGS = [
  { code: "en", label: "EN" }, // English
  { code: "uk", label: "UA" }, // Ukrainian
  { code: "ru", label: "RU" }, // Russian
  { code: "es", label: "ES" }, // Spanish
  { code: "fr", label: "FR" }, // French
  { code: "pt", label: "PT" }, // Portuguese
  { code: "cn", label: "CN" }, // Chinese
  { code: "in", label: "IN" }, // India (Hindi)
  { code: "id", label: "ID" }, // Indonesian
  { code: "sa", label: "SA" }, // Arabic (Saudi)
  { code: "bd", label: "BD" }, // Bengali (Bangladesh)
] as const;

export type LangCode = (typeof LANGS)[number]["code"];

// ✅ шлях до іконок прапорів (у тебе саме такі назви файлів)
export const FLAG_ICON: Record<LangCode, string> = {
  en: "/src/assets/lang/en.png",
  uk: "/src/assets/lang/uk.png",
  ru: "/src/assets/lang/ru.png",
  es: "/src/assets/lang/es.png",
  fr: "/src/assets/lang/fr.png",
  pt: "/src/assets/lang/pt.png",
  cn: "/src/assets/lang/cn.png",
  in: "/src/assets/lang/in.png",
  id: "/src/assets/lang/id.png",
  sa: "/src/assets/lang/sa.png",
  bd: "/src/assets/lang/bd.png",
};

const STORAGE_KEY = "magt_lang";

export function getSavedLang(): LangCode {
  const v = localStorage.getItem(STORAGE_KEY) as LangCode | null;
  return (LANGS as readonly any[]).some((x) => x.code === v) ? (v as LangCode) : "en";
}

export function saveLang(code: LangCode) {
  localStorage.setItem(STORAGE_KEY, code);
}

/**
 * Мінімальний словник.
 * Для мов, які ти ще не переклав (cn/in/id/sa/bd) — тимчасово ставимо англійську,
 * щоб TypeScript був щасливий і сайт працював.
 */
const EN = {
  trust_title: "Why trust us",
  tokenomics_title: "Tokenomics",
  roadmap_title: "Roadmap",
  faq_title: "FAQ",
  copy_ref: "Copy referral link",
  copied: "Copied!",
  total_supply: "Total supply",
  presale: "Presale",
  liquidity
    : "Liquidity",
  team: "Team",
  marketing: "Marketing",
  other: "Other projects",
};

// Мінімальний словник (ключові)
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

  // тимчасово англійською, доки не перекладеш
  cn: EN,
  in: EN,
  id: EN,
  sa: EN,
  bd: EN,
};

export function t(lang: LangCode, key: string) {
  return DICT[lang]?.[key] ?? DICT.en[key] ?? key;
}
