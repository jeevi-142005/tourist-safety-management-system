"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"
import { useLanguage, type Language } from "@/contexts/language-context"

const languages = [
  { code: "en" as Language, name: "English", flag: "🇺🇸" },
  { code: "es" as Language, name: "Español", flag: "🇪🇸" },
  { code: "fr" as Language, name: "Français", flag: "🇫🇷" },
  { code: "de" as Language, name: "Deutsch", flag: "🇩🇪" },
  { code: "it" as Language, name: "Italiano", flag: "🇮🇹" },
  { code: "pt" as Language, name: "Português", flag: "🇵🇹" },
  { code: "zh" as Language, name: "中文", flag: "🇨🇳" },
  { code: "ja" as Language, name: "日本語", flag: "🇯🇵" },
  { code: "ko" as Language, name: "한국어", flag: "🇰🇷" },
  { code: "ar" as Language, name: "العربية", flag: "🇸🇦" },
]

interface LanguageSelectorProps {
  variant?: "dropdown" | "grid"
  className?: string
}

export function LanguageSelector({ variant = "dropdown", className = "" }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find((lang) => lang.code === language)

  const handleLanguageChange = (langCode: Language) => {
    console.log("[v0] Changing language to:", langCode)
    setLanguage(langCode)
    setIsOpen(false)
  }

  if (variant === "grid") {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Select Language / Seleccionar Idioma</h3>
              <p className="text-sm text-muted-foreground">Choose your preferred language for the interface</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={language === lang.code ? "default" : "outline"}
                  className={`flex flex-col items-center p-4 h-auto space-y-2 transition-all duration-200 ${
                    language === lang.code ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
                  }`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-xs font-medium">{lang.name}</span>
                  {language === lang.code && <Check className="h-3 w-3" />}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${className} flex items-center space-x-2 hover:bg-primary/10 transition-colors duration-200`}
        >
          <Globe className="h-4 w-4" />
          <span className="text-lg">{currentLanguage?.flag}</span>
          <span className="hidden sm:inline">{currentLanguage?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors duration-200"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
            {language === lang.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function LanguageSelectionScreen({ onLanguageSelected }: { onLanguageSelected: () => void }) {
  const { setLanguage } = useLanguage()

  const handleLanguageSelect = (langCode: Language) => {
    setLanguage(langCode)
    onLanguageSelected()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-authority-primary/5 to-authority-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-authority-primary rounded-full">
              <Globe className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-authority-primary mb-2">Welcome to Tourist Safety System</h1>
          <p className="text-muted-foreground">Please select your preferred language to continue</p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto space-y-3 hover:bg-authority-primary/10 transition-all duration-200 bg-transparent"
                  onClick={() => handleLanguageSelect(lang.code)}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">You can change the language anytime from the settings menu</p>
        </div>
      </div>
    </div>
  )
}
