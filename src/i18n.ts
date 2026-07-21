// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// On va collecter toutes les ressources trouvées dans des
// dossiers "i18n" (ou un pattern plus précis si tu préfères).
// Les { eager: true } vont immédiatement importer chaque JSON.
const modules = import.meta.glob<{ default: Record<string, unknown> }>(
  './**/i18n/**/*.json',
  { eager: true }
);

/*
  modules sera un objet du type :
  {
    './apps/TaskManager/i18n/en.json': { default: { ... } },
    './apps/TaskManager/i18n/fr.json': { default: { ... } },
    './apps/AnotherApp/i18n/en.json': { default: { ... } },
    './common/i18n/fr.json': { default: { ... } },
    ... etc
  }
*/

// Créons un objet "resources" à partir de ces modules
const resources: Record<string, Record<string, object>> = {};

Object.entries(modules).forEach(([path, file]) => {
  // path = './apps/TaskManager/i18n/en.json'
  // file = { default: {...} } (le contenu JSON)

  // 1) Extraire la langue
  //    On part du principe que le nom du fichier est "en.json" ou "fr.json"
  //    On peut aussi extraire la sous-structure du path si on veut
  const fileName = path.split('/').pop() || ''; // "en.json"
  const lang = fileName.replace('.json', '');   // "en" | "fr" etc.

  // 2) Déterminer un namespace
  //    Ex : pour "apps/TaskManager/i18n/en.json" => namespace = "TaskManager"
  //    ou pour "common/i18n/fr.json" => namespace = "common"
  //    On peut extraire la partie du chemin située juste avant "i18n".
  //    Cela dépend de ta structure souhaitée.
  const parts = path.split('/');
  // parts = [".", "apps", "TaskManager", "i18n", "en.json"]
  // => On récupère l'index du "i18n"
  const i18nIndex = parts.indexOf('i18n');
  // => Le nom du dossier avant i18n
  const namespace = parts[i18nIndex - 1] || 'common';

  // On s’assure d’initialiser la structure
  if (!resources[lang]) {
    resources[lang] = {};
  }
  if (!resources[lang][namespace]) {
    resources[lang][namespace] = {};
  }

  // 3) On fusionne le contenu
  Object.assign(resources[lang][namespace], file.default);
});

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
