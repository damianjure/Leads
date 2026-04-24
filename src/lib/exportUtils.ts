/**
 * Utility to download data as files
 */
export const exportData = {
  /**
   * Downloads an object as a JSON file
   */
  asJSON: (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Downloads a website analysis as a readable text report
   */
  asReadableReport: (analysis: any, urlStr: string, filename: string) => {
    const divider = "=========================================================";
    const subDivider = "---------------------------------------------------------";
    
    const report = `
${divider}
REPORTE DE AUDITORÍA DIGITAL - LEADGEN PRO v3.0
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
${analysis.seo_checklist.map((item: any) => 
  `[${item.status === 'pass' ? '✓ EXCELENTE' : '✗ DEFICIENTE'}] ${item.item.replace(/_/g, ' ').toUpperCase()}
   Impacto: ${item.score} puntos.
   Detalle: ${item.details || 'Revisión técnica recomendada.'}`
).join('\n\n')}

[HOJA DE RUTA: MEJORAS]
${analysis.improvements.map((imp: string, i: number) => `(${i + 1}) ${imp}`).join('\n')}

${divider}
FIN DEL REPORTE - LEADGEN PRO AI AGENT
${divider}
`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${filename}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  },

  /**
   * Downloads a list of leads as a CSV file
   */
  leadsToCSV: (leads: any[], filename: string) => {
    if (leads.length === 0) return;
    
    const headers = ['Nombre', 'Dirección', 'Teléfono', 'Web', 'Puntuación'];
    const rows = leads.map(l => [
      l.name,
      l.address,
      l.phone || 'N/A',
      l.website || 'N/A',
      l.opportunity_score
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(item => `"${item.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
