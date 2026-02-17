import type { Locale } from "../types.ts";

export type MessageKey =
  | "tagline"
  | "title"
  | "subtitle"
  | "effectsOn"
  | "effectsOff"
  | "language"
  | "statusStream"
  | "metricsProgress"
  | "metricsEvents"
  | "metricsModel"
  | "metricsJobId"
  | "jobNone"
  | "launchpad"
  | "repository"
  | "repositoryPlaceholder"
  | "repositoryHelp"
  | "mode"
  | "model"
  | "maxFiles"
  | "timeout"
  | "publishIssue"
  | "githubToken"
  | "githubTokenPlaceholder"
  | "publishHelp"
  | "runAnalysis"
  | "running"
  | "cancel"
  | "trustLocal"
  | "trustNoStorage"
  | "timeline"
  | "timelineEmptyTitle"
  | "timelineEmptyBody"
  | "timelineEmptyAction"
  | "reportStudio"
  | "reportHint"
  | "copyCurrentTab"
  | "exportMd"
  | "exportJson"
  | "reportEmptyMarkdown"
  | "reportEmptyJson"
  | "loadingReport"
  | "requestError"
  | "reportReady"
  | "analysisStarted"
  | "jobCancelled"
  | "copiedMarkdown"
  | "copiedJson"
  | "exportedMd"
  | "exportedJson"
  | "selectModel"
  | "escToClose"
  | "searchModelPlaceholder"
  | "freeModels"
  | "premiumModels"
  | "noFreeModels"
  | "noPremiumModels"
  | "stepsSetup"
  | "stepsRunning"
  | "stepsReview"
  | "stepsExport"
  | "footerTrust"
  | "footerDocs"
  | "footerCli"
  | "footerChangelog"
  | "footerGithub"
  | "footerSupport"
  | "footerHeadline"
  | "footerPillLocal"
  | "footerPillPrivate"
  | "footerPillAccessible"
  | "severityCritical"
  | "severityHigh"
  | "severitySuggestion"
  | "eventReceived"
  | "recentRepositories"
  | "clearRecent";

type MessageCatalog = Record<MessageKey, string>;

