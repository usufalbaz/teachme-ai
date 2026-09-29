import React, { useState } from 'react';
import { X, CloudUpload, Terminal, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HostingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostingGuideModal: React.FC<HostingGuideModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: 'Step 1: Install Firebase CLI',
      desc: 'Ensure you have the Firebase Command Line Interface installed globally.',
      command: 'npm install -g firebase-tools',
    },
    {
      title: 'Step 2: Authenticate with Firebase',
      desc: 'Log in using the Google account associated with your Firebase project.',
      command: 'firebase login',
    },
    {
      title: 'Step 3: Initialize Firebase in Root Directory',
      desc: 'Run initialization and choose Hosting. Set "dist" as your public directory and configure as single-page app.',
      command: 'firebase init hosting',
    },
    {
      title: 'Step 4: Build Production Assets',
      desc: 'Compile TypeScript and bundle Tailwind CSS into the dist directory.',
      command: 'npm run build',
    },
    {
      title: 'Step 5: Deploy to Firebase Hosting',
      desc: 'Deploy the production build to your live Firebase CDN URL with SSL automatically configured.',
      command: 'firebase deploy --only hosting',
    },
  ];

  const sampleFirebaseJson = `{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Firebase Hosting Deployment Guide
              </h2>
              <p className="text-xs text-slate-400">
                Deploy TeachMe (تيتش مي) to Google Cloud CDN with custom domain support.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{step.title}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                  0{idx + 1}
                </span>
              </div>
              <p className="text-xs text-slate-400">{step.desc}</p>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-sky-300">
                <span>{step.command}</span>
                <button
                  onClick={() => handleCopy(step.command, idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
                  title="Copy command"
                >
                  {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* firebase.json Config Snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Recommended firebase.json Configuration:
            </span>
            <button
              onClick={() => handleCopy(sampleFirebaseJson, 99)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              {copiedIndex === 99 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy JSON</span>
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
            {sampleFirebaseJson}
          </pre>
        </div>

        {/* Security Rules Notice */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-xs text-emerald-300">
          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
          <p>
            Your Firestore security rules are already hardened and deployed directly to project <code className="font-mono text-white">gen-lang-client-0928584844</code> via the Firebase API!
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
