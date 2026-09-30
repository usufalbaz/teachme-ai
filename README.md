# TeachMe AI 🎙️🇪🇬
### Real-Time AI Spoken English Coach & Phonetics Trainer

**TeachMe AI** is an advanced, real-time spoken English training platform engineered for non-native learners (CEFR Levels A1 to C1). Inspired by industry-leading applications like **ELSA Speak**, **Praktika AI**, and **Pingo AI**, TeachMe AI combines ultra-low latency conversational audio streaming with phoneme-level pronunciation diagnosis and native **Egyptian Arabic (العامية المصرية)** comprehension and coaching.

---

## 🌟 Key Features

### 1. ⚡ Real-Time Spoken Conversation (Gemini Live WebSockets)
- Zero-lag bidirectional voice streaming over WebSockets.
- Natural interruption handling: interrupt the coach mid-sentence and it immediately yields the floor.
- Expressive, pedagogical AI personas tailored for diverse scenarios (Airport Customs, Job Interviews, Coffee Ordering, Tech Standups).

### 2. 🇪🇬 Native Egyptian Arabic Tutoring & Code-Switching
- Full comprehension of Egyptian Arabic dialects and Arabized English.
- If learners hesitate or ask questions in Egyptian Arabic (*"يعني إيه ديه؟"*, *"مش عارف أنطقها ازاي"*), TeachMe AI explains warmly in friendly Egyptian Arabic, gives the English equivalent, and guides them to speak in English.
- Targeted articulatory tips for common Egyptian phonetic traps:
  - **/p/ vs /b/** bilabial air-burst guidance.
  - **/θ/ and /ð/** dental placement (*طرف اللسان بين الأسنان*).
  - Silent letters (*receipt*, *Wednesday*, *doubt*).

### 3. 🎯 ELSA-Style Phoneme-Level Color Analyzer
- Visual word breakdown into individual phonemes:
  - 🟢 **Green**: Accurate phoneme (100%).
  - 🟡 **Yellow**: Minor vowel duration / stress drift.
  - 🔴 **Red**: Common articulation error.
- Comprehensive **Mouth & Tongue Articulatory Guide** displaying lip shapes, tongue positioning, and vocal cord vibration status.

### 4. 🔁 Repeat & Master (Micro-Drills)
- Instant drill mode for flagged words with slowed audio playback (0.7x and 1.0x).
- Spoken voice recognition comparing student attempts against target IPA sounds.
- Instant scoring and gamified **+15 XP** rewards with confetti feedback.

### 5. 📊 Session Transcript Review & Firestore Persistence
- Full conversation logging stored in **Google Cloud Firestore**.
- In-depth review in the **Analytics Tab** for the last 3 voice sessions, complete with speaker dialogue bubbles, IPA targets, and audio listen buttons for each turn.

### 6. 📱 Android & PWA Ready
- Certified **Progressive Web App (PWA)** installable directly on Android and desktop devices.
- Ready for native **Android .APK / .AAB** export via Capacitor.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Audio Processing**: Web Audio API (16kHz PCM capture, 24kHz Web Audio player), Web Speech Recognition.
- **AI Engine**: Google Gemini API (`gemini-3.8-flash`, `gemini-3.8-live` via WebSocket proxy).
- **Backend**: Node.js, Express, `ws` (WebSocket server), `@google/genai` TypeScript SDK.
- **Database & Auth**: Firebase Firestore & Firebase Authentication.
- **Build Tool**: Vite.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- A Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/teachme-ai.git
   cd teachme-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Exporting to Native Android APK

To build a standalone `.apk` or `.aab` package for Google Play:

```bash
# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize Capacitor
npx cap init TeachMe com.teachme.ai --web-dir dist

# 3. Build Web Assets
npm run build

# 4. Add Android Project
npx cap add android

# 5. Open in Android Studio & Generate APK
npx cap open android
```

---

## 👨‍💻 Engineering & Architecture

- **Lead Architect & Systems Engineer**: **Eng. Yousuf Albaz** (AI & Systems Engineer)
- **Repository**: [github.com/usufalbaz/teachme-ai](https://github.com/usufalbaz/teachme-ai)

---

## 📄 License
MIT License. Developed & Engineered by Eng. Yousuf Albaz. All rights reserved.