export const messages: Record<Locale, MessageCatalog> = {
  "pt-BR": {
    tagline: "Diagnóstico inteligente local",
    title: "Central Repo Check AI",
    subtitle: "Configure, execute e exporte auditorias de repositórios com fluidez e visibilidade em tempo real.",
    effectsOn: "Efeitos: On",
    effectsOff: "Efeitos: Off",
    language: "Idioma",
    statusStream: "Fluxo",
    metricsProgress: "Progresso",
    metricsEvents: "Eventos",
    metricsModel: "Modelo",
    metricsJobId: "Job ID",
    jobNone: "nenhum",
    launchpad: "Painel de comando",
    repository: "Repositório",
    repositoryPlaceholder: "owner/repositório",
    repositoryHelp: "Exemplo: octocat/Hello-World",
    mode: "Modo",
    model: "Modelo",
    maxFiles: "Max arquivos",
    timeout: "Timeout (s)",
    publishIssue: "Publicar no GitHub Issues",
    githubToken: "GitHub Token",
    githubTokenPlaceholder: "ghp_xxx... (escopo repo)",
    publishHelp: "Marque para publicar automaticamente. Necessita token com permissao de issues.",
    runAnalysis: "Executar análise",
    running: "Executando...",
    cancel: "Cancelar",
    trustLocal: "Execução local: seu código não sai da sua máquina.",
    trustNoStorage: "Nenhum repositório é armazenado neste painel.",
    timeline: "Timeline ao vivo",
    timelineEmptyTitle: "Nenhum evento ainda",
    timelineEmptyBody: "Inicie uma análise para ver telemetria em tempo real.",
    timelineEmptyAction: "Usar repositório de exemplo",
    reportStudio: "Estúdio de relatórios",
    reportHint: "Alterne a visualização, copie e exporte artefatos.",
    copyCurrentTab: "Copiar aba atual",
    exportMd: "Exportar .md",
    exportJson: "Exportar .json",
    reportEmptyMarkdown: "Nenhum relatório markdown ainda.",
    reportEmptyJson: "Nenhum relatório JSON ainda.",
    loadingReport: "Carregando relatório...",
    requestError: "Erro na requisição",
    reportReady: "Relatório pronto.",
    analysisStarted: "Análise iniciada.",
    jobCancelled: "Job cancelado.",
    copiedMarkdown: "MARKDOWN copiado.",
    copiedJson: "JSON copiado.",
    exportedMd: ".md exportado.",
    exportedJson: ".json exportado.",
    selectModel: "Selecionar modelo",
    escToClose: "ESC para fechar",
    searchModelPlaceholder: "Buscar por nome ou ID do modelo...",
    freeModels: "Gratuitos",
    premiumModels: "Premium",
    noFreeModels: "Nenhum modelo gratuito encontrado.",
    noPremiumModels: "Nenhum modelo premium encontrado.",
    stepsSetup: "Configurar",
    stepsRunning: "Executar",
    stepsReview: "Revisar",
    stepsExport: "Exportar",
    footerTrust: "Análise local com foco em privacidade.",
    footerHeadline: "Mais confiança para decidir com rapidez",
    footerDocs: "Docs",
    footerCli: "CLI",
    footerChangelog: "Changelog",
    footerGithub: "GitHub",
    footerSupport: "Suporte",
    footerPillLocal: "Execução local",
    footerPillPrivate: "Privacidade ativa",
    footerPillAccessible: "Acessibilidade em foco",
    severityCritical: "P0 Crítico",
    severityHigh: "P1 Alto",
    severitySuggestion: "P2 Sugestão",
    eventReceived: "Evento recebido.",
    recentRepositories: "Repositórios recentes",
    clearRecent: "Limpar",
  },
  "en-US": {
    tagline: "Intelligent local command center",
    title: "Repo Check AI Workspace",
    subtitle: "Configure analysis, monitor realtime events, and export results in a single flow.",
    effectsOn: "Effects: On",
    effectsOff: "Effects: Off",
    language: "Language",
    statusStream: "Stream",
    metricsProgress: "Progress",
    metricsEvents: "Events",
    metricsModel: "Model",
    metricsJobId: "Job ID",
    jobNone: "none",
    launchpad: "Launchpad",
    repository: "Repository",
    repositoryPlaceholder: "owner/repository",
    repositoryHelp: "Example: octocat/Hello-World",
    mode: "Mode",
    model: "Model",
    maxFiles: "Max files",
    timeout: "Timeout (s)",
    publishIssue: "Publish to GitHub Issues",
    githubToken: "GitHub Token",
    githubTokenPlaceholder: "ghp_xxx... (repo scope)",
    publishHelp: "Enable to auto-publish findings as issues. Requires a token with issue permissions.",
    runAnalysis: "Run analysis",
    running: "Running...",
    cancel: "Cancel",
    trustLocal: "Local execution: your code stays on your machine.",
    trustNoStorage: "No repository content is stored in this UI.",
    timeline: "Live timeline",
    timelineEmptyTitle: "No events yet",
    timelineEmptyBody: "Start an analysis to activate realtime telemetry.",
    timelineEmptyAction: "Use sample repository",
    reportStudio: "Report studio",
    reportHint: "Switch views, copy instantly, and export artifacts.",
    copyCurrentTab: "Copy current tab",
    exportMd: "Export .md",
    exportJson: "Export .json",
    reportEmptyMarkdown: "No markdown report yet.",
    reportEmptyJson: "No JSON report yet.",
    loadingReport: "Loading report...",
    requestError: "Request error",
    reportReady: "Report is ready.",
    analysisStarted: "Analysis started.",
    jobCancelled: "Job cancelled.",
    copiedMarkdown: "MARKDOWN copied.",
    copiedJson: "JSON copied.",
    exportedMd: ".md exported.",
    exportedJson: ".json exported.",
    selectModel: "Select model",
    escToClose: "ESC to close",
    searchModelPlaceholder: "Search by model name or ID...",
    freeModels: "Free",
    premiumModels: "Premium",
    noFreeModels: "No free models match.",
    noPremiumModels: "No premium models match.",
    stepsSetup: "Setup",
    stepsRunning: "Running",
    stepsReview: "Review",
    stepsExport: "Export",
    footerTrust: "Local analysis with a privacy-first workflow.",
    footerHeadline: "Move faster with confident repository decisions",
    footerDocs: "Docs",
    footerCli: "CLI",
    footerChangelog: "Changelog",
    footerGithub: "GitHub",
    footerSupport: "Support",
    footerPillLocal: "Local execution",
    footerPillPrivate: "Privacy-first",
    footerPillAccessible: "Accessibility-minded",
    severityCritical: "P0 Critical",
    severityHigh: "P1 High",
    severitySuggestion: "P2 Suggestion",
    eventReceived: "Event received.",
    recentRepositories: "Recent repositories",
    clearRecent: "Clear",
  },
};
