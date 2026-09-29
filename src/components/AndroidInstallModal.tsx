import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Copy, 
  Check, 
  X, 
  Layers, 
  Terminal, 
  Zap, 
  Globe,
  Cloud,
  FileArchive,
  Server,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../context/LanguageContext';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { language } = useLanguage();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'download' | 'deploy' | 'pwa' | 'apk'>('download');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderScript = `# 1. رفع الكود لـ GitHub:
git add -A
git commit -m "Deploy: Production Release"
git push origin main

# 2. في Render.com أو Railway.app:
# - اختر: New Web Service -> اربط مستودعك على GitHub
# - Build Command: npm install && npm run build
# - Start Command: npm start
# - Environment Variables: أضف GEMINI_API_KEY
# مبروك! موقعك شغال أونلاين بالـ WebSockets ومدعوم بشهادة SSL مجانية ودومين مخصص!`;

  const buildApkScript = `# خطوات استخراج ملف APK أو AAB بـ Capacitor:
1. npm install @capacitor/core @capacitor/cli @capacitor/android
2. npx cap init TeachMe com.teachme.ai --web-dir dist
3. npm run build
4. npx cap add android
5. npx cap open android   # يفتح في Android Studio وتضغط Build -> Generate Signed APK!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl liquid-glass-elevated border border-white/15 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">
                  تحميل المشروع ورفعه كموقع احترافي 🚀
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Ready to Deploy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تحميل الكود كاملاً كملف مضغوط، ورفعه أونلاين، وتثبيته على الهاتف.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl liquid-pill text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-2xl bg-black/40 border border-white/[0.08] text-xs font-bold">
          <button
            onClick={() => setActiveTab('download')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'download'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span>تحميل ZIP</span>
          </button>

          <button
            onClick={() => setActiveTab('deploy')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'deploy'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>رفع كموقع حي</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>تثبيت PWA</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>أندرويد APK</span>
          </button>
        </div>

        {/* Tab 1: Download Complete Source ZIP */}
        {activeTab === 'download' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl liquid-card border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2.5 font-bold text-white text-sm">
                <FileArchive className="w-5 h-5 text-indigo-400" />
                <span>تحميل سورس كود المشروع كاملاً (Ready-to-Run)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                تم تجهيز حزمة مضغوطة نظيفة بالكامل تحتوي على الواجهة وتطبيق React، وخادم WebSockets السريع، وإعدادات Firebase، وقواعد الحماية، وجميع المكونات دون أي ملفات زائدة.
              </p>

              <div className="pt-2">
                <a
                  href="https://github.com/usufalbaz/teachme-ai/archive/refs/heads/main.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل كود المشروع من GitHub (Source ZIP)</span>
                </a>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-2">
              <span className="font-bold text-slate-200 block">طريقة تشغيل الكود على جهازك بعد التحميل:</span>
              <ol className="text-slate-400 space-y-1 list-decimal list-inside">
                <li>فك ضغط الملف في أي مجلد على جهازك.</li>
                <li>افتح المجلد في Visual Studio Code أو Terminal.</li>
                <li>اكتب: <code className="text-indigo-300 font-mono">npm install</code> لتحميل الحزم.</li>
                <li>اكتب: <code className="text-indigo-300 font-mono">npm run dev</code> وافتح <code className="text-emerald-300 font-mono">http://localhost:3000</code>!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 2: Deploy to Professional Web Hosting */}
        {activeTab === 'deploy' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-400/20 text-xs leading-relaxed space-y-2">
              <span className="font-bold text-sm text-indigo-300 block">
                أفضل وأسهل طرق رفع التطبيق كموقع دائم مع WebSockets ودومين خاص:
              </span>
              <p className="text-slate-300">
                لأن التطبيق يتضمن خادم صوتي فوري بالـ WebSockets، يحتاج لاستضافة تدعم Node.js و WebSockets (وليس مجرد صفحات ثابتة). وأفضل خيارات مجانية واحترافية هي:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Render.com */}
              <div className="p-4 rounded-2xl liquid-card border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">1. منصة Render.com</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">مجاني وموصى به</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تدعم WebSockets مباشرة مع ربط سهل بمستودع GitHub وشهادة SSL مجانية وإمكانية ربط أي دومين خاص بضغطة زر.
                </p>
                <div className="text-[11px] text-indigo-300 pt-1">
                  Start Command: <code className="font-mono bg-black/40 px-1 py-0.5 rounded">npm start</code>
                </div>
              </div>

              {/* Option B: Railway.app */}
              <div className="p-4 rounded-2xl liquid-card border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">2. منصة Railway.app</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">أداء فائق</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تتعرف تلقائياً على مشروع Node.js وتقوم بعمل Build و Deploy في ثوانٍ مع سرعة عالية جداً ومراقبة أداء مباشرة.
                </p>
                <div className="text-[11px] text-indigo-300 pt-1">
                  Build: <code className="font-mono bg-black/40 px-1 py-0.5 rounded">npm run build</code>
                </div>
              </div>
            </div>

            {/* Script Box */}
            <div className="relative rounded-2xl bg-black/60 border border-white/[0.08] p-4 font-mono text-xs text-indigo-300 overflow-x-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08] text-slate-400">
                <span className="text-[11px] font-sans font-bold">خطوات الرفع الدائم خطوة بخطوة:</span>
                <button
                  onClick={() => copyToClipboard(renderScript, 'deploy_script')}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-white transition"
                >
                  {copiedCode === 'deploy_script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'deploy_script' ? 'تم النسخ!' : 'نسخ التعليمات'}</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed">{renderScript}</pre>
            </div>
          </div>
        )}

        {/* Tab 3: PWA Immediate Install */}
        {activeTab === 'pwa' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>تطبيق أندرويد وآيفون مثبت بالكامل ويعمل بدون متصفح!</span>
              </div>
              <p>
                تم تزويد TeachMe بتقنية <strong>Progressive Web App (PWA)</strong>، مما يتيح لك ولأي مستخدم تثبيته على الموبايل كأيقونة تطبيق مستقلة في الشاشة الرئيسية بشاشة كاملة (Standalone) مع دعم الميكروفون والإشعارات.
              </p>
            </div>

            {/* Direct Install Button */}
            {isInstallable && (
              <button
                onClick={install}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <Download className="w-5 h-5" />
                <span>تثبيت التطبيق على هاتفك الآن (1-Click Install)</span>
              </button>
            )}

            {isInstalled && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 text-center text-xs text-emerald-400 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>التطبيق مثبت بالفعل ويعمل في وضع Standalone الكامل!</span>
              </div>
            )}

            {/* Manual Steps for Android Chrome */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                طريقة التثبيت من متصفح الهاتف (Chrome أو Samsung Internet):
              </h4>
              <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
                <li>افتح رابط التطبيق من هاتف الأندرويد.</li>
                <li>اضغط على <strong>النقاط الثلاث (⋮)</strong> في أعلى يمين المتصفح.</li>
                <li>اختر <strong>"تثبيت التطبيق" (Install App)</strong> أو <strong>"إضافة إلى الشاشة الرئيسية"</strong>.</li>
                <li>سيظهر التطبيق بأيقونته الرسمية بين تطبيقات هاتفك تماماً كأي تطبيق من Google Play!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 4: Exporting as Raw .APK */}
        {activeTab === 'apk' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-indigo-300">
                <Layers className="w-4 h-4" />
                <span>كيف تستخرج ملف .APK أصلي لمتجر Google Play؟</span>
              </div>
              <p>
                عبر أداة <strong>Capacitor</strong> الرسمية، يمكنك تحويل هذا المشروع إلى تطبيق Android Studio أصلي واستخراج ملف APK أو AAB خلال دقائق:
              </p>
            </div>

            <div className="relative rounded-2xl bg-black/60 border border-white/[0.08] p-4 font-mono text-xs text-indigo-300 overflow-x-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08] text-slate-400">
                <span className="text-[11px] font-sans font-bold">أوامر استخراج APK في Terminal:</span>
                <button
                  onClick={() => copyToClipboard(buildApkScript, 'apk_script')}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-white transition"
                >
                  {copiedCode === 'apk_script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'apk_script' ? 'تم النسخ!' : 'نسخ الأوامر'}</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed">{buildApkScript}</pre>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl liquid-card border border-white/[0.08] space-y-1">
                <span className="font-bold text-white">ملف APK خفيف</span>
                <p className="text-[11px] text-slate-400">حجمه لا يتعدى 5 إلى 8 ميجابايت وسريع جداً.</p>
              </div>
              <div className="p-3.5 rounded-2xl liquid-card border border-white/[0.08] space-y-1">
                <span className="font-bold text-white">Google Play Store</span>
                <p className="text-[11px] text-slate-400">جاهز تماماً للرفع كحزمة AAB للمتجر.</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Close */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl liquid-pill text-slate-200 text-xs font-bold transition hover:text-white"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
