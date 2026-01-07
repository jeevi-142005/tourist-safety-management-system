"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type Language = "en" | "es" | "fr" | "de" | "it" | "pt" | "zh" | "ja" | "ko" | "ar"

export interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation dictionaries
const translations = {
  en: {
    // Header & Navigation
    "header.title": "Tourist Safety Dashboard",
    "header.subtitle": "Stay safe and connected",
    "header.protected": "Protected",
    "header.logout": "Logout",
    "header.authority.title": "Authority Command Center",
    "header.authority.subtitle": "Tourist Safety Monitoring & Response System",
    "header.system.operational": "System Operational",

    // Tabs
    "tabs.dashboard": "Dashboard",
    "tabs.digital_id": "Digital ID",
    "tabs.tracking": "Live Tracking",
    "tabs.emergency": "Emergency+",
    "tabs.basic_emergency": "Emergency",
    "tabs.ai_assistant": "AI Assistant",
    "tabs.profile": "Profile",
    "tabs.safety": "Safety Tips",
    "tabs.heatmap": "Heatmap",
    "tabs.tourists": "Tourists",
    "tabs.alerts": "Alerts",
    "tabs.ai_systems": "AI Systems",
    "tabs.analytics": "Analytics",
    "tabs.overview": "Overview",
    "tabs.ai_anomaly": "AI Detection",

    // Emergency System
    "emergency.title": "Emergency Alert",
    "emergency.emergency": "Emergency",
    "emergency.medical": "Medical",
    "emergency.security": "Security",
    "emergency.assistance": "Assistance",
    "emergency.emergency_desc": "Immediate help needed",
    "emergency.medical_desc": "Medical assistance",
    "emergency.security_desc": "Security concern",
    "emergency.assistance_desc": "General help",
    "emergency.send_alert": "Send Alert",
    "emergency.cancel": "Cancel",
    "emergency.confirm_title": "Confirm Emergency Alert",
    "emergency.confirm_message":
      "Are you sure you want to send this emergency alert? This will notify authorities and emergency services.",
    "emergency.location_sharing": "Your current location will be shared with emergency responders.",
    "emergency.alert_sent": "Emergency alert sent successfully!",
    "emergency.alert_error": "Failed to send emergency alert. Please try again.",

    // Safety Status
    "status.safe": "Safe",
    "status.alert": "Alert",
    "status.tracked": "Tracked",
    "status.unknown": "Unknown",
    "status.online": "Online",
    "status.offline": "Offline",
    "status.good_level": "Good level",
    "status.strong_signal": "Strong signal",
    "status.all_systems_operational": "All systems operational",
    "status.enable_location": "Enable location services",

    // Cards & Metrics
    "cards.safety_status": "Safety Status",
    "cards.location": "Location",
    "cards.connection": "Connection",
    "cards.battery": "Battery",
    "cards.active_tourists": "Active Tourists",
    "cards.critical_alerts": "Critical Alerts",
    "cards.safe_zones": "Safe Zones",
    "cards.response_time": "Response Time",
    "cards.ai_efficiency": "AI Efficiency",
    "cards.from_yesterday": "from yesterday",
    "cards.immediate_response": "Immediate response required",
    "cards.all_systems_normal": "All systems normal",
    "cards.average_emergency": "Average emergency response",
    "cards.threat_detection": "Threat detection accuracy",

    // Quick Actions
    "actions.quick_actions": "Quick Actions",
    "actions.emergency_assistance": "Emergency and assistance options",
    "actions.call": "Call",
    "actions.deploy_team": "Deploy Response Team",
    "actions.ai_prioritize": "AI Prioritize",
    "actions.resolve": "Resolve",
    "actions.ai_analysis": "AI Analysis",

    // Services
    "services.nearby_emergency": "Nearby Emergency Services",
    "services.important_contacts": "Important contacts and locations near you",
    "services.emergency_contacts": "Emergency Contacts",
    "services.immediate_assistance": "Important phone numbers for immediate assistance",
    "services.emergency_services": "Emergency Services",
    "services.tourist_police": "Tourist Police",
    "services.embassy": "Embassy",
    "services.medical_hotline": "Medical Hotline",

    // Safety Tips
    "safety.tips_title": "Safety Tips & Guidelines",
    "safety.tips_desc": "Important safety information for tourists",
    "safety.local_emergency": "Local Emergency Information",
    "safety.local_emergency_desc": "Important numbers and procedures for this location",
    "safety.emergency_numbers": "Emergency Numbers",
    "safety.what_to_do": "What to Do in an Emergency",
    "safety.tip_1": "Keep your phone charged and carry a portable charger",
    "safety.tip_2": "Share your itinerary with family or friends",
    "safety.tip_3": "Stay in well-lit, populated areas at night",
    "safety.tip_4": "Keep copies of important documents",
    "safety.tip_5": "Learn basic local emergency phrases",
    "safety.step_1": "Stay calm and assess the situation",
    "safety.step_2": "Use the emergency alert button in this app",
    "safety.step_3": "Call local emergency services if needed",
    "safety.step_4": "Share your location with authorities",
    "safety.step_5": "Follow instructions from emergency responders",

    // Digital ID
    "digital_id.title": "Digital Tourist ID",
    "digital_id.desc": "Secure, blockchain-verified digital identity for safe travel",
    "digital_id.generate_new": "Generate New Digital ID",
    "digital_id.blockchain_id": "Blockchain ID",
    "digital_id.registration_date": "Registration Date",
    "digital_id.verified_tourist": "Verified Tourist",

    // Profile
    "profile.title": "Tourist Profile",
    "profile.desc": "Your safety profile and blockchain identity",
    "profile.safety_status": "Safety Status",
    "profile.active_safe": "Active & Safe",
    "profile.last_checkin": "Last Check-in",
    "profile.just_now": "Just now",

    // AI Assistant
    "ai.title": "AI Safety Assistant",
    "ai.desc": "Get personalized safety insights and recommendations powered by artificial intelligence",
    "ai.how_keeps_safe": "How AI Keeps You Safe",
    "ai.predictive_analysis": "Predictive Analysis",
    "ai.predictive_desc": "AI analyzes patterns to predict potential risks before they occur",
    "ai.realtime_monitoring": "Real-time Monitoring",
    "ai.realtime_desc": "Continuous monitoring of your safety status and location",
    "ai.personalized_recommendations": "Personalized Recommendations",
    "ai.personalized_desc": "Tailored safety advice based on your profile and location",
    "ai.automated_alerts": "Automated Alerts",
    "ai.automated_desc": "Intelligent alert system that learns from your behavior",

    // Heatmap
    "heatmap.title": "Tourist Safety Heatmap",
    "heatmap.desc": "Real-time risk assessment across tourist zones",
    "heatmap.all": "All",
    "heatmap.high_risk": "High Risk",
    "heatmap.medium": "Medium",
    "heatmap.low_risk": "Low Risk",
    "heatmap.zone_details": "Zone Details",
    "heatmap.select_zone": "Select a zone to view details",
    "heatmap.active_tourists": "Active Tourists",
    "heatmap.incidents_today": "Incidents Today",
    "heatmap.coordinates": "Coordinates",
    "heatmap.last_incident": "Last Incident",
    "heatmap.high_risk_zones": "High Risk Zones",
    "heatmap.medium_risk_zones": "Medium Risk Zones",
    "heatmap.safe_zones": "Safe Zones",
    "heatmap.total_tourists": "Total Tourists",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.warning": "Warning",
    "common.info": "Information",
    "common.close": "Close",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.yes": "Yes",
    "common.no": "No",
    "common.ok": "OK",
    "common.loading_dashboard": "Loading dashboard...",
  },
  es: {
    // Header & Navigation
    "header.title": "Panel de Seguridad Turística",
    "header.subtitle": "Mantente seguro y conectado",
    "header.protected": "Protegido",
    "header.logout": "Cerrar Sesión",
    "header.authority.title": "Centro de Comando de Autoridades",
    "header.authority.subtitle": "Sistema de Monitoreo y Respuesta de Seguridad Turística",
    "header.system.operational": "Sistema Operativo",

    // Tabs
    "tabs.dashboard": "Panel",
    "tabs.digital_id": "ID Digital",
    "tabs.tracking": "Seguimiento",
    "tabs.emergency": "Emergencia+",
    "tabs.basic_emergency": "Emergencia",
    "tabs.ai_assistant": "Asistente IA",
    "tabs.profile": "Perfil",
    "tabs.safety": "Consejos",
    "tabs.heatmap": "Mapa de Calor",
    "tabs.tourists": "Turistas",
    "tabs.alerts": "Alertas",
    "tabs.ai_systems": "Sistemas IA",
    "tabs.analytics": "Análisis",
    "tabs.overview": "Resumen",
    "tabs.ai_anomaly": "Detección IA",

    // Emergency System
    "emergency.title": "Alerta de Emergencia",
    "emergency.emergency": "Emergencia",
    "emergency.medical": "Médica",
    "emergency.security": "Seguridad",
    "emergency.assistance": "Asistencia",
    "emergency.emergency_desc": "Ayuda inmediata necesaria",
    "emergency.medical_desc": "Asistencia médica",
    "emergency.security_desc": "Problema de seguridad",
    "emergency.assistance_desc": "Ayuda general",
    "emergency.send_alert": "Enviar Alerta",
    "emergency.cancel": "Cancelar",
    "emergency.confirm_title": "Confirmar Alerta de Emergencia",
    "emergency.confirm_message":
      "¿Estás seguro de que quieres enviar esta alerta de emergencia? Esto notificará a las autoridades y servicios de emergencia.",
    "emergency.location_sharing": "Tu ubicación actual será compartida con los servicios de emergencia.",
    "emergency.alert_sent": "¡Alerta de emergencia enviada exitosamente!",
    "emergency.alert_error": "Error al enviar la alerta de emergencia. Por favor intenta de nuevo.",

    // Safety Status
    "status.safe": "Seguro",
    "status.alert": "Alerta",
    "status.tracked": "Rastreado",
    "status.unknown": "Desconocido",
    "status.online": "En línea",
    "status.offline": "Desconectado",
    "status.good_level": "Buen nivel",
    "status.strong_signal": "Señal fuerte",
    "status.all_systems_operational": "Todos los sistemas operativos",
    "status.enable_location": "Habilitar servicios de ubicación",

    // Cards & Metrics
    "cards.safety_status": "Estado de Seguridad",
    "cards.location": "Ubicación",
    "cards.connection": "Conexión",
    "cards.battery": "Batería",
    "cards.active_tourists": "Turistas Activos",
    "cards.critical_alerts": "Alertas Críticas",
    "cards.safe_zones": "Zonas Seguras",
    "cards.response_time": "Tiempo de Respuesta",
    "cards.ai_efficiency": "Eficiencia IA",
    "cards.from_yesterday": "desde ayer",
    "cards.immediate_response": "Respuesta inmediata requerida",
    "cards.all_systems_normal": "Todos los sistemas normales",
    "cards.average_emergency": "Respuesta de emergencia promedio",
    "cards.threat_detection": "Precisión de detección de amenazas",

    // Quick Actions
    "actions.quick_actions": "Acciones Rápidas",
    "actions.emergency_assistance": "Opciones de emergencia y asistencia",
    "actions.call": "Llamar",
    "actions.deploy_team": "Desplegar Equipo",
    "actions.ai_prioritize": "Priorizar IA",
    "actions.resolve": "Resolver",
    "actions.ai_analysis": "Análisis IA",

    // Services
    "services.nearby_emergency": "Servicios de Emergencia Cercanos",
    "services.important_contacts": "Contactos importantes y ubicaciones cerca de ti",
    "services.emergency_contacts": "Contactos de Emergencia",
    "services.immediate_assistance": "Números telefónicos importantes para asistencia inmediata",
    "services.emergency_services": "Servicios de Emergencia",
    "services.tourist_police": "Policía Turística",
    "services.embassy": "Embajada",
    "services.medical_hotline": "Línea Médica",

    // Safety Tips
    "safety.tips_title": "Consejos y Guías de Seguridad",
    "safety.tips_desc": "Información importante de seguridad para turistas",
    "safety.local_emergency": "Información de Emergencia Local",
    "safety.local_emergency_desc": "Números importantes y procedimientos para esta ubicación",
    "safety.emergency_numbers": "Números de Emergencia",
    "safety.what_to_do": "Qué Hacer en una Emergencia",
    "safety.tip_1": "Mantén tu teléfono cargado y lleva un cargador portátil",
    "safety.tip_2": "Comparte tu itinerario con familia o amigos",
    "safety.tip_3": "Permanece en áreas bien iluminadas y pobladas por la noche",
    "safety.tip_4": "Mantén copias de documentos importantes",
    "safety.tip_5": "Aprende frases básicas de emergencia locales",
    "safety.step_1": "Mantén la calma y evalúa la situación",
    "safety.step_2": "Usa el botón de alerta de emergencia en esta aplicación",
    "safety.step_3": "Llama a los servicios de emergencia locales si es necesario",
    "safety.step_4": "Comparte tu ubicación con las autoridades",
    "safety.step_5": "Sigue las instrucciones de los servicios de emergencia",

    // Digital ID
    "digital_id.title": "ID Digital de Turista",
    "digital_id.desc": "Identidad digital segura y verificada por blockchain para viajes seguros",
    "digital_id.generate_new": "Generar Nueva ID Digital",
    "digital_id.blockchain_id": "ID Blockchain",
    "digital_id.registration_date": "Fecha de Registro",
    "digital_id.verified_tourist": "Turista Verificado",

    // Profile
    "profile.title": "Perfil de Turista",
    "profile.desc": "Tu perfil de seguridad e identidad blockchain",
    "profile.safety_status": "Estado de Seguridad",
    "profile.active_safe": "Activo y Seguro",
    "profile.last_checkin": "Último Check-in",
    "profile.just_now": "Ahora mismo",

    // AI Assistant
    "ai.title": "Asistente de Seguridad IA",
    "ai.desc": "Obtén información personalizada de seguridad y recomendaciones impulsadas por inteligencia artificial",
    "ai.how_keeps_safe": "Cómo la IA te Mantiene Seguro",
    "ai.predictive_analysis": "Análisis Predictivo",
    "ai.predictive_desc": "La IA analiza patrones para predecir riesgos potenciales antes de que ocurran",
    "ai.realtime_monitoring": "Monitoreo en Tiempo Real",
    "ai.realtime_desc": "Monitoreo continuo de tu estado de seguridad y ubicación",
    "ai.personalized_recommendations": "Recomendaciones Personalizadas",
    "ai.personalized_desc": "Consejos de seguridad adaptados basados en tu perfil y ubicación",
    "ai.automated_alerts": "Alertas Automatizadas",
    "ai.automated_desc": "Sistema de alertas inteligente que aprende de tu comportamiento",

    // Heatmap
    "heatmap.title": "Mapa de Calor de Seguridad Turística",
    "heatmap.desc": "Evaluación de riesgo en tiempo real en zonas turísticas",
    "heatmap.all": "Todas",
    "heatmap.high_risk": "Alto Riesgo",
    "heatmap.medium": "Medio",
    "heatmap.low_risk": "Bajo Riesgo",
    "heatmap.zone_details": "Detalles de Zona",
    "heatmap.select_zone": "Selecciona una zona para ver detalles",
    "heatmap.active_tourists": "Turistas Activos",
    "heatmap.incidents_today": "Incidentes Hoy",
    "heatmap.coordinates": "Coordenadas",
    "heatmap.last_incident": "Último Incidente",
    "heatmap.high_risk_zones": "Zonas de Alto Riesgo",
    "heatmap.medium_risk_zones": "Zonas de Riesgo Medio",
    "heatmap.safe_zones": "Zonas Seguras",
    "heatmap.total_tourists": "Total de Turistas",

    // Common
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.success": "Éxito",
    "common.warning": "Advertencia",
    "common.info": "Información",
    "common.close": "Cerrar",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.confirm": "Confirmar",
    "common.yes": "Sí",
    "common.no": "No",
    "common.ok": "OK",
    "common.loading_dashboard": "Cargando panel...",
  },
  fr: {
    // Header & Navigation
    "header.title": "Tableau de Bord de Sécurité Touristique",
    "header.subtitle": "Restez en sécurité et connecté",
    "header.protected": "Protégé",
    "header.logout": "Déconnexion",
    "header.authority.title": "Centre de Commandement des Autorités",
    "header.authority.subtitle": "Système de Surveillance et de Réponse de Sécurité Touristique",
    "header.system.operational": "Système Opérationnel",

    // Tabs
    "tabs.dashboard": "Tableau de Bord",
    "tabs.digital_id": "ID Numérique",
    "tabs.tracking": "Suivi",
    "tabs.emergency": "Urgence+",
    "tabs.basic_emergency": "Urgence",
    "tabs.ai_assistant": "Assistant IA",
    "tabs.profile": "Profil",
    "tabs.safety": "Conseils",
    "tabs.heatmap": "Carte de Chaleur",
    "tabs.tourists": "Touristes",
    "tabs.alerts": "Alertes",
    "tabs.ai_systems": "Systèmes IA",
    "tabs.analytics": "Analyses",
    "tabs.overview": "Aperçu",
    "tabs.ai_anomaly": "Détection IA",

    // Emergency System
    "emergency.title": "Alerte d'Urgence",
    "emergency.emergency": "Urgence",
    "emergency.medical": "Médicale",
    "emergency.security": "Sécurité",
    "emergency.assistance": "Assistance",
    "emergency.emergency_desc": "Aide immédiate nécessaire",
    "emergency.medical_desc": "Assistance médicale",
    "emergency.security_desc": "Problème de sécurité",
    "emergency.assistance_desc": "Aide générale",
    "emergency.send_alert": "Envoyer Alerte",
    "emergency.cancel": "Annuler",
    "emergency.confirm_title": "Confirmer l'Alerte d'Urgence",
    "emergency.confirm_message":
      "Êtes-vous sûr de vouloir envoyer cette alerte d'urgence? Cela notifiera les autorités et les services d'urgence.",
    "emergency.location_sharing": "Votre position actuelle sera partagée avec les services d'urgence.",
    "emergency.alert_sent": "Alerte d'urgence envoyée avec succès!",
    "emergency.alert_error": "Échec de l'envoi de l'alerte d'urgence. Veuillez réessayer.",

    // Safety Status
    "status.safe": "Sûr",
    "status.alert": "Alerte",
    "status.tracked": "Suivi",
    "status.unknown": "Inconnu",
    "status.online": "En ligne",
    "status.offline": "Hors ligne",
    "status.good_level": "Bon niveau",
    "status.strong_signal": "Signal fort",
    "status.all_systems_operational": "Tous les systèmes opérationnels",
    "status.enable_location": "Activer les services de localisation",

    // Cards & Metrics
    "cards.safety_status": "État de Sécurité",
    "cards.location": "Localisation",
    "cards.connection": "Connexion",
    "cards.battery": "Batterie",
    "cards.active_tourists": "Touristes Actifs",
    "cards.critical_alerts": "Alertes Critiques",
    "cards.safe_zones": "Zones Sûres",
    "cards.response_time": "Temps de Réponse",
    "cards.ai_efficiency": "Efficacité IA",
    "cards.from_yesterday": "depuis hier",
    "cards.immediate_response": "Réponse immédiate requise",
    "cards.all_systems_normal": "Tous les systèmes normaux",
    "cards.average_emergency": "Réponse d'urgence moyenne",
    "cards.threat_detection": "Précision de détection des menaces",

    // Quick Actions
    "actions.quick_actions": "Actions Rapides",
    "actions.emergency_assistance": "Options d'urgence et d'assistance",
    "actions.call": "Appeler",
    "actions.deploy_team": "Déployer Équipe",
    "actions.ai_prioritize": "Prioriser IA",
    "actions.resolve": "Résoudre",
    "actions.ai_analysis": "Analyse IA",

    // Services
    "services.nearby_emergency": "Services d'Urgence Proches",
    "services.important_contacts": "Contacts importants et emplacements près de vous",
    "services.emergency_contacts": "Contacts d'Urgence",
    "services.immediate_assistance": "Numéros de téléphone importants pour assistance immédiate",
    "services.emergency_services": "Services d'Urgence",
    "services.tourist_police": "Police Touristique",
    "services.embassy": "Ambassade",
    "services.medical_hotline": "Ligne Médicale",

    // Safety Tips
    "safety.tips_title": "Conseils et Directives de Sécurité",
    "safety.tips_desc": "Informations importantes de sécurité pour les touristes",
    "safety.local_emergency": "Informations d'Urgence Locales",
    "safety.local_emergency_desc": "Numéros importants et procédures pour cet emplacement",
    "safety.emergency_numbers": "Numéros d'Urgence",
    "safety.what_to_do": "Que Faire en Cas d'Urgence",
    "safety.tip_1": "Gardez votre téléphone chargé et portez un chargeur portable",
    "safety.tip_2": "Partagez votre itinéraire avec famille ou amis",
    "safety.tip_3": "Restez dans des zones bien éclairées et peuplées la nuit",
    "safety.tip_4": "Gardez des copies de documents importants",
    "safety.tip_5": "Apprenez des phrases d'urgence locales de base",
    "safety.step_1": "Restez calme et évaluez la situation",
    "safety.step_2": "Utilisez le bouton d'alerte d'urgence dans cette application",
    "safety.step_3": "Appelez les services d'urgence locaux si nécessaire",
    "safety.step_4": "Partagez votre localisation avec les autorités",
    "safety.step_5": "Suivez les instructions des services d'urgence",

    // Digital ID
    "digital_id.title": "ID Numérique de Touriste",
    "digital_id.desc": "Identité numérique sécurisée et vérifiée par blockchain pour voyages sûrs",
    "digital_id.generate_new": "Générer Nouvelle ID Numérique",
    "digital_id.blockchain_id": "ID Blockchain",
    "digital_id.registration_date": "Date d'Inscription",
    "digital_id.verified_tourist": "Touriste Vérifié",

    // Profile
    "profile.title": "Profil de Touriste",
    "profile.desc": "Votre profil de sécurité et identité blockchain",
    "profile.safety_status": "État de Sécurité",
    "profile.active_safe": "Actif et Sûr",
    "profile.last_checkin": "Dernier Check-in",
    "profile.just_now": "À l'instant",

    // AI Assistant
    "ai.title": "Assistant de Sécurité IA",
    "ai.desc":
      "Obtenez des informations personnalisées de sécurité et des recommandations alimentées par l'intelligence artificielle",
    "ai.how_keeps_safe": "Comment l'IA vous Garde en Sécurité",
    "ai.predictive_analysis": "Analyse Prédictive",
    "ai.predictive_desc": "L'IA analyse les modèles pour prédire les risques potentiels avant qu'ils ne se produisent",
    "ai.realtime_monitoring": "Surveillance en Temps Réel",
    "ai.realtime_desc": "Surveillance continue de votre état de sécurité et localisation",
    "ai.personalized_recommendations": "Recommandations Personnalisées",
    "ai.personalized_desc": "Conseils de sécurité adaptés basés sur votre profil et localisation",
    "ai.automated_alerts": "Alertes Automatisées",
    "ai.automated_desc": "Système d'alertes intelligent qui apprend de votre comportement",

    // Heatmap
    "heatmap.title": "Carte de Chaleur de Sécurité Touristique",
    "heatmap.desc": "Évaluation des risques en temps réel dans les zones touristiques",
    "heatmap.all": "Toutes",
    "heatmap.high_risk": "Haut Risque",
    "heatmap.medium": "Moyen",
    "heatmap.low_risk": "Faible Risque",
    "heatmap.zone_details": "Détails de Zone",
    "heatmap.select_zone": "Sélectionnez une zone pour voir les détails",
    "heatmap.active_tourists": "Touristes Actifs",
    "heatmap.incidents_today": "Incidents Aujourd'hui",
    "heatmap.coordinates": "Coordonnées",
    "heatmap.last_incident": "Dernier Incident",
    "heatmap.high_risk_zones": "Zones à Haut Risque",
    "heatmap.medium_risk_zones": "Zones à Risque Moyen",
    "heatmap.safe_zones": "Zones Sûres",
    "heatmap.total_tourists": "Total des Touristes",

    // Common
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succès",
    "common.warning": "Avertissement",
    "common.info": "Information",
    "common.close": "Fermer",
    "common.save": "Sauvegarder",
    "common.cancel": "Annuler",
    "common.confirm": "Confirmer",
    "common.yes": "Oui",
    "common.no": "Non",
    "common.ok": "OK",
    "common.loading_dashboard": "Chargement du tableau de bord...",
  },
  de: {
    // Header & Navigation
    "header.title": "Touristen-Sicherheits-Dashboard",
    "header.subtitle": "Bleiben Sie sicher und verbunden",
    "header.protected": "Geschützt",
    "header.logout": "Abmelden",
    "header.authority.title": "Behörden-Kommandozentrale",
    "header.authority.subtitle": "Touristen-Sicherheits-Überwachungs- und Reaktionssystem",
    "header.system.operational": "System Betriebsbereit",

    // Tabs
    "tabs.dashboard": "Dashboard",
    "tabs.digital_id": "Digitale ID",
    "tabs.tracking": "Live-Verfolgung",
    "tabs.emergency": "Notfall+",
    "tabs.basic_emergency": "Notfall",
    "tabs.ai_assistant": "KI-Assistent",
    "tabs.profile": "Profil",
    "tabs.safety": "Sicherheitstipps",
    "tabs.heatmap": "Heatmap",
    "tabs.tourists": "Touristen",
    "tabs.alerts": "Warnungen",
    "tabs.ai_systems": "KI-Systeme",
    "tabs.analytics": "Analysen",
    "tabs.overview": "Übersicht",
    "tabs.ai_anomaly": "KI-Erkennung",

    // Emergency System
    "emergency.title": "Notfall-Alarm",
    "emergency.emergency": "Notfall",
    "emergency.medical": "Medizinisch",
    "emergency.security": "Sicherheit",
    "emergency.assistance": "Hilfe",
    "emergency.emergency_desc": "Sofortige Hilfe benötigt",
    "emergency.medical_desc": "Medizinische Hilfe",
    "emergency.security_desc": "Sicherheitsproblem",
    "emergency.assistance_desc": "Allgemeine Hilfe",
    "emergency.send_alert": "Alarm Senden",
    "emergency.cancel": "Abbrechen",
    "emergency.confirm_title": "Notfall-Alarm Bestätigen",
    "emergency.confirm_message":
      "Sind Sie sicher, dass Sie diesen Notfall-Alarm senden möchten? Dies wird Behörden und Rettungsdienste benachrichtigen.",
    "emergency.location_sharing": "Ihr aktueller Standort wird mit Rettungsdiensten geteilt.",
    "emergency.alert_sent": "Notfall-Alarm erfolgreich gesendet!",
    "emergency.alert_error": "Fehler beim Senden des Notfall-Alarms. Bitte versuchen Sie es erneut.",

    // Safety Status
    "status.safe": "Sicher",
    "status.alert": "Alarm",
    "status.tracked": "Verfolgt",
    "status.unknown": "Unbekannt",
    "status.online": "Online",
    "status.offline": "Offline",
    "status.good_level": "Guter Pegel",
    "status.strong_signal": "Starkes Signal",
    "status.all_systems_operational": "Alle Systeme betriebsbereit",
    "status.enable_location": "Standortdienste aktivieren",

    // Cards & Metrics
    "cards.safety_status": "Sicherheitsstatus",
    "cards.location": "Standort",
    "cards.connection": "Verbindung",
    "cards.battery": "Batterie",
    "cards.active_tourists": "Aktive Touristen",
    "cards.critical_alerts": "Kritische Warnungen",
    "cards.safe_zones": "Sichere Zonen",
    "cards.response_time": "Reaktionszeit",
    "cards.ai_efficiency": "KI-Effizienz",
    "cards.from_yesterday": "seit gestern",
    "cards.immediate_response": "Sofortige Reaktion erforderlich",
    "cards.all_systems_normal": "Alle Systeme normal",
    "cards.average_emergency": "Durchschnittliche Notfall-Reaktion",
    "cards.threat_detection": "Bedrohungserkennungsgenauigkeit",

    // Quick Actions
    "actions.quick_actions": "Schnelle Aktionen",
    "actions.emergency_assistance": "Notfall- und Hilfsoptionen",
    "actions.call": "Anrufen",
    "actions.deploy_team": "Team Einsetzen",
    "actions.ai_prioritize": "KI Priorisieren",
    "actions.resolve": "Lösen",
    "actions.ai_analysis": "KI-Analyse",

    // Services
    "services.nearby_emergency": "Nahegelegene Rettungsdienste",
    "services.important_contacts": "Wichtige Kontakte und Standorte in Ihrer Nähe",
    "services.emergency_contacts": "Notfall-Kontakte",
    "services.immediate_assistance": "Wichtige Telefonnummern für sofortige Hilfe",
    "services.emergency_services": "Rettungsdienste",
    "services.tourist_police": "Touristenpolizei",
    "services.embassy": "Botschaft",
    "services.medical_hotline": "Medizinische Hotline",

    // Safety Tips
    "safety.tips_title": "Sicherheitstipps & Richtlinien",
    "safety.tips_desc": "Wichtige Sicherheitsinformationen für Touristen",
    "safety.local_emergency": "Lokale Notfall-Informationen",
    "safety.local_emergency_desc": "Wichtige Nummern und Verfahren für diesen Standort",
    "safety.emergency_numbers": "Notfall-Nummern",
    "safety.what_to_do": "Was im Notfall zu tun ist",
    "safety.tip_1": "Halten Sie Ihr Telefon geladen und tragen Sie ein tragbares Ladegerät",
    "safety.tip_2": "Teilen Sie Ihre Reiseroute mit Familie oder Freunden",
    "safety.tip_3": "Bleiben Sie nachts in gut beleuchteten, belebten Bereichen",
    "safety.tip_4": "Bewahren Sie Kopien wichtiger Dokumente auf",
    "safety.tip_5": "Lernen Sie grundlegende lokale Notfall-Phrasen",
    "safety.step_1": "Bleiben Sie ruhig und bewerten Sie die Situation",
    "safety.step_2": "Verwenden Sie den Notfall-Alarm-Button in dieser App",
    "safety.step_3": "Rufen Sie bei Bedarf lokale Rettungsdienste an",
    "safety.step_4": "Teilen Sie Ihren Standort mit den Behörden",
    "safety.step_5": "Befolgen Sie die Anweisungen der Rettungsdienste",

    // Digital ID
    "digital_id.title": "Digitale Touristen-ID",
    "digital_id.desc": "Sichere, blockchain-verifizierte digitale Identität für sicheres Reisen",
    "digital_id.generate_new": "Neue Digitale ID Generieren",
    "digital_id.blockchain_id": "Blockchain-ID",
    "digital_id.registration_date": "Registrierungsdatum",
    "digital_id.verified_tourist": "Verifizierter Tourist",

    // Profile
    "profile.title": "Touristen-Profil",
    "profile.desc": "Ihr Sicherheitsprofil und Blockchain-Identität",
    "profile.safety_status": "Sicherheitsstatus",
    "profile.active_safe": "Aktiv & Sicher",
    "profile.last_checkin": "Letzter Check-in",
    "profile.just_now": "Gerade eben",

    // AI Assistant
    "ai.title": "KI-Sicherheits-Assistent",
    "ai.desc": "Erhalten Sie personalisierte Sicherheitseinblicke und Empfehlungen durch künstliche Intelligenz",
    "ai.how_keeps_safe": "Wie KI Sie Sicher Hält",
    "ai.predictive_analysis": "Vorhersage-Analyse",
    "ai.predictive_desc": "KI analysiert Muster, um potenzielle Risiken vorherzusagen, bevor sie auftreten",
    "ai.realtime_monitoring": "Echtzeit-Überwachung",
    "ai.realtime_desc": "Kontinuierliche Überwachung Ihres Sicherheitsstatus und Standorts",
    "ai.personalized_recommendations": "Personalisierte Empfehlungen",
    "ai.personalized_desc": "Maßgeschneiderte Sicherheitsratschläge basierend auf Ihrem Profil und Standort",
    "ai.automated_alerts": "Automatisierte Warnungen",
    "ai.automated_desc": "Intelligentes Warnsystem, das aus Ihrem Verhalten lernt",

    // Heatmap
    "heatmap.title": "Touristen-Sicherheits-Heatmap",
    "heatmap.desc": "Echtzeit-Risikobewertung in Touristenzonen",
    "heatmap.all": "Alle",
    "heatmap.high_risk": "Hohes Risiko",
    "heatmap.medium": "Mittel",
    "heatmap.low_risk": "Geringes Risiko",
    "heatmap.zone_details": "Zonen-Details",
    "heatmap.select_zone": "Wählen Sie eine Zone aus, um Details zu sehen",
    "heatmap.active_tourists": "Aktive Touristen",
    "heatmap.incidents_today": "Vorfälle Heute",
    "heatmap.coordinates": "Koordinaten",
    "heatmap.last_incident": "Letzter Vorfall",
    "heatmap.high_risk_zones": "Hochrisiko-Zonen",
    "heatmap.medium_risk_zones": "Mittleres Risiko-Zonen",
    "heatmap.safe_zones": "Sichere Zonen",
    "heatmap.total_tourists": "Gesamt-Touristen",

    // Common
    "common.loading": "Laden...",
    "common.error": "Fehler",
    "common.success": "Erfolg",
    "common.warning": "Warnung",
    "common.info": "Information",
    "common.close": "Schließen",
    "common.save": "Speichern",
    "common.cancel": "Abbrechen",
    "common.confirm": "Bestätigen",
    "common.yes": "Ja",
    "common.no": "Nein",
    "common.ok": "OK",
    "common.loading_dashboard": "Dashboard wird geladen...",
  },
  zh: {
    // Header & Navigation
    "header.title": "游客安全仪表板",
    "header.subtitle": "保持安全和连接",
    "header.protected": "受保护",
    "header.logout": "登出",
    "header.authority.title": "当局指挥中心",
    "header.authority.subtitle": "游客安全监控和响应系统",
    "header.system.operational": "系统运行中",

    // Tabs
    "tabs.dashboard": "仪表板",
    "tabs.digital_id": "数字身份",
    "tabs.tracking": "实时追踪",
    "tabs.emergency": "紧急情况+",
    "tabs.basic_emergency": "紧急情况",
    "tabs.ai_assistant": "AI助手",
    "tabs.profile": "个人资料",
    "tabs.safety": "安全提示",
    "tabs.heatmap": "热力图",
    "tabs.tourists": "游客",
    "tabs.alerts": "警报",
    "tabs.ai_systems": "AI系统",
    "tabs.analytics": "分析",
    "tabs.overview": "概览",
    "tabs.ai_anomaly": "AI检测",

    // Emergency System
    "emergency.title": "紧急警报",
    "emergency.emergency": "紧急情况",
    "emergency.medical": "医疗",
    "emergency.security": "安全",
    "emergency.assistance": "协助",
    "emergency.emergency_desc": "需要立即帮助",
    "emergency.medical_desc": "医疗援助",
    "emergency.security_desc": "安全问题",
    "emergency.assistance_desc": "一般帮助",
    "emergency.send_alert": "发送警报",
    "emergency.cancel": "取消",
    "emergency.confirm_title": "确认紧急警报",
    "emergency.confirm_message": "您确定要发送此紧急警报吗？这将通知当局和紧急服务。",
    "emergency.location_sharing": "您的当前位置将与紧急响应人员共享。",
    "emergency.alert_sent": "紧急警报发送成功！",
    "emergency.alert_error": "发送紧急警报失败。请重试。",

    // Safety Status
    "status.safe": "安全",
    "status.alert": "警报",
    "status.tracked": "已追踪",
    "status.unknown": "未知",
    "status.online": "在线",
    "status.offline": "离线",
    "status.good_level": "良好水平",
    "status.strong_signal": "强信号",
    "status.all_systems_operational": "所有系统运行正常",
    "status.enable_location": "启用位置服务",

    // Cards & Metrics
    "cards.safety_status": "安全状态",
    "cards.location": "位置",
    "cards.connection": "连接",
    "cards.battery": "电池",
    "cards.active_tourists": "活跃游客",
    "cards.critical_alerts": "关键警报",
    "cards.safe_zones": "安全区域",
    "cards.response_time": "响应时间",
    "cards.ai_efficiency": "AI效率",
    "cards.from_yesterday": "自昨天以来",
    "cards.immediate_response": "需要立即响应",
    "cards.all_systems_normal": "所有系统正常",
    "cards.average_emergency": "平均紧急响应",
    "cards.threat_detection": "威胁检测准确性",

    // Quick Actions
    "actions.quick_actions": "快速操作",
    "actions.emergency_assistance": "紧急和援助选项",
    "actions.call": "呼叫",
    "actions.deploy_team": "部署团队",
    "actions.ai_prioritize": "AI优先级",
    "actions.resolve": "解决",
    "actions.ai_analysis": "AI分析",

    // Services
    "services.nearby_emergency": "附近紧急服务",
    "services.important_contacts": "您附近的重要联系人和位置",
    "services.emergency_contacts": "紧急联系人",
    "services.immediate_assistance": "立即援助的重要电话号码",
    "services.emergency_services": "紧急服务",
    "services.tourist_police": "旅游警察",
    "services.embassy": "大使馆",
    "services.medical_hotline": "医疗热线",

    // Safety Tips
    "safety.tips_title": "安全提示和指南",
    "safety.tips_desc": "游客重要安全信息",
    "safety.local_emergency": "当地紧急信息",
    "safety.local_emergency_desc": "此位置的重要号码和程序",
    "safety.emergency_numbers": "紧急号码",
    "safety.what_to_do": "紧急情况下该怎么办",
    "safety.tip_1": "保持手机充电并携带便携式充电器",
    "safety.tip_2": "与家人或朋友分享您的行程",
    "safety.tip_3": "夜间待在光线充足、人多的地方",
    "safety.tip_4": "保留重要文件的副本",
    "safety.tip_5": "学习基本的当地紧急短语",
    "safety.step_1": "保持冷静并评估情况",
    "safety.step_2": "使用此应用中的紧急警报按钮",
    "safety.step_3": "如有需要，致电当地紧急服务",
    "safety.step_4": "与当局分享您的位置",
    "safety.step_5": "遵循紧急响应人员的指示",

    // Digital ID
    "digital_id.title": "数字游客身份",
    "digital_id.desc": "安全、区块链验证的数字身份，用于安全旅行",
    "digital_id.generate_new": "生成新的数字身份",
    "digital_id.blockchain_id": "区块链身份",
    "digital_id.registration_date": "注册日期",
    "digital_id.verified_tourist": "已验证游客",

    // Profile
    "profile.title": "游客档案",
    "profile.desc": "您的安全档案和区块链身份",
    "profile.safety_status": "安全状态",
    "profile.active_safe": "活跃且安全",
    "profile.last_checkin": "最后签到",
    "profile.just_now": "刚刚",

    // AI Assistant
    "ai.title": "AI安全助手",
    "ai.desc": "获得由人工智能驱动的个性化安全见解和建议",
    "ai.how_keeps_safe": "AI如何保护您的安全",
    "ai.predictive_analysis": "预测分析",
    "ai.predictive_desc": "AI分析模式以在潜在风险发生之前预测它们",
    "ai.realtime_monitoring": "实时监控",
    "ai.realtime_desc": "持续监控您的安全状态和位置",
    "ai.personalized_recommendations": "个性化建议",
    "ai.personalized_desc": "基于您的档案和位置的定制安全建议",
    "ai.automated_alerts": "自动警报",
    "ai.automated_desc": "从您的行为中学习的智能警报系统",

    // Heatmap
    "heatmap.title": "游客安全热力图",
    "heatmap.desc": "游客区域的实时风险评估",
    "heatmap.all": "全部",
    "heatmap.high_risk": "高风险",
    "heatmap.medium": "中等",
    "heatmap.low_risk": "低风险",
    "heatmap.zone_details": "区域详情",
    "heatmap.select_zone": "选择一个区域查看详情",
    "heatmap.active_tourists": "活跃游客",
    "heatmap.incidents_today": "今日事件",
    "heatmap.coordinates": "坐标",
    "heatmap.last_incident": "最后事件",
    "heatmap.high_risk_zones": "高风险区域",
    "heatmap.medium_risk_zones": "中等风险区域",
    "heatmap.safe_zones": "安全区域",
    "heatmap.total_tourists": "游客总数",

    // Common
    "common.loading": "加载中...",
    "common.error": "错误",
    "common.success": "成功",
    "common.warning": "警告",
    "common.info": "信息",
    "common.close": "关闭",
    "common.save": "保存",
    "common.cancel": "取消",
    "common.confirm": "确认",
    "common.yes": "是",
    "common.no": "否",
    "common.ok": "确定",
    "common.loading_dashboard": "加载仪表板...",
  },
}

// RTL languages
const rtlLanguages: Language[] = ["ar"]

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem("tourist-safety-language") as Language
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage)
    } else {
      // Detect browser language
      const browserLang = navigator.language.split("-")[0] as Language
      if (translations[browserLang]) {
        setLanguage(browserLang)
      }
    }
  }, [])

  useEffect(() => {
    // Save language to localStorage
    localStorage.setItem("tourist-safety-language", language)

    // Update document direction for RTL languages
    document.documentElement.dir = rtlLanguages.includes(language) ? "rtl" : "ltr"
    document.documentElement.lang = language
  }, [language])

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key
  }

  const isRTL = rtlLanguages.includes(language)

  return <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
