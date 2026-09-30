import { Unit, VoiceScenario, QuizQuestion, CEFRLevel } from '../types';

export const placementQuestions: (QuizQuestion & { targetLevel: CEFRLevel })[] = [
  {
    id: 'pt_1',
    targetLevel: 'A1',
    type: 'multiple_choice',
    question: 'She _____ from Canada. She is a teacher.',
    questionAr: 'هي _____ من كندا. هي معلمة.',
    options: ['am', 'is', 'are', 'be'],
    correctAnswer: 'is',
    explanation: 'With third-person singular pronouns (he, she, it), the present form of "to be" is "is".',
    explanationAr: 'مع الضمائر المفردة الغائبة نستخدم الفعل is في زمن المضارع.',
  },
  {
    id: 'pt_2',
    targetLevel: 'A2',
    type: 'multiple_choice',
    question: 'Yesterday, we _____ to the supermarket and bought some fresh fruit.',
    questionAr: 'بالأمس، نحن _____ إلى السوبرماركت واشترينا فواكه طازجة.',
    options: ['go', 'goes', 'went', 'gone'],
    correctAnswer: 'went',
    explanation: '"Yesterday" marks past simple time, so we use the irregular past form "went".',
    explanationAr: 'كلمة Yesterday تدل على الماضي البسيط، لذا نستخدم went.',
  },
  {
    id: 'pt_3',
    targetLevel: 'B1',
    type: 'multiple_choice',
    question: 'I haven’t seen Omar _____ last summer.',
    questionAr: 'لم أرَ عمر _____ الصيف الماضي.',
    options: ['for', 'since', 'during', 'from'],
    correctAnswer: 'since',
    explanation: '"Since" indicates a specific starting point in time in the present perfect tense.',
    explanationAr: 'نستخدم since لتحديد نقطة بداية زمنية مع زمن المضارع التام.',
  },
  {
    id: 'pt_4',
    targetLevel: 'B2',
    type: 'multiple_choice',
    question: 'If you had arrived on time, we _____ the opening presentation.',
    questionAr: 'لو كنت قد وصلت في الوقت المحدد، لما كنا _____ العرض التقديمي الافتتاحي.',
    options: ["wouldn't miss", "wouldn't have missed", "didn't miss", "hadn't missed"],
    correctAnswer: "wouldn't have missed",
    explanation: 'Third conditional (past unreal condition): If + past perfect, would have + past participle.',
    explanationAr: 'الحالة الشرطية الثالثة: If + Past Perfect يتبعها would have + Past Participle.',
  },
  {
    id: 'pt_5',
    targetLevel: 'C1',
    type: 'multiple_choice',
    question: 'Seldom _____ such an articulate and persuasive speech on economic policy.',
    questionAr: 'نادرًا _____ مثل هذا الخطاب المفوه والمقنع حول السياسة الاقتصادية.',
    options: ['I have heard', 'have I heard', 'I had heard', 'did I heard'],
    correctAnswer: 'have I heard',
    explanation: 'Negative inversion: Negative adverbs like "Seldom", "Rarely", or "Scarcely" at the beginning of a clause trigger auxiliary-subject inversion.',
    explanationAr: 'القلب اللغوي بعد الظروف السلبية: البدء بـ Seldom يتطلب تقديم الفعل المساعد على الفاعل.',
  },
];

