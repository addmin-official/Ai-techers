export interface Topic {
  id: string;
  title: string;
  description: string;
}

export interface Exercise {
  id: string;
  title: string;
  question: string;
  hint: string;
  suggestedAnswer: string;
}

export interface SubjectData {
  topics: Topic[];
  exercises: Exercise[];
}

export const CURRICULUM_DATA: Record<string, Record<string, SubjectData>> = {
  "9": {
    "math": {
      topics: [
        { id: "m9-1", title: "جەبری سادە", description: "شیکارکردنی هاوکێشەکان و دۆزینەوەی نرخی نەزانراوەکان." },
        { id: "m9-2", title: "ئەندازەی تەخت", description: "تایبەتمەندییەکانی سێگۆشە، چوارگۆشە و بازنە." },
        { id: "m9-3", title: "ڕێژەی سێگۆشەیی", description: "ناسین و بەکارهێنانی ساین (sin)، کۆساین (cos)، و تانجێنت (tan)." }
      ],
      exercises: [
        {
          id: "ex-m9-1",
          title: "شیکارکردنی هاوکێشەی پلە یەک",
          question: "هاوکێشەی بەرامبەر شیکار بکە بۆ دۆزینەوەی نرخی x:\n3x + 7 = 22",
          hint: "سەرەتا ژمارە 7 بگوازەرەوە بۆ لایەکەی تری یەکسانی بە پێچەوانەی نیشانەکەی، پاشان هەردوو لای هاوکێشەکە دابەشی ٣ بکە.",
          suggestedAnswer: "x = 5"
        },
        {
          id: "ex-m9-2",
          title: "تیۆرمی فیساگۆرس",
          question: "لە سێگۆشەیەکی گۆشەوەستاودا، ئەگەر درێژی دوو لای گۆشەوەستاوەکە ٣ سم و ٤ سم بێت، درێژی ژێ کاتژمێر (وتر) چەندە؟",
          hint: "یاسای فیساگۆرس بەکاربهێنە: c² = a² + b²",
          suggestedAnswer: "5 سم"
        }
      ]
    },
    "physics": {
      topics: [
        { id: "p9-1", title: "میکانیک و جووڵە", description: "جووڵە بە خێرایی جێگیر، هێز و یاساکانی نیوتن." },
        { id: "p9-2", title: "گەرمی و پلەی گەرمی", description: "گواستنەوەی گەرمی و کاریگەری لەسەر ماددەکان." }
      ],
      exercises: [
        {
          id: "ex-p9-1",
          title: "حیسابکردنی خێرایی",
          question: "ئۆتۆمبێلێک مەودای ١٥٠ مەتر بە ماوەی ٦ چرکە دەبڕێت. خێرایی ئۆتۆمبێلەکە بدۆزەرەوە بە مەتری/چرکە؟",
          hint: "یاسای خێرایی بریتییە لە: خێرایی = مەودا / کات",
          suggestedAnswer: "25 m/s"
        }
      ]
    },
    "chemistry": {
      topics: [
        { id: "c9-1", title: "پێکهاتەی گەردیلە", description: "پڕۆتۆن، نیوترۆن، ئەلەکترۆن و خشتەی خولی." },
        { id: "c9-2", title: "کارلێکی کیمیایی", description: "یاسای پاراستنی بارستایی و هاوسەنگکردنی کارلێکەکان." }
      ],
      exercises: [
        {
          id: "ex-c9-1",
          title: "پێکهاتەی ئاو",
          question: "فورمۆڵای کیمیایی ئاو بریتییە لە H₂O. ئەمە چەند گەردیلەی هایدرۆجین و ئۆکسیجین لەخۆ دەگرێت؟",
          hint: "سەیری ژمارە بچووکەکانی تەنیشت هێماکان بکە.",
          suggestedAnswer: "٢ هایدرۆجین و ١ ئۆکسیجین"
        }
      ]
    },
    "english": {
      topics: [
        { id: "e9-1", title: "Present Simple & Continuous", description: "کاتی ڕابردووی سادە و ڕابردووی بەردەوام و جیاوازییەکانیان." },
        { id: "e9-2", title: "نووسینی نامەی سادە", description: "شێوازی نووسینی پەرەگراف و پێکھاتەی دێڕەکان." }
      ],
      exercises: [
        {
          id: "ex-e9-1",
          title: "Present Simple tense",
          question: "ڕستەی بەرامبەر ڕاست بکەرەوە:\n'He study English every day.'",
          hint: "بۆ سێیەم کەسی تاک (He, She, It) پێویستە 'es' یان 's' بۆ فرمانەکە زیاد بکرێت.",
          suggestedAnswer: "He studies English every day."
        }
      ]
    }
  },
  "10": {
    "math": {
      topics: [
        { id: "m10-1", title: "نەخشە لۆگاریتمییەکان", description: "ناسینی لۆگاریتم و کارپێکردنی یاساکانی." },
        { id: "m10-2", title: "ئەندازەی شیکاری", description: "دووری نێوان دوو خاڵ و لاری ڕاستەھێڵ." }
      ],
      exercises: [
        {
          id: "ex-m10-1",
          title: "یاساکانی لۆگاریتم",
          question: "ئەنجامی ئەم لۆگاریتمە بدۆزەرەوە: log₂ (16)",
          hint: "دوو لەسەر چ هێزێک یەکسان دەبێت بە ١٦؟",
          suggestedAnswer: "4"
        }
      ]
    },
    "physics": {
      topics: [
        { id: "p10-1", title: "میکانیک و وزە", description: "وزەی جووڵە، وزەی شاراوە و پاراستنی وزە." },
        { id: "p10-2", title: "کارەبای وەستاو", description: "بارگە کارەباییەکان و یاسای کۆڵۆم." }
      ],
      exercises: [
        {
          id: "ex-p10-1",
          title: "یاسای کۆڵۆم",
          question: "ئەگەر دووری نێوان دوو بارگە دوو هێندە بکرێت، هێزی کارەبایی نێوانیان چی بەسەر دێت؟",
          hint: "بەپێی یاسای کۆڵۆم، هێزەکە پێچەوانە دەگۆڕێت لەگەڵ دووجای دووری نێوانیان.",
          suggestedAnswer: "٤ جار کەم دەکات (دەبێت بە چارەکێک)"
        }
      ]
    },
    "chemistry": {
      topics: [
        { id: "c10-1", title: "هاوسەنگی کیمیایی", description: "یاسای هاوسەنگی و گۆڕانی بارودۆخی کارلێکەکان." },
        { id: "c10-2", title: "کیمیای لێکدراوەکان", description: "لێکۆڵینەوە لە پێکهاتە تێکەڵەکان و ترش و تفت." }
      ],
      exercises: [
        {
          id: "ex-c10-1",
          title: "نیشاندەری pH",
          question: "ئەگەر ماددەیەک pH ی یەکسان بێت بە ٣، ئایا ترشە یان تفت یان بێلایەن؟",
          hint: "ئەگەر pH کەمتر بێت لە ٧ ترشە، زیاتر بێت تفتە، و یەکسان بێت بە ٧ بێلایەنە.",
          suggestedAnswer: "ترش"
        }
      ]
    },
    "english": {
      topics: [
        { id: "e10-1", title: "Past Perfect Tense", description: "ڕابردووی تەواو و بەکارهێنانی لەگەڵ ڕابردووی سادە." },
        { id: "e10-2", title: "Relative Clauses", description: "بەکارهێنانی (who, which, that, whose) لە ڕستەدا." }
      ],
      exercises: [
        {
          id: "ex-e10-1",
          title: "Relative Pronoun",
          question: "ئەم دوو ڕستەیە پێکەوە ببەستەرەوە بە بەکارهێنانی relative pronoun:\n'The teacher is very kind. She teaches us English.'",
          hint: "بۆ ئاماژەدان بە مرۆڤ (The teacher)، بەکارهێنانی 'who' گونجاوە.",
          suggestedAnswer: "The teacher who teaches us English is very kind."
        }
      ]
    }
  },
  "11": {
    "math": {
      topics: [
        { id: "m11-1", title: "سێگۆشەزانی پێشکەوتوو", description: "نەخشە سێگۆشەییەکان، یاسای ساین و کۆساین لە سێگۆشەی ناگۆشەوەستاودا." },
        { id: "m11-2", title: "ماتریسەکان", description: "کۆکردنەوە، لێکدان و دۆزینەوەی پێچەوانەی ماتریس." }
      ],
      exercises: [
        {
          id: "ex-m11-1",
          title: "یاسای کۆساین",
          question: "لە سێگۆشەیەکدا ئەگەر درێژی دوو لا a=5 سم، b=6 سم بێت و گۆشەی نێوانیان 60 گۆشە بێت، لای سێیەم (c) بدۆزەرەوە؟",
          hint: "یاسای کۆساین بەکاربهێنە: c² = a² + b² - 2ab cos(C)",
          suggestedAnswer: "c ≈ 5.57 سم"
        }
      ]
    },
    "physics": {
      topics: [
        { id: "p11-1", title: "موگناتیسی و هێزەکان", description: "بواری موگناتیسی، هێزی موگناتیسی لەسەر تەلی کارەبایی." },
        { id: "p11-2", title: "کارەبای لەرۆک", description: "خولەکانی تەزووی گۆڕاو، بەربەستەکان و لەرەلەر." }
      ],
      exercises: [
        {
          id: "ex-p11-1",
          title: "یاسای ئۆم لە تەزووی گۆڕاودا",
          question: "ئەگەر بەربەستی کارەبایی خولێک ٢٠ ئۆم بێت و ڤۆڵتییە ١٢٠ ڤۆڵت بێت، تەزووی کارەبا چەندە؟",
          hint: "تەزوو (I) = ڤۆڵتییە (V) / بەربەست (R)",
          suggestedAnswer: "6 Ampere"
        }
      ]
    },
    "chemistry": {
      topics: [
        { id: "c11-1", title: "کیمیای گەرمی", description: "گۆڕانکاری وزە لە کارلێکەکاندا، ئینتاڵپی (ΔH)." },
        { id: "c11-2", title: "کیمیای کارەبایی", description: "خانەی گالڤانی، کارلێکەکانی ئۆکسان و لێکردنەوە." }
      ],
      exercises: [
        {
          id: "ex-c11-1",
          title: "کارلێکی گەرمیڕاکێش و گەرمیبەخش",
          question: "ئەگەر لە کارلێکێکی کیمیاییدا ئینتاڵپی نەرێنی بێت (ΔH < 0)، ئایا کارلێکەکە گەرمیڕاکێشە یان گەرمیبەخش؟",
          hint: "کاتێک وزە دەردەدرێت دەرەوە بۆ ژینگە، گەرمیبەخشە و ئینتاڵپییەکەی نەرێنییە.",
          suggestedAnswer: "گەرمیبەخش (Exothermic)"
        }
      ]
    },
    "english": {
      topics: [
        { id: "e11-1", title: "Active and Passive Voice", description: "شێوازی بکەرئاشکرا و بکەرنادیار لە زمانەکەدا." },
        { id: "e11-2", title: "Reported Speech", description: "گۆڕینی وتەی ڕاستەوخۆ بۆ وتەی ناڕاستەوخۆ بە گۆڕینی کاتەکان." }
      ],
      exercises: [
        {
          id: "ex-e11-1",
          title: "Passive Voice Conversion",
          question: "ئەم ڕستەیە بگۆڕە بۆ passive voice:\n'The students solved the equation.'",
          hint: "سەرەتا مفعول (the equation) بێنە پێشەوە، پاشان فەرزی گونجاوی رابردوو (was/were) و شێوازی سێیەمی کار (solved) بەکاربهێنە.",
          suggestedAnswer: "The equation was solved by the students."
        }
      ]
    }
  },
  "12": {
    "math": {
      topics: [
        { id: "m12-1", title: "جیاکاری (Differentiation)", description: "دۆزینەوەی لێژکەرەوە، گرتە و خێرایی ساتەوەخت." },
        { id: "m12-2", title: "تەواوکاری (Integration)", description: "ڕووبەری بن لک، دژە گرتە و یاسای تەواوکارییە نەزانراوەکان." }
      ],
      exercises: [
        {
          id: "ex-m12-1",
          title: "دۆزینەوەی گرتە (دەرگیراو)",
          question: "گرتەی یەکەمی ئەم نەخشەیە بدۆزەرەوە:\nf(x) = 3x² + 5x - 2",
          hint: "یاسای هێز بەکاربهێنە: گرتەی xⁿ بریتییە لە n·xⁿ⁻¹.",
          suggestedAnswer: "f'(x) = 6x + 5"
        },
        {
          id: "ex-m12-2",
          title: "حیسابکردنی تەواوکاری دیاریکراو",
          question: "تەواوکاری ئەم پێکهاتەیە بدۆزەرەوە لە نێوان 0 و 2:\n∫ (2x) dx",
          hint: "سەرەتا تەواوکاری 2x بکە کە دەبێتە x²، پاشان نرخەکانی 2 و 0 دابنێ.",
          suggestedAnswer: "4"
        }
      ]
    },
    "physics": {
      topics: [
        { id: "p12-1", title: "یاساکانی هێز و جووڵەی گۆشەیی", description: "لادانی گۆشەیی، خێرایی و تاودانی گۆشەیی و لۆمبوونی تەوەرەیی." },
        { id: "p12-2", title: "کیمیای فیزیکی و تیشکدان", description: "دیاردەی فۆتۆئەلەکتریک و لادانی کۆمبتن." }
      ],
      exercises: [
        {
          id: "ex-p12-1",
          title: "دیاردەی فۆتۆئەلەکتریک",
          question: "ئەگەر لەرەلەری تیشکێکی کەوتوو کەمتر بێت لە لەرەلەری لێتبڕان (Threshold Frequency)، ئایا ئەلەکترۆن لە ڕووی کانزاکەوە دەردەپەڕێت؟",
          hint: "پێویستە وزەی فۆتۆنەکان لە کارکردی کانزاکە زیاتر بێت تا ئەلەکترۆن دەرپەڕێت.",
          suggestedAnswer: "نەخێر، هیچ ئەلەکترۆنێک دەرناپەڕێت."
        }
      ]
    },
    "chemistry": {
      topics: [
        { id: "c12-1", title: "کیمیای ئەندامی (Organic Chemistry)", description: "ئەلکانەکان، ئەلکینەکان، کحوولەکان و پێکهاتەی بەنزین." },
        { id: "c12-2", title: "کیمیای ژیانی", description: "کاربۆهایدرات، پڕۆتینەکان و بەستەرە پەپتیدییەکان." }
      ],
      exercises: [
        {
          id: "ex-c12-1",
          title: "ناونانی ئۆرگانیک (IUPAC)",
          question: "ناوی فەرمی ئەم پێکهاتەیە چییە؟\nCH₃-CH₂-OH",
          hint: "لێکدراوەکە خاوەن دوو گەردیلەی کاربۆنە و گروپی فەرمانی (-OH) ی تێدایە کە نیشانەی کحوولەکانە.",
          suggestedAnswer: "ئێسانۆڵ (Ethanol)"
        }
      ]
    },
    "english": {
      topics: [
        { id: "e12-1", title: "Conditional Sentences (If clauses)", description: "چوار پۆلێنی سەرەکی مەرج (Zero, First, Second, Third)." },
        { id: "e12-2", title: "فۆرمۆڵاکردنی ئینشای بەهێز", description: "نووسینی وتار لەسەر ژینگە یان تەکنەلۆجیا و درێژکردنەوەی پەرەگراف." }
      ],
      exercises: [
        {
          id: "ex-e12-1",
          title: "Conditional Type 3",
          question: "فۆرمی گونجاوی فرمانەکە لە کەوانەکەدا دابنێ:\n'If you (study) harder, you would have passed the exam.'",
          hint: "ئەمە ڕستەی مەرجیی جۆری سێیەمە (Type 3). بەشی ئەنجامەکە 'would have + P.P' تێدایە، بۆیە لای 'If' پێویستە 'Past Perfect' (had + P.P) بێت.",
          suggestedAnswer: "had studied"
        }
      ]
    }
  }
};

