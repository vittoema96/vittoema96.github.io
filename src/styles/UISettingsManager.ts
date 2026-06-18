// ─── Theme ───────────────────────────────────────────────────────────────────

export const THEMES = {
    'theme-fallout-3': 'Fallout 3',
    'theme-fallout-new-vegas': 'Fallout New Vegas',
    'theme-old-world-blues': 'Old World Blues',
    'theme-dead-money': 'Dead Money',
    'theme-the-institute': 'The Institute',
    'theme-the-kings': 'The Kings',
} as const

export type Theme = keyof typeof THEMES
export const DEFAULT_THEME: Theme = 'theme-fallout-3'

// ─── Language ─────────────────────────────────────────────────────────────────

export const LANGUAGES = {
    'it': 'Italiano',
    'en': 'English',
} as const

export type Language = keyof typeof LANGUAGES
export const DEFAULT_LANGUAGE: Language = 'en'

// ─── Display Effect ───────────────────────────────────────────────────────────

export const DISPLAY_EFFECTS = ['on', 'noFlicker', 'off'] as const
export type DisplayEffect = (typeof DISPLAY_EFFECTS)[number]

// ─── Storage ──────────────────────────────────────────────────────────────────

type UISettings = {
    CRT_effect?: DisplayEffect
    THEME?: Theme
    LANGUAGE?: Language
}

const SETTINGS_KEY = 'PB3K_settings'

/**
 * TODO: Remove this migration after a few releases (added 2026-06-18).
 *
 * Before the UISettingsManager refactor, 'theme' and 'language' were stored
 * as separate localStorage keys. This one-shot migration moves them into the
 * unified PB3K_settings object so all UI preferences live in one place.
 */
const migrateLegacyKeys = (settings: UISettings): void => {
    let migrated = false

    if (!settings.LANGUAGE) {
        const legacy = localStorage.getItem('language')
        if (legacy && legacy in LANGUAGES) {
            settings.LANGUAGE = legacy as Language
            localStorage.removeItem('language')
            migrated = true
        }
    }
    if (!settings.THEME) {
        const legacy = localStorage.getItem('theme')
        if (legacy && legacy in THEMES) {
            settings.THEME = legacy as Theme
            localStorage.removeItem('theme')
            migrated = true
        }
    }

    if (migrated) {
        saveSettings(settings)
    }
}

const loadSettings = (): UISettings => {
    try {
        const settings: UISettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')
        migrateLegacyKeys(settings)
        return settings
    } catch {
        return {}
    }
}

const saveSettings = (settings: UISettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// ─── Manager ──────────────────────────────────────────────────────────────────

export class UISettingsManager {
    // ── Language ────────────────────────────────────────────────────────────────

    static isLanguage(value: string | null): value is Language {
        return !!value && value in LANGUAGES
    }

    static getCurrentLanguage(): Language {
        const saved = loadSettings().LANGUAGE
        if (saved) { return saved }

        const browserLanguages = navigator.languages || [navigator.language]
        for (const lang of browserLanguages) {
            const shortLang = lang.split('-')[0] ?? DEFAULT_LANGUAGE
            if (UISettingsManager.isLanguage(shortLang)) { return shortLang }
        }

        return DEFAULT_LANGUAGE
    }

    /** Persists the selected language (does NOT trigger i18next). */
    static saveLanguage(language: Language): void {
        saveSettings({ ...loadSettings(), LANGUAGE: language })
    }

    // ── Theme ──────────────────────────────────────────────────────────────────

    static isTheme(value: string | null): value is Theme {
        return !!value && value in THEMES
    }

    static getCurrentTheme(): Theme {
        return loadSettings().THEME ?? DEFAULT_THEME
    }

    /**
     * Applies a theme to the document body and syncs the PWA theme-color meta tag.
     * Uses classList to avoid clobbering other body classes.
     */
    static applyTheme(theme: Theme | null = null): Theme {
        const nextTheme = theme ?? UISettingsManager.getCurrentTheme()

        const themeKeys = Object.keys(THEMES) as Theme[]
        themeKeys.forEach(t => document.body.classList.remove(t))
        document.body.classList.add(nextTheme)

        const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary-color')
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', primaryColor)

        return nextTheme
    }

    /** Persists and applies a theme. */
    static setTheme(theme: Theme): Theme {
        saveSettings({ ...loadSettings(), THEME: theme })
        return UISettingsManager.applyTheme(theme)
    }

    // ── Display Effect ─────────────────────────────────────────────────────────

    static getCurrentDisplayEffect(): DisplayEffect {
        return loadSettings().CRT_effect ?? 'on'
    }

    static applyDisplayEffect(
        effect: DisplayEffect = UISettingsManager.getCurrentDisplayEffect(),
    ): DisplayEffect {
        document.body.dataset['crt'] = effect
        return effect
    }

    /** Persists and applies a display effect. */
    static setDisplayEffect(effect: DisplayEffect): DisplayEffect {
        saveSettings({ ...loadSettings(), CRT_effect: effect })
        return UISettingsManager.applyDisplayEffect(effect)
    }

    // ── Bootstrap ──────────────────────────────────────────────────────────────

    /** Call once at app startup before React renders to avoid visual flicker. */
    static applyAll(): void {
        UISettingsManager.applyTheme()
        UISettingsManager.applyDisplayEffect()
    }
}