export const curriculumUnits: Unit[] = [
  {
    id: 'unit_a1',
    number: 1,
    level: 'A1',
    title: 'Beginner Foundations: Daily Life & Greetings',
    titleAr: 'الأساسيات للمبتدئين: الحياة اليومية والتحيات',
    description: 'Master present simple, essential verbs, introductions, and everyday vocabulary.',
    descriptionAr: 'أتقن المضارع البسيط والأفعال الأساسية والتعريف بالنفس والمفردات اليومية.',
    lessons: [
      {
        id: 'lesson_a1_1',
        unitId: 'unit_a1',
        title: 'Mastering the Verb "To Be" & Introductions',
        titleAr: 'إتقان فعل الكينونة To Be والتعريف بالنفس',
        description: 'Learn how to form positive, negative, and question forms of am/is/are.',
        descriptionAr: 'تعلم صياغة الإثبات والنفي والسؤال باستخدام am و is و are.',
        level: 'A1',
        category: 'grammar',
        icon: 'UserCheck',
        youtubeId: 'pP96-2L3-fU', // Oxford Online English: To Be
        videoTitle: 'Verb To Be Explained with Native Pronunciation',
        xpReward: 30,
        estimatedMinutes: 6,
        grammarRules: [
          {
            ruleTitle: 'Affirmative & Negative Statements',
            ruleTitleAr: 'الجمل المثبتة والمنفية',
            formula: 'Subject + am/is/are (+ not) + Complement',
            explanation: 'Use "am" for I, "is" for he/she/it, and "are" for you/we/they.',
            explanationAr: 'استخدم am مع I، و is مع المفرد، و are مع الجمع ومخاطب you.',
            examples: [
              { en: 'I am excited to learn English with TeachMe.', ar: 'أنا متحمس لتعلم الإنجليزية مع تيتش مي.', phonetic: '/aɪ æm ɪkˈsaɪtɪd/' },
              { en: 'She is not afraid of speaking in public.', ar: 'هي ليست خائفة من التحدث أمام الجمهور.', phonetic: '/ʃiː ɪz nɒt əˈfreɪd/' },
              { en: 'They are my colleagues from work.', ar: 'هم زملائي من العمل.', phonetic: '/ðeɪ ɑː maɪ ˈkɒliːɡz/' }
            ]
          }
        ],
        quizzes: [
          {
            id: 'q_a1_1_1',
            type: 'multiple_choice',
            question: 'Hello! I _____ Sarah and this is my friend Alex.',
            questionAr: 'مرحبًا! أنا _____ سارة وهذا صديقي أليكس.',
            options: ['am', 'is', 'are', 'be'],
            correctAnswer: 'am',
            explanation: '"I" always takes "am" in present tense.',
          },
          {
            id: 'q_a1_1_2',
            type: 'multiple_choice',
            question: 'They _____ at home right now; they are at the gym.',
            questionAr: 'هم _____ في المنزل الآن؛ إنهم في النادي الرياضي.',
            options: ["aren't", "isn't", "am not", "not"],
            correctAnswer: "aren't",
            explanation: 'Negative plural form of to be is "are not" or "aren\'t".',
          },
          {
            id: 'q_a1_1_3',
            type: 'fill_in_blank',
            question: 'Where _____ you from? (Type the verb)',
            questionAr: 'من أين _____ أنت؟ (اكتب الفعل)',
            correctAnswer: 'are',
            explanation: 'With subject "you", the correct form is "are".',
          }
        ]
      },
      {
        id: 'lesson_a1_2',
        unitId: 'unit_a1',
        title: 'Present Simple Habits & Daily Routines',
        titleAr: 'المضارع البسيط للعادات والروتين اليومي',
        description: 'Express habits, general truths, and regular schedules with third-person -s.',
        descriptionAr: 'عبر عن العادات والحقائق الثابتة والجدول اليومي مع إضافة s المفرد.',
        level: 'A1',
        category: 'grammar',
        icon: 'Clock',
        youtubeId: '7XqO0mZ3t7k',
        videoTitle: 'Present Simple Tense Rules & Common Mistakes',
        xpReward: 35,
        estimatedMinutes: 8,
        grammarRules: [
          {
            ruleTitle: 'The 3rd Person Singular Rule (-s / -es)',
            ruleTitleAr: 'قاعدة المفرد الغائب مع إضافة s',
            formula: 'He / She / It + Verb(-s/-es)',
            explanation: 'Always append -s or -es to the verb when the subject is singular (he, she, it). In questions and negatives, use do/does.',
            explanationAr: 'نضيف s أو es للفعل عند الفاعل المفرد. وعند النفي والسؤال نستخدم does.',
            examples: [
              { en: 'He wakes up at 7:00 AM every morning.', ar: 'هو يستيقظ في السابعة صباحًا كل يوم.', phonetic: '/hiː weɪks ʌp æt ˈsɛvən/' },
              { en: 'She doesn\'t drink coffee in the evening.', ar: 'هي لا تشرب القهوة في المساء.', phonetic: '/ʃiː ˈdʌznt drɪŋk ˈkɒfi/' }
            ]
          }
        ],
        quizzes: [
          {
            id: 'q_a1_2_1',
            type: 'multiple_choice',
            question: 'My brother _____ three languages fluently.',
            options: ['speak', 'speaks', 'speaking', 'is speak'],
            correctAnswer: 'speaks',
            explanation: 'Brother is singular third person (he), so the verb requires "-s".',
          },
          {
            id: 'q_a1_2_2',
            type: 'multiple_choice',
            question: '_____ you drink green tea every day?',
            options: ['Do', 'Does', 'Are', 'Is'],
            correctAnswer: 'Do',
            explanation: 'We use "Do" for questions with pronoun "you".',
          }
        ]
      }
    ]
  },
  {
    id: 'unit_a2',
    number: 2,
    level: 'A2',
    title: 'Elementary: Past Stories & Experiences',
    titleAr: 'المستوى الأساسي: سرد أحداث الماضي والتجارب',
    description: 'Conquer Past Simple regular and irregular verbs, storytelling, and basic questions.',
    descriptionAr: 'أتقن الماضي البسيط للأفعال المنتظمة والشاذة ورواية المواقف.',
    lessons: [
      {
        id: 'lesson_a2_1',
        unitId: 'unit_a2',
        title: 'Past Simple: Regular & Irregular Verbs',
        titleAr: 'الماضي البسيط: الأفعال المنتظمة وغير المنتظمة',
        description: 'Pronounce the three endings of -ed (/t/, /d/, /ɪd/) and memorize common irregular verbs.',
        descriptionAr: 'نطق النهايات الثلاث لـ ed ومعرفة الأفعال الشاذة الشائعة.',
        level: 'A2',
        category: 'pronunciation',
        icon: 'Sparkles',
        youtubeId: 'AL1K4X12g5Q',
        videoTitle: 'Pronouncing -ED Endings: /t/ vs /d/ vs /ɪd/',
        xpReward: 40,
        estimatedMinutes: 7,
        grammarRules: [
          {
            ruleTitle: 'The 3 Sounds of -ED',
            ruleTitleAr: 'الأصوات الثلاثة لنهاية ed',
            explanation: 'Voiceless ending -> /t/ (walked). Voiced ending -> /d/ (played). T or D ending -> /ɪd/ (wanted, decided).',
            explanationAr: 'بعد الأصوات المهموسة تُنطق /t/، وبعد المجهورة /d/، وبعد حرفي t و d تُنطق /ɪd/.',
            examples: [
              { en: 'I watched the documentary last night.', ar: 'شاهدت الفيلم الوثائقي الليلة الماضية.', phonetic: '/wɒtʃt/' },
              { en: 'They decided to visit London.', ar: 'قرروا زيارة لندن.', phonetic: '/dɪˈsaɪdɪd/' },
              { en: 'We loved the dinner.', ar: 'أحببنا العشاء.', phonetic: '/lʌvd/' }
            ]
          }
        ],
        quizzes: [
          {
            id: 'q_a2_1_1',
            type: 'multiple_choice',
            question: 'How is the -ed in "needed" pronounced?',
            options: ['/ɪd/', '/t/', '/d/', 'silent'],
            correctAnswer: '/ɪd/',
            explanation: 'Verbs ending in /t/ or /d/ add the extra syllable /ɪd/.',
          },
          {
            id: 'q_a2_1_2',
            type: 'multiple_choice',
            question: 'What is the past simple of "buy"?',
            options: ['bought', 'buyed', 'brought', 'boated'],
            correctAnswer: 'bought',
            explanation: 'The irregular past simple of buy is bought (/bɔːt/).',
          }
        ]
      }
    ]
  },
  {
    id: 'unit_b1',
    number: 3,
    level: 'B1',
    title: 'Intermediate: Present Perfect vs Past Simple',
    titleAr: 'المستوى المتوسط: المضارع التام مقابل الماضي البسيط',
    description: 'Distinguish finished past actions from life experiences with real-time feedback.',
    descriptionAr: 'التمييز بين أحداث الماضي المنتهية والتجارب الحياتية المتصلة بالحاضر.',
    lessons: [
      {
        id: 'lesson_b1_1',
        unitId: 'unit_b1',
        title: 'Present Perfect for Life Experiences & Recent Actions',
        titleAr: 'المضارع التام للخبرات الحياتية والأحداث الحديثة',
        description: 'Use have/has + V3 with since, for, already, yet, and ever.',
        descriptionAr: 'استخدام have/has والتصريف الثالث مع الكلمات الدلالية.',
        level: 'B1',
        category: 'grammar',
        icon: 'CheckCircle',
        youtubeId: 'v8u3gUe1fF4',
        videoTitle: 'Present Perfect vs Past Simple: Clear Guide',
        xpReward: 50,
        estimatedMinutes: 9,
        grammarRules: [
          {
            ruleTitle: 'Present Result vs Finished Time',
            ruleTitleAr: 'النتيجة في الحاضر مقابل الوقت المحدد المنتهي',
            formula: 'Subject + have/has + Past Participle (V3)',
            explanation: 'Use Present Perfect when the exact time is unstated or the effect matters now. Use Past Simple when a specific past time is named.',
            explanationAr: 'المضارع التام يركز على التجربة أو الأثر الحالي بدون تحديد وقت ماضٍ محدد.',
            examples: [
              { en: 'I have visited Dubai three times.', ar: 'لقد زرت دبي ثلاث مرات.', phonetic: '/aɪ hæv ˈvɪzɪtɪd duːˈbaɪ/' },
              { en: 'I went to Dubai in 2021.', ar: 'ذهبت إلى دبي في عام 2021.', phonetic: '/aɪ wɛnt tuː duːˈbaɪ ɪn/' }
            ]
          }
        ],
        quizzes: [
          {
            id: 'q_b1_1_1',
            type: 'multiple_choice',
            question: 'Have you _____ eaten authentic sushi?',
            options: ['ever', 'never', 'yet', 'since'],
            correctAnswer: 'ever',
            explanation: 'We use "ever" in questions to ask about experiences throughout life.',
          },
          {
            id: 'q_b1_1_2',
            type: 'multiple_choice',
            question: 'She _____ her passport yesterday afternoon.',
            options: ['lost', 'has lost', 'had lost', 'loses'],
            correctAnswer: 'lost',
            explanation: '"Yesterday afternoon" designates a finished past time, which demands Past Simple.',
          }
        ]
      }
    ]
  },
  {
    id: 'unit_b2',
    number: 4,
    level: 'B2',
    title: 'Upper-Intermediate: Conditionals & Connected Speech',
    titleAr: 'فوق المتوسط: الجمل الشرطية والربط الصوتي الطبيعي',
    description: 'Master unreal conditionals, linking sounds, reductions (gonna, wanna), and diplomatic language.',
    descriptionAr: 'أتقن الحالات الشرطية التخيلية، والإدغام الصوتي والتحدث بدبلوماسية ولباقة.',
    lessons: [
      {
        id: 'lesson_b2_1',
        unitId: 'unit_b2',
        title: 'Second & Third Conditionals in Spoken English',
        titleAr: 'الشرط الثاني والثالث في المحادثة المنطوقة',
        description: 'Express hypothetical desires and past regrets naturally with contracted forms.',
        descriptionAr: 'التعبير عن الافتراضات والندم باستخدام الصيغ المختصرة الطبيعية.',
        level: 'B2',
        category: 'grammar',
        icon: 'Split',
        youtubeId: 'bA4V6qW5T6M',
        videoTitle: 'How Native Speakers Contract Conditionals (Would\'ve / Could\'ve)',
        xpReward: 60,
        estimatedMinutes: 10,
        grammarRules: [
          {
            ruleTitle: 'Spoken Reductions of "Would have"',
            ruleTitleAr: 'الاختصارات الصوتية لـ would have',
            formula: 'If + had + V3, would\'ve /wʊdəv/ + V3',
            explanation: 'In natural spoken English, "would have" contracts to "would\'ve" /wʊdəv/ or even /wʊdə/.',
            explanationAr: 'في الإنجليزية المحكية تُختصر would have صوتيًا إلى /wʊdəv/.',
            examples: [
              { en: 'I would\'ve called you if I\'d known.', ar: 'كنت سأتصل بك لو علمت بالأمر.', phonetic: '/aɪ ˈwʊdəv kɔːld juː/' }
            ]
          }
        ],
        quizzes: [
          {
            id: 'q_b2_1_1',
            type: 'multiple_choice',
            question: 'If I _____ you, I would take that job offer immediately.',
            options: ['were', 'was', 'am', 'had been'],
            correctAnswer: 'were',
            explanation: 'In the formal Second Conditional, the subjunctive "were" is standard for all subjects.',
          }
        ]
      }
    ]
  },
  {
    id: 'unit_c1',
    number: 5,
    level: 'C1',
    title: 'Advanced: Fluency, Inversion & Nuanced Idioms',
    titleAr: 'المستوى المتقدم: الطلاقة العالية والقلب النحوي والتعابير البليغة',
    description: 'Speak like an executive with rhetorical inversion, subtle prosody, and idiomatic precision.',
    descriptionAr: 'تحدث باحترافية تنفيذية باستخدام التراكيب البلاغية ونبرات الصوت الدقيقة والمصطلحات المتقدمة.',
    lessons: [
      {
        id: 'lesson_c1_1',
        unitId: 'unit_c1',
        title: 'Negative Inversion for Impact & Persuasion',
        titleAr: 'القلب النحوي السلبي للتأثير والإقناع',
        description: 'Structure formal presentations and arguments using inversion (Not only, Seldom, Under no circumstances).',
        descriptionAr: 'صياغة العروض التقديمية والحجج الرسمية باستخدام أسلوب التوكيد بالقلب.',
        level: 'C1',
        category: 'grammar',
        icon: 'Zap',
        youtubeId: 'jK_9x407yvU',
        videoTitle: 'Master Advanced Inversion for C1 English',
        xpReward: 80,
        estimatedMinutes: 12,
        grammarRules: [
          {
            ruleTitle: 'Negative Adverb Fronting',
            ruleTitleAr: 'تقديم الظرف السلبي في بداية الجملة',
            formula: 'Negative Word + Auxiliary Verb + Subject + Main Verb',
            explanation: 'Placing words like "Not only", "Never", "Rarely" at the start flips the subject and auxiliary.',
            explanationAr: 'وضع الكلمات السلبية في المقدمة يقلب ترتيب الفاعل مع الفعل المساعد لإعطاء نبرة بليغة ومؤكدة.',
            examples: [
              { en: 'Not only did we hit our revenue target, but we also doubled our retention.', ar: 'لم نكتفِ بتحقيق هدف الإيرادات فحسب، بل ضاعفنا أيضًا نسبة الاحتفاظ.', phonetic: '/nɒt ˈəʊnli dɪd wiː hɪt/' }
            ]
          }
        ],
        quizzes: [
          {
            id: 'q_c1_1_1',
            type: 'multiple_choice',
            question: 'Rarely _____ such dedication from an engineering team.',
            options: ['have I witnessed', 'I have witnessed', 'did I witnessed', 'witnessed I'],
            correctAnswer: 'have I witnessed',
            explanation: '"Rarely" at the sentence start triggers subject-auxiliary inversion.',
          }
        ]
      }
    ]
  }
];

