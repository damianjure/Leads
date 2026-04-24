import { useState } from "react";
import { motion } from "motion/react";
import { Globe, Search, Loader2, CheckCircle2, XCircle, AlertCircle, BarChart, ShieldCheck, Download } from "lucide-react";
import { geminiService } from "../geminiService";
import { WebsiteAnalysis } from "../types";
import { exportData } from "../lib/exportUtils";

export const WebsiteAnalyzer = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Get real performance data from new endpoint
      const perfPromise = fetch("/api/analyze/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }).then(res => res.json());

      // 2. Scrape via backend proxy for AI analysis
      const scrapePromise = fetch("/api/proxy/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }).then(res => res.json());

      const [perfData, scrapedData] = await Promise.all([perfPromise, scrapePromise]);
      
      if (scrapedData.error) throw new Error(scrapedData.error);
      if (perfData.error) throw new Error(perfData.error);

      // 3. Analyze via Gemini
      const analysisResult = await geminiService.analyzeWebsite(scrapedData);
      
      // Merge real scores if available
      setAnalysis({
        ...analysisResult,
        performance_score: perfData.performance_score,
        seo_score: perfData.seo_score,
        accessibility_score: perfData.accessibility_score,
        best_practices_score: perfData.best_practices_score,
        is_real: perfData.is_real
      });

    } catch (err: any) {
      setError(err.message || "Failed to analyze website");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <section className="lg:col-span-4 pro-card bg-teal/5 flex flex-col justify-between border-teal/20">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div className="col-header text-teal-700 mb-0">Web_Inspector_v3.0</div>
            {analysis?.is_real && (
              <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full ring-1 ring-emerald-200">LIVE DATA</span>
            )}
          </div>
          <h2 className="text-4xl font-bold mb-6">Auditoría <br/>Digital.</h2>
          <p className="text-slate-500 font-medium text-sm mb-10 max-w-lg">
            Diagnóstico de alta precisión utilizando Google PageSpeed Insights y Análisis Semántico.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Introduce URL del objetivo..."
            className="pro-input w-full"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !url}
            className="pro-btn w-full shadow-lg shadow-brand/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Auditando en vivo...
              </span>
            ) : "Iniciar Auditoría Avanzada"}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-rose-600 flex gap-2 items-center">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-teal/10">
           <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Google PageSpeed Connector</div>
           <p className="text-[10px] text-slate-400 leading-relaxed">
             Para activar datos 100% reales, registra tu <code className="bg-slate-100 px-1 rounded">PAGESPEED_API_KEY</code> en la configuración.
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
            {/* Real KPI Grid */}
            <div className="pro-card bg-yellow/10 border-yellow/20 relative overflow-hidden group">
              <div className="col-header text-amber-700">Rendimiento_Lighthouse</div>
              <div className="text-8xl font-display font-black text-slate-800 leading-none">{analysis.performance_score}</div>
              <p className="mt-6 text-slate-500 text-xs font-medium">Velocidad de carga y estabilidad visual del sitio.</p>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BarChart size={120} />
              </div>
            </div>

            <div className="pro-card grid grid-cols-1 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="col-header mb-0">OPTIMIZACIÓN_SEO</span>
                  <span className="text-xs font-bold text-slate-400">{analysis.seo_score || analysis.performance_score}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.seo_score || analysis.performance_score}%` }}
                    className="h-full bg-brand" 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="col-header mb-0">ACCESIBILIDAD</span>
                  <span className="text-xs font-bold text-slate-400">{analysis.accessibility_score || 85}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.accessibility_score || 85}%` }}
                    className="h-full bg-teal" 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="col-header mb-0">MEJORES_PRÁCTICAS</span>
                  <span className="text-xs font-bold text-slate-400">{analysis.best_practices_score || 90}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.best_practices_score || 90}%` }}
                    className="h-full bg-mint" 
                  />
                </div>
              </div>
            </div>
              
              <button 
                onClick={() => exportData.asReadableReport(analysis, url, `auditoria_${url.replace(/[^a-z0-9]/gi, '_')}`)}
                className="pro-btn-outline w-full mt-6 flex items-center justify-center gap-2"
              >
                <Download size={16} /> Descargar Reporte (.txt)
              </button>

            <div className="md:col-span-2 pro-card">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-mint rounded-xl flex items-center justify-center text-emerald-700">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-2xl font-bold">Checklist_Operativo</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analysis.seo_checklist.map((item, i) => (
                    <div key={i} className={`p-4 rounded-2xl border flex items-center gap-3 ${item.status === 'pass' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className={`w-2 h-2 rounded-full ${item.status === 'pass' ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300'}`} />
                      <span className="text-[11px] font-semibold text-slate-600 flex-1">{item.item.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
            </div>
          </motion.div>
        ) : (
          <div className="pro-card h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-slate-50 border-dashed border-2 border-slate-200">
             <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-8">
                <Globe size={40} className="text-slate-200" />
             </div>
             <h3 className="text-xl font-bold text-slate-400">Sin Datos de Análisis</h3>
             <p className="text-slate-400 text-sm max-w-xs mt-2">Ingresa una URL para auditar la infraestructura digital del prospecto.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CheckItem = ({ label, checked }: { label: string; checked: boolean }) => (
  <div className="flex items-center justify-between text-xs py-1">
    <span className="text-slate-400">{label}</span>
    {checked ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-rose-500" />}
  </div>
);
