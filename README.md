# TeachMe AI 🎙️🇪🇬
### Real-Time AI Spoken English Coach & Egyptian Phonetics Trainer

[![CI Pipeline](https://github.com/usufalbaz/teachme-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/usufalbaz/teachme-ai/actions)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg)](https://vitejs.dev/)
[![Gemini Live](https://img.shields.io/badge/Gemini-Live_Audio_API-8E75C2.svg)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

TeachMe AI is an advanced, real-time spoken English training platform engineered for Arabic and non-native learners. Powered by Google Gemini Live bidirectional WebSocket audio streaming, TeachMe AI delivers sub-second conversational speech latency, phoneme-level color articulation feedback, and native Egyptian Arabic tutoring and code-switching.

---

## 🏗️ System & Audio Architecture

    +--------------------------+       WebSocket (PCM 16kHz)       +--------------------------+
    |   Client Browser (PWA)   | ================================> | Node.js Express Gateway  |
    |  - Web Audio API Capture |                                   | - Audio Resampling Proxy |
    |  - 24kHz Stream Player   | <================================ | - WebSocket Session Hub  |
    +--------------------------+       Audio Stream (PCM 24kHz)    +-------------+------------+
                                                                                 |
                                                                   Bi-directional Stream
                                                                                 |
                                                                   +-------------v------------+
                                                                   |  Google Gemini Live API  |
                                                                   |  (gemini-3.8-live model) |
                                                                   +--------------------------+

---

## 🌟 Key Capabilities

1. Bidirectional Voice Streaming (Gemini Live WebSockets):
   * Low-latency bidirectional audio capture at 16kHz and playback at 24kHz via Web Audio API.
   * Natural interruption handling (barge-in): speaking immediately halts model audio playback.
   * 5 pedagogical AI personas tailored for diverse conversational contexts.

2. Native Egyptian Arabic Tutoring & Phonetic Code-Switching:
   * Bilingual speech understanding accommodating Egyptian Arabic dialects and Arabized English.
   * Targeted articulatory remediation for common Middle Eastern phonetic traps (/p/ vs /b/, dental /θ/ vs /s/, silent letters).

3. Phoneme-Level Visual Articulation Analyzer:
   * Color-coded phonetic breakdown identifying specific articulation errors.
   * Visual tongue and lip movement diagrams based on International Phonetic Alphabet (IPA) standards.

4. Session Analytics & Cloud Persistence:
   * Dialogue transcript logging and fluency metrics stored securely in Google Cloud Firestore.
   * Historical session reviews and targeted vocabulary micro-drills.

---

## 🛠️ Tech Stack

* Frontend: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
* Audio Core: Web Audio API, Web Speech API
* Backend Proxy: Node.js, Express, ws (WebSocket Server), @google/genai SDK
* Storage & Auth: Google Cloud Firestore, Firebase Authentication
* Tooling: Vite, TypeScript, GitHub Actions CI

---

## 🚀 Local Installation & Setup

1. Clone the repository:
    git clone https://github.com/usufalbaz/teachme-ai.git
    cd teachme-ai

2. Install dependencies:
    npm install

3. Configure environment variables:
   Create a .env file in the root directory:
    GEMINI_API_KEY=your_gemini_api_key_here

4. Run the development server:
    npm run dev

   Open http://localhost:3000 in your browser.

---

## 📄 License
Distributed under the MIT License. See LICENSE for details.