export interface CoachVoice {
  id: string;
  voiceName: string;
  name: string;
  gender: 'male' | 'female';
  role: string;
  toneAr: string;
  toneEn: string;
  avatar: string;
  greeting: string;
}

export const COACH_VOICES: CoachVoice[] = [
  { 
    id: 'Hesham',
    voiceName: 'Charon', 
    name: 'هشام (Hesham - Executive Interviews)', 
    gender: 'male', 
    role: 'Big Tech & Investment Banking Interview Strategist',
    toneAr: '👔 جاد في التعامل، نبرة واثقة ورزينة، تخصص مقابلات العمل في الشركات العالمية والبنوك الضخمة', 
    toneEn: 'Serious, poised executive mentor for Big Tech and Fortune 500 interviews', 
    avatar: '👔',
    greeting: "Welcome. Let's make this session count. Could you walk me through your background and the core value you bring to a high-impact team?"
  },
  { 
    id: 'Nour',
    voiceName: 'Kore', 
    name: 'نور (Nour - Gentle Beginner Guide)', 
    gender: 'female', 
    role: 'Patient & Empathetic Listener for Beginners',
    toneAr: '🌸 بنوته رقيقة وهادية جداً، تخصص المستوى الضعيف والمبتدئين ("احكيلي أنا سامعاك")', 
    toneEn: 'Gentle, soft, ultra-patient companion for beginners and shy speakers', 
    avatar: '🌸',
    greeting: "Hello dear. براحتك خالص، متقلقش من أي غلطة، احكيلي أنا سامعاك وبنتعلم سوا خطوة بخطوة. How was your day today?"
  },
  { 
    id: 'Younis',
    voiceName: 'Puck', 
    name: 'يونس (Younis - Witty Egyptian Friend)', 
    gender: 'male', 
    role: 'Street-Smart Egyptian Banter & Spontaneous Fluency',
    toneAr: '⚡ الشاب المصري الحَرَك، دمه خفيف، كلامه عفوي وبيهزر ويقلش عشان يكسر الرهبة والتوتر', 
    toneEn: 'Quick-witted Egyptian street banter, lively jokes, and zero hesitation', 
    avatar: '⚡',
    greeting: "أهلاً يا صديقي! إيه الأخبار؟ جهز قهوتك وتعال نتكلم من غير أي تكلف. What's on your mind today?"
  },
  { 
    id: 'Jameel',
    voiceName: 'Fenrir', 
    name: 'عم جميل (Uncle Jameel - 93yo British Veteran)', 
    gender: 'male', 
    role: 'British WWII Veteran & Classic Storyteller',
    toneAr: '🕰️ رجل بريطاني مسن ووقور (93 سنة)، كلامه ممتع يعود لأيام الحرب ويحكي قصص التاريخ وحكمة الحياة', 
    toneEn: 'Classic 93-year-old British gentleman and WWII veteran with captivating historical stories', 
    avatar: '🕰️',
    greeting: "Good day to you, my friend. At ninety-three, I have seen the world change many times over. What piece of history or story shall we explore today?"
  },
  { 
    id: 'Natalie',
    voiceName: 'Aoede', 
    name: 'ناتالي (Natalie - American Youth & Slang)', 
    gender: 'female', 
    role: '18-year-old American Youth & Culture Guide',
    toneAr: '🎧 بنوته 18 سنة من أمريكا، لغة شبابية عصرية مليانة سلنج أمريكي دارج وفاهمة جيل الشباب', 
    toneEn: '18-year-old American youth, trendy casual slang, modern culture, and energetic lifestyle talk', 
    avatar: '🎧',
    greeting: "Hey! What's up? I'm Natalie! Super excited to hang out. Have you watched any viral shows or tried any cool trends lately?"
  },
];

