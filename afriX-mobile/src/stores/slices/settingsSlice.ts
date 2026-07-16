import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/i18n";
import { getCurrencyByCountryCode } from "@/constants/countries";

export interface SettingsState {
  language: "en" | "fr" | null;
  setLanguage: (lang: "en" | "fr") => Promise<void>;
  initializeLanguage: (userCountryCode?: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: null,
      setLanguage: async (lang) => {
        set({ language: lang });
        await i18n.changeLanguage(lang);
      },
      initializeLanguage: async (userCountryCode) => {
        const storedLang = get().language;
        if (storedLang) {
          await i18n.changeLanguage(storedLang);
          return;
        }

        if (userCountryCode) {
          const currency = getCurrencyByCountryCode(userCountryCode);
          const defaultLang = currency === "XOF" ? "fr" : "en";
          await i18n.changeLanguage(defaultLang);
        } else {
          await i18n.changeLanguage("en");
        }
      },
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }),
    }
  )
);
