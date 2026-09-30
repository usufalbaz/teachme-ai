import { IeltsQuestion, CEFRLevel } from '../types';

export interface IeltsModuleData {
  id: string;
  module: 'listening' | 'reading' | 'writing' | 'speaking';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  durationMinutes: number;
  questions: IeltsQuestion[];
}

export const IELTS_MODULES: IeltsModuleData[] = [
  {
    id: 'ielts_listening',
    module: 'listening',
    title: 'Listening & Audio Comprehension',
    titleAr: 'اختبار الاستماع والفهم الصوتي الأكاديمي',
    description: 'Listen to native dialogues and university lecture excerpts, then answer comprehension and note-completion tasks.',
    descriptionAr: 'استمع إلى مقاطع صوتية بلكنات أصلية ثم أجب عن أسئلة ملء الفراغات والاختيار من متعدد بدقة.',
    durationMinutes: 6,
    questions: [
      {
        id: 'ielts_l_1',
        module: 'listening',
        title: 'Section 1: International Tech Symposium Registration',
        titleAr: 'القسم الأول: حوار حجز المؤتمر التقني',
        instructions: 'Click the speaker button to listen to the dialogue, then complete the official attendee form.',
        instructionsAr: 'اضغط على زر الاستماع لسماع الحوار ثم أكمل خانات استمارة التسجيل.',
        audioScriptText: "Registrar: Good morning, Apex Global Tech Summit. How may I assist you today? Caller: Hello, I would like to confirm my delegate reservation. My surname is Vance, spelled V-A-N-C-E, and my company registration code is TX-940. Registrar: Splendid. Which workshop track will you be attending? Caller: I registered for Cloud Infrastructure on Thursday, the 14th of November. Registrar: Perfect, Mr. Vance. Your confirmation badge will be waiting at Hall C.",
        promptText: "According to the speaker, what is the registration code and confirmed date?",
        type: 'multiple_choice',
        options: [
          'Code: TX-940, Date: November 14th (Hall C)',
          'Code: TX-490, Date: November 4th (Hall B)',
          'Code: RX-940, Date: November 24th (Hall C)',
          'Code: TX-900, Date: November 15th (Hall A)'
        ],
        correctAnswer: 'Code: TX-940, Date: November 14th (Hall C)',
        sampleAnswer: 'Code: TX-940, Date: 14th November'
      },
      {
        id: 'ielts_l_2',
        module: 'listening',
        title: 'Section 2: Lecture on Urban Architecture & Climate',
        titleAr: 'القسم الثاني: محاضرة عن الهندسة البيئية الحضرية',
        instructions: 'Listen to the professor explain passive cooling in modern architecture, then select the primary factor identified.',
        instructionsAr: 'استمع لمحاضرة البروفيسور واختر العامل الرئيسي في التبريد البيئي.',
        audioScriptText: "Professor: When we examine bioclimatic architecture in arid metropolises, mechanical air conditioning accounts for over forty percent of peak grid load. However, by strategically orienting wind catchers and incorporating cross-ventilation courtyards, engineers can lower indoor ambient temperatures by up to seven degrees Celsius without consuming electricity.",
        promptText: "What architectural element allows an indoor temperature reduction of up to 7°C without power?",
        type: 'multiple_choice',
        options: [
          'Strategically oriented wind catchers and cross-ventilation courtyards',
          'Solar-powered high-capacity water chillers',
          'Triple-glazed tinted reflective windows',
          'Underground geothermal heat exchangers'
        ],
        correctAnswer: 'Strategically oriented wind catchers and cross-ventilation courtyards',
        sampleAnswer: 'Wind catchers and courtyards'
      }
    ]
  },
  {
    id: 'ielts_reading',
    module: 'reading',
    title: 'Academic Reading & Lexical Nuance',
    titleAr: 'اختبار القراءة والمفردات الأكاديمية',
    description: 'Read peer-reviewed academic extracts and analyze arguments, inference, and lexical context.',
    descriptionAr: 'قراءة نصوص أكاديمية متقدمة واستنتاج المعنى الضمني ومطابقة المترادفات الأكاديمية.',
    durationMinutes: 7,
    questions: [
      {
        id: 'ielts_r_1',
        module: 'reading',
        title: 'Passage 1: Neurological Plasticity and Language Acquisition',
        titleAr: 'النص الأول: المرونة العصبية واكتساب اللغات',
        instructions: 'Read the academic passage below and determine whether the statement is TRUE, FALSE, or NOT GIVEN.',
        instructionsAr: 'اقرأ النص الأكاديمي وحدد صحة العبارة وفقاً للمقال.',
        readingPassage: "For decades, the critical period hypothesis posited that adult learners are fundamentally incapable of achieving native-like phonological competence due to diminished cerebral plasticity. Contemporary neuroimaging studies have nuanced this deterministic viewpoint. While synaptic pruning during late adolescence undeniably attenuates automatic acoustic mimicry, deliberate phonetic conditioning combined with immersion stimulates novel neural pathways in the left superior temporal gyrus, demonstrating that accent modification remains neurologically viable throughout adulthood.",
        promptText: "Statement: Modern neuroimaging proves that adults cannot physically alter their accent after adolescence.",
        type: 'multiple_choice',
        options: ['FALSE', 'TRUE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        rubricNotes: 'The passage explicitly refutes this: neuroimaging demonstrates accent modification remains viable throughout adulthood.'
      },
      {
        id: 'ielts_r_2',
        module: 'reading',
        title: 'Passage 2: Lexical Precision in Context',
        titleAr: 'النص الثاني: المعنى اللغوي الدقيق في السياق الأكاديمي',
        instructions: 'Based on the passage, select the precise contextual synonym for the word "attenuates".',
        instructionsAr: 'اختر المرادف الأكاديمي الدقيق لكلمة "attenuates" في سياق النص.',
        readingPassage: "While synaptic pruning during late adolescence undeniably attenuates automatic acoustic mimicry, deliberate phonetic conditioning stimulates novel neural pathways.",
        promptText: "In the sentence above, the word 'attenuates' most nearly means:",
        type: 'multiple_choice',
        options: [
          'Weakens or diminishes in intensity',
          'Completely eliminates and destroys',
          'Accelerates and boosts rapidly',
          'Standardizes and regulates'
        ],
        correctAnswer: 'Weakens or diminishes in intensity',
        rubricNotes: 'Attenuate means to reduce the force, effect, or value of something.'
      }
    ]
  },
  {
    id: 'ielts_writing',
    module: 'writing',
    title: 'Writing & Syntactic Cohesion',
    titleAr: 'اختبار الكتابة والدقة اللغوية والتركيب',
    description: 'Demonstrate grammatical range, academic vocabulary, and structured argumentation.',
    descriptionAr: 'صياغة فقرة أكاديمية متماسكة وتصحيح التراكيب المعقدة واستخدام روابط الجمل.',
    durationMinutes: 8,
    questions: [
      {
        id: 'ielts_w_1',
        module: 'writing',
        title: 'Task 1: Grammatical Error Identification & Inversion',
        titleAr: 'المهمة الأولى: تصحيح التركيب اللغوي المتقدم',
        instructions: 'Identify the sentence that correctly employs negative adverb inversion for academic impact.',
        instructionsAr: 'اختر الجملة المصاغة بشكل صحيح وفقاً لقاعدة Inversion الأكاديمية.',
        promptText: "Which of the following sentences correctly utilizes formal inversion?",
        type: 'multiple_choice',
        options: [
          'Seldom have researchers witnessed such dramatic efficiency gains without compromising safety.',
          'Seldom researchers have witnessed such dramatic efficiency gains without compromising safety.',
          'Seldom had witnessed researchers such dramatic efficiency gains without compromising safety.',
          'Seldom did researchers witnessed such dramatic efficiency gains without compromising safety.'
        ],
        correctAnswer: 'Seldom have researchers witnessed such dramatic efficiency gains without compromising safety.',
        sampleAnswer: 'Seldom + auxiliary + subject + main verb'
      },
      {
        id: 'ielts_w_2',
        module: 'writing',
        title: 'Task 2: Academic Opinion Argumentation',
        titleAr: 'المهمة الثانية: كتابة فقرة رأي أكاديمية متماسكة',
        instructions: 'Write a concise argument (3-5 sentences) answering: "Should artificial intelligence be utilized to assess spoken fluency in formal university admissions?" Support your stance with cohesive linking devices (e.g., Furthermore, However, Consequently).',
        instructionsAr: 'اكتب فقرة أكاديمية من 3 إلى 5 جمل تبدي فيها رأيك مع استخدام أدوات الربط الأكاديمية.',
        promptText: "Type your academic argument in English below:",
        type: 'essay_input',
        sampleAnswer: "While human examiners offer intuitive empathy, algorithmic phonetic analysis provides unparalleled objectivity in evaluating acoustic precision. Furthermore, automated assessments eliminate geographic disparities, thereby democratizing access for international candidates. Consequently, hybrid evaluation frameworks representing both machine diagnostic rigor and human oversight constitute the most equitable approach.",
        rubricNotes: 'Evaluated on Coherence & Cohesion (25%), Lexical Resource (25%), Grammatical Range (25%), and Task Achievement (25%).'
      }
    ]
  },
  {
    id: 'ielts_speaking',
    module: 'speaking',
    title: 'Speaking & Phonetic Articulation',
    titleAr: 'اختبار التحدث والنطق بالمايكروفون الحقيقي',
    description: 'Speak directly into your microphone answering an authentic IELTS Part 2 prompt evaluated for Fluency, Lexicon, and IPA Pronunciation.',
    descriptionAr: 'تحدث بصوتك في المايكروفون للإجابة على موضوع آيلتس حقيقي؛ يتم تحليل النطق والطلاقة وحساب الباند الفعلي.',
    durationMinutes: 5,
    questions: [
      {
        id: 'ielts_s_1',
        module: 'speaking',
        title: 'Part 2 Cue Card: Describe an Ambitious Project or Skill',
        titleAr: 'بطاقة التحدث (Part 2): تحدث عن مشروع أو مهارة طموحة',
        instructions: 'Record yourself speaking for 45 to 90 seconds. Cover: What the ambition is, why it is challenging, what steps you took, and what you learned.',
        instructionsAr: 'اضغط على زر التسجيل وتحدث بالإنجليزية لمدة تتراوح بين 45 إلى 90 ثانية مجيباً عن النقاط الموضحة.',
        promptText: "Describe a complex goal or professional challenge you worked hard to accomplish. You should say: what it involved, how you approached it, what obstacles you overcame, and explain why this achievement was meaningful to you.",
        type: 'spoken_record',
        rubricNotes: 'Analyzed for speech cadence, unvoiced consonant plosives (/p/, /t/), vowel duration, and sentence complexity.'
      }
    ]
  }
];

export function calculateIeltsBandScore(
  listeningCorrect: number,
  readingCorrect: number,
  writingWordCount: number,
  hasWritingKeywords: boolean,
  speakingFluencyScore: number
): {
  overallBand: number;
  listeningBand: number;
  readingBand: number;
  writingBand: number;
  speakingBand: number;
  cefrEquivalent: CEFRLevel;
  evaluationCommentAr: string;
} {
  // Listening band (out of 2 questions in diagnostic)
  const listeningBand = listeningCorrect === 2 ? 8.5 : listeningCorrect === 1 ? 6.5 : 4.5;
  
  // Reading band (out of 2 questions in diagnostic)
  const readingBand = readingCorrect === 2 ? 8.5 : readingCorrect === 1 ? 6.5 : 4.5;

  // Writing band
  let writingBand = 5.0;
  if (writingWordCount >= 40 && hasWritingKeywords) writingBand = 8.0;
  else if (writingWordCount >= 25) writingBand = 6.5;
  else if (writingWordCount > 10) writingBand = 5.5;

  // Speaking band (0 - 100 speaking score)
  let speakingBand = 5.0;
  if (speakingFluencyScore >= 85) speakingBand = 8.5;
  else if (speakingFluencyScore >= 75) speakingBand = 7.5;
  else if (speakingFluencyScore >= 65) speakingBand = 6.5;
  else if (speakingFluencyScore >= 50) speakingBand = 5.5;
  else speakingBand = 4.5;

  // Overall rounded to nearest 0.5
  const rawAverage = (listeningBand + readingBand + writingBand + speakingBand) / 4;
  const overallBand = Math.round(rawAverage * 2) / 2;

  // CEFR mapping
  let cefrEquivalent: CEFRLevel = 'B1';
  let comment = '';
  if (overallBand >= 8.0) {
    cefrEquivalent = 'C1';
    comment = 'مستوى متقدم وطلاقة أكاديمية استثنائية (C1 Advanced). تمكنك من العمل في أضخم الشركات العالمية والمناظرات.';
  } else if (overallBand >= 6.5) {
    cefrEquivalent = 'B2';
    comment = 'مستوى فوق متوسط قوي (B2 Upper-Intermediate). ثقة ممتازة وقدرة على إدارة مقابلات العمل ونقاشات البيزنس بكفاءة.';
  } else if (overallBand >= 5.5) {
    cefrEquivalent = 'B1';
    comment = 'مستوى متوسط مستقر (B1 Intermediate). قادر على التواصل والتعامل مع معظم المواقف مع حاجة لتدريب النطق ومخارج الحروف.';
  } else if (overallBand >= 4.5) {
    cefrEquivalent = 'A2';
    comment = 'مستوى تمهيدي واعد (A2 Elementary). تحتاج لتدريب مستمر على جمل المحادثة اليومية والتخلص من التردد.';
  } else {
    cefrEquivalent = 'A1';
    comment = 'مستوى مبتدئ (A1 Beginner). رفيقك الصوتي في TeachMe سيساعدك خطوة بخطوة لبناء الأساس السليم.';
  }

  return {
    overallBand,
    listeningBand,
    readingBand,
    writingBand,
    speakingBand,
    cefrEquivalent,
    evaluationCommentAr: comment
  };
}
