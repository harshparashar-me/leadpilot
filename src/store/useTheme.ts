import { create } from "zustand"

interface ThemeState {
  themeColor: string
  setThemeColor: (color: string) => void
}

export const useTheme = create<ThemeState>((set) => ({
  themeColor: "#2D6CDF",
  setThemeColor: (color) => set({ themeColor: color })
}))
