import { useState } from "react";
import { motion } from "motion/react";
import { Globe, Loader2, AlertCircle, BarChart, ShieldCheck, Download } from "lucide-react";
import { geminiApi } from "../lib/geminiApi";
import { getErrorMessage } from "../lib/errors";
import { AppConfigStatus, WebsiteAnalysis } from "../types";
import { exportData } from "../lib/exportUtils";
import { api } from "../lib/api";

const WebsiteAnalyzerComponent = ({ config }: { config: AppConfigStatus | null }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAuditedUrl, setLastAuditedUrl] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const perfData = await api.analyzePerformance(url);
      const scrapedData = await api.scrapeWebsite(url);

      const analysisResult = await geminiApi.analyzeWebsite(scrapedData);

      setAnalysis({
        ...analysisResult,
        performance_score: perfData.performance_score,
        seo_score: perfData.seo_score,
        accessibility_score: perfData.accessibility_score,
        best_practices_score: perfData.best_practices_score,
        is_real: perfData.is_real
      });
      setLastAuditedUrl(perfData.audited_url);

    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo analizar el sitio web."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <section className="lg:col-span-4 pro-card flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div className="col-header text-blue-400 mb-0">Web_Inspector_v4.0</div>
            {analysis?.is_real && (
              <span className="bg-emerald-500/15 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">LIVE DATA</span>
            )}
          </div>
          <h2 className="text-4xl font-bold text-slate-200 mb-6">Auditoría <br/>Digital.</h2>
          <p className="text-slate-400 font-medium text-sm mb-10 max-w-lg">
            Diagnóstico de alta precisión utilizando Google PageSpeed Insights y Análisis Semántico.
          </p>
        </div>

        <div className="mb-6 grid gap-3">
          <div className={`rounded-2xl border px-4 py-3 text-xs font-medium ${config?.gemini ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-amber-500/20 bg-amber-500/10 text-amber-400"}`}>
            {config?.auditMode === "blocked" ? "Falta GEMINI_API_KEY para análisis." : "Gemini conectado para análisis semántico."}
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-xs font-medium ${config?.auditMode === "ready" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-border bg-surface-hover text-slate-400"}`}>
            {config?.auditMode === "ready" ? "PageSpeed conectado: métricas reales activas." : "Sin PAGESPEED_API_KEY: se usan métricas estimadas."}
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Introducí URL del objetivo..."
            className="pro-input w-full"
          />
          <button
            onClick={handleAnalyze}
             disabled={loading || !url || config === null || config?.auditMode === "blocked"}
            className="pro-btn w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Auditando en vivo...
              </span>
            ) : config?.auditMode === "blocked" ? "Cargá GEMINI_API_KEY para auditar" : "Iniciar Auditoría Avanzada"}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-rose-400 flex gap-2 items-center">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-border">
           <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Google PageSpeed Connector</div>
           <p className="text-[10px] text-slate-500 leading-relaxed">
             Para activar datos 100% reales, registrá tu <code className="bg-surface-hover px-1 rounded text-slate-300">PAGESPEED_API_KEY</code>.
           </p>
        </div>
      </section>

      <div className="lg:col-span-8 space-y-8">
        {analysis ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="pro-card relative overflow-hidden group">
              <div className="col-header text-amber-400">Rendimiento_Lighthouse</div>
              <div className="text-8xl font-display font-black text-slate-100 leading-none">{analysis.performance_score}</div>
              <p className="mt-6 text-slate-500 text-xs font-medium">
                {lastAuditedUrl ? `Última URL auditada: ${lastAuditedUrl}` : "Velocidad de carga y estabilidad visual del sitio."}
              </p>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BarChart size={120} />
              </div>
            </div>

            <div className="pro-card grid grid-cols-1 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="col-header mb-0">OPTIMIZACIÓN_SEO</span>
                  <span className="text-xs font-bold text-slate-400">{analysis.seo_score ?? analysis.performance_score}%</span>
                </div>
                <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.seo_score ?? analysis.performance_score}%` }}
                    className="h-full bg-brand"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="col-header mb-0">ACCESIBILIDAD</span>
                  <span className="text-xs font-bold text-slate-400">{analysis.accessibility_score ?? 85}%</span>
                </div>
                <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.accessibility_score ?? 85}%` }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="col-header mb-0">MEJORES_PRÁCTICAS</span>
                  <span className="text-xs font-bold text-slate-400">{analysis.best_practices_score ?? 90}%</span>
                </div>
                <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.best_practices_score ?? 90}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
            </div>

              <button
                onClick={() => {
                  const safeName = url.replace(/[^a-z0-9]/gi, '_').slice(0, 64);
                  exportData.asReadableReport(analysis, url, `auditoria_${safeName}`);
                }}
                className="pro-btn-outline w-full mt-6 flex items-center justify-center gap-2"
              >
                <Download size={16} /> Descargar Reporte (.txt)
              </button>

            <div className="md:col-span-2 pro-card">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-200">Checklist_Operativo</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analysis.seo_checklist.map((item, i) => (
                    <div key={i} className={`p-4 rounded-2xl border flex items-center gap-3 ${item.status === 'pass' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-surface-hover border-border'}`}>
                      <div className={`w-2 h-2 rounded-full ${item.status === 'pass' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                      <span className="text-[11px] font-semibold text-slate-400 flex-1">{item.item.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
            </div>
          </motion.div>
        ) : (
          <div className="pro-card h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-border bg-transparent">
             <div className="w-20 h-20 bg-surface-hover rounded-3xl flex items-center justify-center mb-8">
                <Globe size={40} className="text-slate-600" />
             </div>
             <h3 className="text-xl font-bold text-slate-400">Sin Datos de Análisis</h3>
             <p className="text-slate-500 text-sm max-w-xs mt-2">Ingresá una URL para auditar la infraestructura digital del prospecto.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const WebsiteAnalyzer = WebsiteAnalyzerComponent;