export const ADVICE_QUOTES = [
  "ڕۆڵەی خۆشەویستم، لەبیرت بێت کە هێزی بیرکاری لە تێگەیشتندایە نەک تەنها لە لەبەرکردنی یاساکان!",
  "پەرۆشی و بەردەوامی کلیلی سەرکەوتنی پۆلی ١٢یە. هەموو ڕۆژێک هەنگاوێکی بچووک تۆ لە ئامانجەکەت نزیک دەکاتەوە.",
  "فیزیای پۆلی ١٢ وەک تابلۆیەکی هونەری وایە، چەندە زیاتر ورد بیتەوە تێیدا، جوانتر لە یاساکانی گەردوون تێدەگەیت.",
  "خەم مەخۆ ئەگەر لەسەرەتادا هەڵەت کرد، هەڵەکان باشترین مامۆستان بۆ ئەوەی ڕێگەی ڕاست بدۆزینەوە.",
  "ئینگلیزی تەنها وانەیەک نییە بۆ بەدەستهێنانی نمرە، بەڵکو پەنجەرەیەکە بەرەو دونیایەکی پڕ لە زانستی نوێ بۆ داهاتووت.",
  "سەرکەوتن هاوڕێی ئەو کەسانەیە کە ماندوو دەبن و لە کاتی شکستی سەرەتاییدا کۆڵ نادەن."
];

export const SUBJECT_METADATA: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  "math": {
    label: "بیرکاری",
    icon: "Calculator",
    color: "text-blue-700 border-blue-300",
    bg: "bg-blue-50 hover:bg-blue-100/70"
  },
  "physics": {
    label: "فیزیا",
    icon: "Zap",
    color: "text-sky-700 border-sky-300",
    bg: "bg-sky-50 hover:bg-sky-100/70"
  },
  "chemistry": {
    label: "کیمیا",
    icon: "Atom",
    color: "text-indigo-700 border-indigo-300",
    bg: "bg-indigo-50 hover:bg-indigo-100/70"
  },
  "english": {
    label: "ئینگلیزی",
    icon: "Languages",
    color: "text-cyan-700 border-cyan-300",
    bg: "bg-cyan-50 hover:bg-cyan-100/70"
  }
};
