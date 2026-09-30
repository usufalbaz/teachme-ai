export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  level: CEFRLevel;
  ieltsBand?: number; // 4.0 - 9.0
  totalSpokenSeconds?: number;
  targetLanguage?: string;
  nativeLanguage?: string;
  xp: number;
  streak: number;
  lastActiveDate?: string;
  completedLessonIds: string[];
  reminderEnabled?: boolean;
  reminderTime?: string; // HH:mm format, e.g. "20:00"
  dailyXpGoal?: number; // e.g. 50, 100
  createdAt?: string;
  updatedAt?: string;
}

export interface IeltsQuestion {
  id: string;
  module: 'listening' | 'reading' | 'writing' | 'speaking';
  title: string;
  titleAr: string;
  instructions: string;
  instructionsAr: string;
  audioPromptUrl?: string;
  audioScriptText?: string;
  readingPassage?: string;
  promptText: string;
  type: 'multiple_choice' | 'short_answer' | 'essay_input' | 'spoken_record';
  options?: string[];
  correctAnswer?: string;
  sampleAnswer?: string;
  rubricNotes?: string;
}

export interface IeltsTestResult {
  id: string;
  userId: string;
  overallBand: number; // e.g. 6.5
  cefrEquivalent: CEFRLevel;
  listeningBand: number;
  readingBand: number;
  writingBand: number;
  speakingBand: number;
  feedbackSummary: string;
  speakingFeedback?: {
    fluencyScore: number;
    pronunciationScore: number;
    grammarScore: number;
    vocabularyScore: number;
    transcribedSpeech?: string;
  };
  createdAt: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  titleAr: string;
  desc: string;
  descAr: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  unlockedAt?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'error_correction';
  question: string;
  questionAr?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  explanationAr?: string;
  hint?: string;
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  level: CEFRLevel;
  category: 'grammar' | 'vocabulary' | 'scenario' | 'pronunciation';
  icon: string;
  youtubeId?: string; // YouTube video ID for embed
  videoTitle?: string;
  xpReward: number;
  estimatedMinutes: number;
  grammarRules: {
    ruleTitle: string;
    ruleTitleAr: string;
    explanation: string;
    explanationAr: string;
    formula?: string;
    examples: {
      en: string;
      ar: string;
      phonetic?: string;
    }[];
  }[];
  quizzes: QuizQuestion[];
}

export interface Unit {
  id: string;
  number: number;
  level: CEFRLevel;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  lessons: Lesson[];
}

export interface VoiceScenario {
  id: string;
  title: string;
  titleAr: string;
  level: CEFRLevel;
  category: string;
  description: string;
  descriptionAr: string;
  icon: string;
  avatar: string;
  personaName: string;
  personaRole: string;
  initialMessage: string;
  systemInstruction: string;
  targetVocabulary: { word: string; ipa: string; meaning: string }[];
  targetGrammarPoint: string;
}

export interface PronunciationLog {
  id: string;
  userId: string;
  word: string;
  phoneticTarget: string;
  phoneticActual?: string;
  feedback: string;
  scenarioId?: string;
  accuracy?: number;
  occurrenceCount?: number;
  createdAt: string;
}

export interface TranscriptTurn {
  id: string;
  role: 'user' | 'model';
  speakerName: string;
  text: string;
  timestamp: string;
  phoneticFeedback?: {
    word: string;
    targetIpa: string;
    spokenIpa?: string;
    tip: string;
  }[];
  arabicHint?: string;
}

export interface PracticeSession {
  id: string;
  userId: string;
  scenarioId: string;
  scenarioTitle: string;
  durationSeconds: number;
  score: number;
  turnsCount: number;
  strengths: string[];
  improvements: string[];
  mispronouncedWords: string[];
  transcript?: TranscriptTurn[];
  createdAt: string;
}

export interface PronunciationAssessmentResult {
  transcript: string;
  phoneticFeedback: {
    word: string;
    targetIpa: string;
    spokenIpa: string;
    mistakeType: string;
    tip: string;
    isCorrect: boolean;
  }[];
  grammarCorrections: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
  overallScore: number;
  encouragingFeedback: string;
}
