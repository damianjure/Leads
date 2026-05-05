import { Lead, WebsiteAnalysis, AdRecommendation } from "../types";

const sanitizeCSVCell = (value: string) => {
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
};

const downloadBlob = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  try {
    document.body.appendChild(link);
    link.click();
  } finally {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const exportData = {
  asJSON: <T,>(data: T, filename: string) => {
    downloadBlob(JSON.stringify(data, null, 2), `${filename}.json`, "application/json");
  },

  asReadableReport: (analysis: WebsiteAnalysis, urlStr: string, filename: string) => {
    const divider = "=========================================================";
    const subDivider = "---------------------------------------------------------";

    const report = `
${divider}
REPORTE DE AUDITORÍA DIGITAL - LEADMAP STUDIO v3.0
${divider}

[DATOS DEL ANÁLISIS]
- URL Analizada:   ${urlStr}
- Fecha/Hora:      ${new Date().toLocaleString()}
- Calidad Datos:   ${analysis.is_real ? 'GOOGLE PAGESPEED (LIVE)' : 'IA ESTIMADA'}

[KPIs PRINCIPALES]
${subDivider}
- RENDIMIENTO:      ${analysis.performance_score}/100
- SEO TÉCNICO:      ${analysis.seo_score || analysis.performance_score}/100
- ACCESIBILIDAD:    ${analysis.accessibility_score || '85'}/100
- MEJORES PRÁCTICAS: ${analysis.best_practices_score || '90'}/100

PREPARACIÓN CAPTURA LEADS: [ ${analysis.lead_capture_readiness} ]
${subDivider}

[ANÁLISIS SEMÁNTICO Y ESTRUCTURAL]
- Score de Títulos:      ${analysis.seo_breakdown.title_score}%
- Score de Meta-Tags:    ${analysis.seo_breakdown.meta_score}%
- Estructura de H1:      ${analysis.seo_breakdown.h1_score}%
- Palabras Clave:        ${analysis.seo_breakdown.keywords.join(', ')}

[CHECKLIST DE CUMPLIMIENTO]
${analysis.seo_checklist.map((item) =>
  `[${item.status === 'pass' ? '✓ EXCELENTE' : '✗ DEFICIENTE'}] ${item.item.replace(/_/g, ' ').toUpperCase()}
   Impacto: ${item.score} puntos.
   Detalle: ${item.details || 'Revisión técnica recomendada.'}`
).join('\n\n')}

[HOJA DE RUTA: MEJORAS]
${analysis.improvements.map((imp: string, i: number) => `(${i + 1}) ${imp}`).join('\n')}

${divider}
FIN DEL REPORTE - LEADMAP STUDIO
${divider}
`;

    downloadBlob(report, `${filename}.txt`, "text/plain;charset=utf-8");
  },

  leadsToCSV: (leads: Lead[], filename: string) => {
    if (leads.length === 0) return;

    const headers = ['Nombre', 'Dirección', 'Teléfono', 'Web', 'Puntuación'];
    const rows = leads.map(l => [
      sanitizeCSVCell(l.name),
      sanitizeCSVCell(l.address),
      sanitizeCSVCell(l.phone || 'N/A'),
      sanitizeCSVCell(l.website || 'N/A'),
      l.opportunity_score,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(item => `"${item.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadBlob(csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
  },

  strategyToMarkdown: (recommendations: AdRecommendation, filename: string) => {
    const content = [
      "# Estrategia publicitaria",
      "",
      "## Enfoque",
      recommendations.strategy,
      "",
      "## Canales recomendados",
      ...recommendations.channels.map((channel) => `- ${channel}`),
      "",
      "## Segmentación sugerida",
      ...recommendations.targeting.map((target) => `- ${target}`),
    ].join("\n");

    downloadBlob(content, `${filename}.md`, "text/markdown;charset=utf-8");
  },
};