export const OPEN_CONVERSATION_SCENARIO: VoiceScenario = {
  id: 'scenario_open_flow',
  title: 'Open Free Conversation (Any Topic)',
  titleAr: 'محادثة حرة في أي موضوع (مفتوحة بالمطلق)',
  level: 'B1',
  category: 'General',
  icon: 'Sparkles',
  avatar: '🎙️',
  personaName: 'TeachMe AI',
  personaRole: 'Egyptian English Coach & Friend',
  description: 'Talk freely about anything on your mind. TeachMe AI listens, jokes with you, adapts to your topic, and corrects your English on the fly.',
  descriptionAr: 'اتكلم في أي موضوع يخطر ببالك في المطلق (شغلك، يومك، أفكارك، مشاكلك). هيفهمك فوراً ويهزر معاك ويصححلك.',
  initialMessage: "Hey there! أهلاً بيك يا بطل! اتكلم معايا في أي موضوع على بالك، متقلقش من أي غلطة، هظبطلك النطق والجرامر مع شوية قفشات خفيفة دم. What are you thinking about today?",
  systemInstruction: 'Open free-flow conversational practice. Dynamically identify topic and banter with Egyptian humor.',
  targetVocabulary: [],
  targetGrammarPoint: 'Spontaneous fluency, pronunciation confidence, and natural expressions',
};

