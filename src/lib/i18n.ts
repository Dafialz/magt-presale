export const LANGS = [
  { code: "en", label: "EN" },
  { code: "uk", label: "UA" },
  { code: "ru", label: "RU" },
  { code: "pl", label: "PL" },
  { code: "cs", label: "CS" },
  { code: "de", label: "DE" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
  { code: "it", label: "IT" },
  { code: "tr", label: "TR" },
  { code: "pt", label: "PT" },
] as const;

export type LangCode = (typeof LANGS)[number]["code"];

const STORAGE_KEY = "magt_lang";

export function getSavedLang(): LangCode {
  const v = localStorage.getItem(STORAGE_KEY) as LangCode | null;
  return (LANGS as readonly any[]).some((x) => x.code === v) ? (v as LangCode) : "en";
}
export function saveLang(code: LangCode) {
  localStorage.setItem(STORAGE_KEY, code);
}

// Мінімальний словник (заповнив ключові; решту легко додаси)
export const DICT: Record<LangCode, Record<string, string>> = {
  en: {
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
  },
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
  pl: { trust_title: "Dlaczego nam ufać", tokenomics_title: "Tokenomia", roadmap_title: "Mapa drogowa", faq_title: "FAQ", copy_ref: "Kopiuj link polecający", copied: "Skopiowano!", total_supply: "Podaż całkowita", presale: "Przedsprzedaż", liquidity: "Płynność", team: "Zespół", marketing: "Marketing", other: "Inne projekty" },
  cs: { trust_title: "Proč nám věřit", tokenomics_title: "Tokenomika", roadmap_title: "Roadmap", faq_title: "FAQ", copy_ref: "Kopírovat referral odkaz", copied: "Zkopírováno!", total_supply: "Celková nabídka", presale: "Presale", liquidity: "Likvidita", team: "Tým", marketing: "Marketing", other: "Ostatní projekty" },
  de: { trust_title: "Warum uns vertrauen", tokenomics_title: "Tokenomics", roadmap_title: "Roadmap", faq_title: "FAQ", copy_ref: "Referral-Link kopieren", copied: "Kopiert!", total_supply: "Gesamtmenge", presale: "Presale", liquidity: "Liquidität", team: "Team", marketing: "Marketing", other: "Andere Projekte" },
  fr: { trust_title: "Pourquoi nous faire confiance", tokenomics_title: "Tokenomics", roadmap_title: "Feuille de route", faq_title: "FAQ", copy_ref: "Copier le lien de parrainage", copied: "Copié !", total_supply: "Offre totale", presale: "Prévente", liquidity: "Liquidité", team: "Équipe", marketing: "Marketing", other: "Autres projets" },
  es: { trust_title: "Por qué confiar", tokenomics_title: "Tokenomics", roadmap_title: "Hoja de ruta", faq_title: "FAQ", copy_ref: "Copiar enlace referral", copied: "¡Copiado!", total_supply: "Suministro total", presale: "Preventa", liquidity: "Liquidez", team: "Equipo", marketing: "Marketing", other: "Otros proyectos" },
  it: { trust_title: "Perché fidarsi", tokenomics_title: "Tokenomics", roadmap_title: "Roadmap", faq_title: "FAQ", copy_ref: "Copia link referral", copied: "Copiato!", total_supply: "Supply totale", presale: "Presale", liquidity: "Liquidità", team: "Team", marketing: "Marketing", other: "Altri progetti" },
  tr: { trust_title: "Neden güvenilir", tokenomics_title: "Tokenomics", roadmap_title: "Yol haritası", faq_title: "SSS", copy_ref: "Referans linkini kopyala", copied: "Kopyalandı!", total_supply: "Toplam arz", presale: "Ön satış", liquidity: "Likidite", team: "Takım", marketing: "Pazarlama", other: "Diğer projeler" },
  pt: { trust_title: "Por que confiar", tokenomics_title: "Tokenomics", roadmap_title: "Roadmap", faq_title: "FAQ", copy_ref: "Copiar link de referral", copied: "Copiado!", total_supply: "Oferta total", presale: "Pré-venda", liquidity: "Liquidez", team: "Equipe", marketing: "Marketing", other: "Outros projetos" },
};

export function t(lang: LangCode, key: string) {
  return DICT[lang][key] ?? DICT.en[key] ?? key;
}
