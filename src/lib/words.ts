// Curated word bank. Har din date ke hisaab se 5 words rotate hote hain
// (free, instant, no API). Naye words add karne ho to bas list badha do.

export type Word = {
  word: string;
  type: string; // part of speech
  meaning: string;
  hindi: string;
  example: string;
};

export const WORD_BANK: Word[] = [
  { word: "Articulate", type: "adjective", meaning: "able to express ideas clearly", hindi: "स्पष्ट रूप से बोलने वाला", example: "She is very articulate when she presents her ideas." },
  { word: "Diligent", type: "adjective", meaning: "hardworking and careful", hindi: "मेहनती, परिश्रमी", example: "He is a diligent student who never misses homework." },
  { word: "Inevitable", type: "adjective", meaning: "certain to happen; unavoidable", hindi: "अपरिहार्य", example: "Change is inevitable, so we must adapt." },
  { word: "Pragmatic", type: "adjective", meaning: "practical rather than idealistic", hindi: "व्यावहारिक", example: "We need a pragmatic solution, not just big dreams." },
  { word: "Resilient", type: "adjective", meaning: "able to recover quickly from difficulty", hindi: "लचीला, मजबूत", example: "Resilient people bounce back after failure." },
  { word: "Ambiguous", type: "adjective", meaning: "having more than one meaning; unclear", hindi: "अस्पष्ट, दुविधापूर्ण", example: "His answer was ambiguous, so I asked again." },
  { word: "Meticulous", type: "adjective", meaning: "very careful about details", hindi: "बारीकी से ध्यान देने वाला", example: "She is meticulous about checking her work." },
  { word: "Candid", type: "adjective", meaning: "honest and direct", hindi: "स्पष्टवादी, खरा", example: "Thank you for your candid feedback." },
  { word: "Endeavour", type: "noun/verb", meaning: "an attempt or serious effort", hindi: "प्रयास करना", example: "We will endeavour to finish the project on time." },
  { word: "Coherent", type: "adjective", meaning: "logical and well organised", hindi: "सुसंगत", example: "Write a coherent essay with clear paragraphs." },
  { word: "Prudent", type: "adjective", meaning: "acting with care and good judgement", hindi: "समझदार, विवेकी", example: "It is prudent to save money for emergencies." },
  { word: "Eloquent", type: "adjective", meaning: "fluent and persuasive in speech", hindi: "वाक्पटु", example: "The leader gave an eloquent speech." },
  { word: "Tenacious", type: "adjective", meaning: "holding firmly; persistent", hindi: "दृढ़, हठी", example: "Her tenacious attitude helped her succeed." },
  { word: "Concise", type: "adjective", meaning: "short and clear", hindi: "संक्षिप्त", example: "Keep your email concise and to the point." },
  { word: "Versatile", type: "adjective", meaning: "able to do many different things", hindi: "बहुमुखी", example: "He is a versatile player who can bat and bowl." },
  { word: "Empathy", type: "noun", meaning: "understanding others' feelings", hindi: "सहानुभूति", example: "A good manager leads with empathy." },
  { word: "Feasible", type: "adjective", meaning: "possible to do easily", hindi: "व्यवहार्य, संभव", example: "Is this plan feasible within our budget?" },
  { word: "Reluctant", type: "adjective", meaning: "unwilling; hesitant", hindi: "अनिच्छुक", example: "She was reluctant to speak in public." },
  { word: "Spontaneous", type: "adjective", meaning: "done naturally without planning", hindi: "स्वतःस्फूर्त", example: "We made a spontaneous trip to the hills." },
  { word: "Gratitude", type: "noun", meaning: "the feeling of being thankful", hindi: "कृतज्ञता", example: "I want to express my gratitude to my teachers." },
  { word: "Ambitious", type: "adjective", meaning: "having strong desire for success", hindi: "महत्वाकांक्षी", example: "She has ambitious goals for her career." },
  { word: "Persuade", type: "verb", meaning: "to convince someone to do something", hindi: "मनाना, राज़ी करना", example: "He persuaded me to join the gym." },
  { word: "Genuine", type: "adjective", meaning: "real and sincere", hindi: "वास्तविक, सच्चा", example: "She showed genuine interest in my work." },
  { word: "Obstacle", type: "noun", meaning: "something that blocks progress", hindi: "बाधा, रुकावट", example: "Fear of failure is the biggest obstacle." },
  { word: "Optimistic", type: "adjective", meaning: "hopeful about the future", hindi: "आशावादी", example: "Stay optimistic even in tough times." },
  { word: "Consistent", type: "adjective", meaning: "always behaving the same way", hindi: "निरंतर, एकरूप", example: "Consistent practice improves your English." },
  { word: "Elaborate", type: "verb/adj", meaning: "to explain in more detail", hindi: "विस्तार से बताना", example: "Could you elaborate on your idea?" },
  { word: "Frugal", type: "adjective", meaning: "careful with money; economical", hindi: "मितव्ययी", example: "He lives a frugal life and saves a lot." },
  { word: "Intuitive", type: "adjective", meaning: "easy to understand; based on feeling", hindi: "सहज ज्ञान वाला", example: "The app has a very intuitive design." },
  { word: "Humble", type: "adjective", meaning: "not proud; modest", hindi: "विनम्र", example: "Despite his success, he remains humble." },
  { word: "Perseverance", type: "noun", meaning: "continued effort despite difficulty", hindi: "दृढ़ता, लगन", example: "Perseverance is the key to mastery." },
  { word: "Adequate", type: "adjective", meaning: "enough for the purpose", hindi: "पर्याप्त", example: "Make sure you get adequate sleep." },
  { word: "Vivid", type: "adjective", meaning: "very clear and bright; lively", hindi: "जीवंत, स्पष्ट", example: "She gave a vivid description of the beach." },
  { word: "Notorious", type: "adjective", meaning: "famous for something bad", hindi: "बदनाम, कुख्यात", example: "That road is notorious for traffic jams." },
  { word: "Sincere", type: "adjective", meaning: "honest and truly meant", hindi: "निष्कपट, ईमानदार", example: "Please accept my sincere apologies." },
  { word: "Anticipate", type: "verb", meaning: "to expect something to happen", hindi: "पहले से अनुमान लगाना", example: "We anticipate a busy weekend." },
  { word: "Compassion", type: "noun", meaning: "kindness for those who suffer", hindi: "करुणा, दया", example: "Treat everyone with compassion." },
  { word: "Efficient", type: "adjective", meaning: "working well without waste", hindi: "कुशल, दक्ष", example: "This is a more efficient way to work." },
  { word: "Curiosity", type: "noun", meaning: "a strong desire to learn", hindi: "जिज्ञासा", example: "Curiosity helps you learn faster." },
  { word: "Reliable", type: "adjective", meaning: "able to be trusted", hindi: "भरोसेमंद", example: "He is a reliable friend." },
];

/** Deterministic 5 words for a given date (rotates daily, no repeats within a cycle). */
export function getDailyWords(date = new Date(), count = 5): Word[] {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const now = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfYear = Math.floor((now - start) / 86_400_000);
  const n = WORD_BANK.length;
  const offset = (dayOfYear * count) % n;
  return Array.from({ length: count }, (_, i) => WORD_BANK[(offset + i) % n]);
}