export const voiceScenarios: VoiceScenario[] = [
  OPEN_CONVERSATION_SCENARIO,
  {
    id: 'scenario_tech_ai',
    title: 'Tech, AI & The Future',
    titleAr: 'التكنولوجيا والذكاء الاصطناعي والمستقبل',
    level: 'B2',
    category: 'Technology',
    icon: 'Cpu',
    avatar: '🤖',
    personaName: 'Alex Tech',
    personaRole: 'Software Engineer & AI Enthusiast',
    description: 'Discuss artificial intelligence, coding, new gadgets, and how tech changes our world.',
    descriptionAr: 'اتكلم عن الذكاء الاصطناعي، البرمجة، والتقنيات الحديثة وتأثيرها على حياتنا.',
    initialMessage: "Hey! What an incredible time for tech and AI right now. Have you tried any cool new tools or apps recently?",
    systemInstruction: 'Discuss tech and software in English. Friendly Egyptian tone and witty remarks.',
    targetVocabulary: [
      { word: 'algorithm', ipa: '/ˈælɡərɪðəm/', meaning: 'Step by step procedure' },
      { word: 'automation', ipa: '/ˌɔːtəˈmeɪʃn/', meaning: 'Automatic operation of systems' }
    ],
    targetGrammarPoint: 'Future continuous and hypothetical conditionals'
  },
  {
    id: 'scenario_gym_fitness',
    title: 'Gym, Fitness & Workout Life',
    titleAr: 'الجيم والرياضة والفتنس',
    level: 'A2',
    category: 'Lifestyle',
    icon: 'Dumbbell',
    avatar: '🏋️‍♂️',
    personaName: 'Coach Sam',
    personaRole: 'Personal Fitness Trainer',
    description: 'Talk about your gym routine, muscle building, cardio, and diet habits.',
    descriptionAr: 'اتكلم عن تمرينك المفضل، الدايت، والتحفيز في الجيم.',
    initialMessage: "Yo champ! Did you hit the gym today or are you taking a rest day? What's your current fitness goal?",
    systemInstruction: 'Encourage fitness talk and gym slang with high energy and Egyptian coach humor.',
    targetVocabulary: [
      { word: 'workout', ipa: '/ˈwɜːkaʊt/', meaning: 'Exercise session' },
      { word: 'nutrition', ipa: '/njuːˈtrɪʃn/', meaning: 'Food for health and growth' }
    ],
    targetGrammarPoint: 'Frequency adverbs (always, often, rarely) and present continuous'
  },
  {
    id: 'scenario_egyptian_food',
    title: 'Food, Cooking & Egyptian Dishes',
    titleAr: 'الأكل والطبخ والأكلات المصرية',
    level: 'A2',
    category: 'Food',
    icon: 'Utensils',
    avatar: '🍲',
    personaName: 'Chef Omar',
    personaRole: 'Foodie & Home Cook',
    description: 'Describe your favorite food, explain how Koshari or Molokhia is made, and debate best dishes.',
    descriptionAr: 'اوصف أكلتك المفضلة، اشرح طريقة عمل الكشري أو الملوخية بالإنجليزية!',
    initialMessage: "Hello! I am starving! What is your absolute favorite meal when you want pure comfort food?",
    systemInstruction: 'Food talk with delightful Egyptian humor about famous local dishes and cooking steps.',
    targetVocabulary: [
      { word: 'delicious', ipa: '/dɪˈlɪʃəs/', meaning: 'Pleasant tasting' },
      { word: 'ingredient', ipa: '/ɪnˈɡriːdiənt/', meaning: 'Food component' }
    ],
    targetGrammarPoint: 'Sequence adverbs (first, then, after that, finally)'
  },
  {
    id: 'scenario_movies_pop',
    title: 'Movies, Series & Pop Culture',
    titleAr: 'الأفلام والمسلسلات والموسيقى',
    level: 'B1',
    category: 'Entertainment',
    icon: 'Film',
    avatar: '🎬',
    personaName: 'Maya',
    personaRole: 'Film Critic & Cinephile',
    description: 'Recommend your favorite movie or TV series, debate plot twists, and talk about actors.',
    descriptionAr: 'اتكلم عن آخر فيلم أو مسلسل شفته وانتقده ورشحه لأصحابك.',
    initialMessage: "Hey! What was the last movie or TV show you watched that blew your mind? Give me the plot without spoilers!",
    systemInstruction: 'Engage in lively movie chat, review expressions, and witty Egyptian cultural comparisons.',
    targetVocabulary: [
      { word: 'character', ipa: '/ˈkærəktə/', meaning: 'Person in a story' },
      { word: 'performance', ipa: '/pəˈfɔːməns/', meaning: 'Acting display' }
    ],
    targetGrammarPoint: 'Relative clauses (who, which, that) and opinion expressions'
  },
  {
    id: 'scenario_debates',
    title: 'Spicy Debates & Controversies',
    titleAr: 'مناظرات ونقاشات ساخنة (Debates)',
    level: 'C1',
    category: 'Debate',
    icon: 'Flame',
    avatar: '🔥',
    personaName: 'Victor',
    personaRole: 'Debate Club President',
    description: 'Defend your opinion on remote work, social media bans, money vs passion, and AI.',
    descriptionAr: 'دافع عن وجهة نظرك في قضايا جدلية: الشغل من البيت، السوشيال ميديا، الفلوس ولا الشغف.',
    initialMessage: "Let's test your persuasive English! Do you believe remote work is making people more productive, or is it killing teamwork?",
    systemInstruction: 'Push the student to use high-level argumentation, transition words, and tease weak logic with Egyptian humor.',
    targetVocabulary: [
      { word: 'perspective', ipa: '/pəˈspektɪv/', meaning: 'Point of view' },
      { word: 'counterargument', ipa: '/ˈkaʊntərˌɑːɡjumənt/', meaning: 'Opposing argument' }
    ],
    targetGrammarPoint: 'Complex inversion, concession clauses (Although, Despite, Whereas)'
  },
  {
    id: 'scenario_daily_chat',
    title: 'Daily Gossip & Casual Small Talk',
    titleAr: 'دردشة عادية وفضفضة عن يومك (Small Talk)',
    level: 'A1',
    category: 'Daily Life',
    icon: 'Coffee',
    avatar: '☕',
    personaName: 'Layla',
    personaRole: 'Close Friend',
    description: 'Casual friendly chat about your morning, weather, annoying traffic, and weekend plans.',
    descriptionAr: 'دردشة عفوية بين أصحاب عن زحمة الطريق، الجو، وخطط نهاية الأسبوع.',
    initialMessage: "Hey! How was your day so far? Anything exciting or was it just another crazy routine?",
    systemInstruction: 'Warm, relaxed casual chat with lots of Egyptian friendliness and laughter.',
    targetVocabulary: [
      { word: 'routine', ipa: '/ruːˈtiːn/', meaning: 'Regular daily sequence' },
      { word: 'relax', ipa: '/rɪˈlæks/', meaning: 'Rest and chill' }
    ],
    targetGrammarPoint: 'Present simple and past simple transitions'
  },
  {
    id: 'scenario_airport',
    title: 'At the Airport: Customs & Check-in',
    titleAr: 'في المطار: الجوازات وفحص الحقائب',
    level: 'A2',
    category: 'Travel',
    icon: 'Plane',
    avatar: '🛂',
    personaName: 'Officer Miller',
    personaRole: 'Border Control & Customs Officer',
    description: 'Practice answering immigration questions about your trip length, luggage, and destination.',
    descriptionAr: 'تدرب على الإجابة على أسئلة ضابط الهجرة حول مدة الإقامة وحقائبك والغرض من الرحلة.',
    initialMessage: "Good day! Welcome to London Heathrow. May I see your passport and boarding pass, please? What is the primary purpose of your visit?",
    systemInstruction: 'Officer Miller roleplay with Egyptian humor if student slips on P/B.',
    targetVocabulary: [
      { word: 'passport', ipa: '/ˈpɑːspɔːt/', meaning: 'Official travel identity document' },
      { word: 'luggage', ipa: '/ˈlʌɡɪdʒ/', meaning: 'Suitcases and bags' }
    ],
    targetGrammarPoint: 'Future intentions & Prepositions'
  },
  {
    id: 'scenario_coffee',
    title: 'Coffee Shop: Ordering & Special Requests',
    titleAr: 'في المقهى: طلب المشروبات والتعديلات الخاصة',
    level: 'A1',
    category: 'Daily Life',
    icon: 'Coffee',
    avatar: '☕',
    personaName: 'Emma',
    personaRole: 'Friendly Barista',
    description: 'Order your favorite beverage, specify milk alternatives, and ask for the total politely.',
    descriptionAr: 'اطلب مشروبك المفضل مع تحديد نوع الحليب واطلب الفاتورة بلباقة.',
    initialMessage: "Hi there! Welcome to Central Brew. What can I get started for you today?",
    systemInstruction: 'Barista roleplay with polite phrasing guidance.',
    targetVocabulary: [
      { word: 'latte', ipa: '/ˈlɑːteɪ/', meaning: 'Espresso with steamed milk' },
      { word: 'receipt', ipa: '/rɪˈsiːt/', meaning: 'Paper showing paid bill (silent p!)' }
    ],
    targetGrammarPoint: 'Polite modals: Could / Would like'
  },
  {
    id: 'scenario_interview',
    title: 'Job Interview: Behavioral Questions',
    titleAr: 'مقابلة عمل: الأسئلة السلوكية والخبرات',
    level: 'B2',
    category: 'Career',
    icon: 'Briefcase',
    avatar: '💼',
    personaName: 'David Vance',
    personaRole: 'Senior Hiring Director',
    description: 'Answer challenging behavioral questions and describe past achievements with confidence.',
    descriptionAr: 'أجب عن أسئلة المقابلة السلوكية واعرض إنجازاتك السابقة بأسلوب STAR باحترافية.',
    initialMessage: "Welcome to our office. Thank you for making the time. To start off, could you walk me through your professional background and a challenging project you navigated recently?",
    systemInstruction: 'Job interview coaching with witty Egyptian corrections.',
    targetVocabulary: [
      { word: 'achievement', ipa: '/əˈtʃiːvmənt/', meaning: 'A thing done successfully' },
      { word: 'collaborate', ipa: '/kəˈlæbəreɪt/', meaning: 'Work jointly' }
    ],
    targetGrammarPoint: 'Past tenses for narrative & Present Perfect for accomplishments'
  }
];
