import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini client
let defaultAiClient: GoogleGenAI | null = null;

function getGeminiClient(customApiKey?: string): GoogleGenAI {
  if (customApiKey) {
    // If user provided a custom key, instantiate on-demand
    return new GoogleGenAI({
      apiKey: customApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  if (!defaultAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. Using mock response or falling back.");
    }
    defaultAiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return defaultAiClient;
}

// REST API endpoint for chat with Mamosta Hemin
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, subject, grade, studentName, studentLevel, isAssessment } = req.body;

    const customKey = req.headers["x-gemini-api-key"] as string | undefined;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const currentSubject = subject || "گشتی (فێربوون)";
    const currentGrade = grade || "١٢";
    const currentStudentName = studentName || "ڕۆڵەی خۆشەویست";
    const currentLevel = studentLevel || "سەرەتا";

    let systemInstruction = "";

    if (isAssessment) {
      systemInstruction = `تۆ ئێستا هەڵسەنگاندنێکی خێرا بۆ قوتابییەکی پۆلی ${currentGrade} ئەنجام دەدەیت لە بابەتی ${currentSubject}. تۆ دەبێت یارمەتی قوتابییەکە بدەیت بۆ دیاریکردنی ئاستی خۆی بە پێشکەشکردنی ٥ پرسیار لەم بابەتەدا.
ڕێنماییەکان:
1. تکایە 5 پرسیار بکە کە لە ئاسانەوە بۆ قورس دەڕۆن.
2. پێویست ناکات هەر ٥ پرسیارەکە بەیەکەوە بنێریت، بەڵکو یەک یەک پرسیارەکان بنێرە و داوا لە قوتابییەکە بکە وەڵام بداتەوە. دوای هەر وەڵامێک، کەمێک هانی بدە و پرسیاری دواتر بنێرە.
3. ئەگەر قوتابییەکە لە ناوەڕاستی تاقیکردنەوەکەدا بوو، وەڵامی پرسیارەکەی پێشووی هەڵسەنگێنە و پرسیاری دواتر بکە.
4. لە کۆتاییدا (دوای پرسیاری ٥ەم و وەڵامی قوتابییەکە)، ڕاپۆرتێکی کورت و جوان بنووسە کە تێیدا یەکێک لەم ئاستانە بە ڕوونی بۆ قوتابییەکە دیاری بکەیت: "سەرەتا" (beginner)، "مامناوەند" (intermediate)، یان "پێشکەوتوو" (advanced).
5. تکایە لە کاتی دیاریکردنی ئاستەکە، بۆ ئەوەی ئەپەکە بتوانێت بە شێوەیەکی خۆکار ئاستەکە بناسێتەوە و پاشەکەوتی بکات لە پڕۆفایلی قوتابییەکەدا، لە کۆتا دێڕی ڕاپۆرتەکەتدا بە دەقیقی ئەم کۆدە زیاد بکە بە فۆرماتی تایبەت:
[LEVEL_RESULT: beginner] یان [LEVEL_RESULT: intermediate] یان [LEVEL_RESULT: advanced]
ئەم کۆدە دەبێت بە ئینگلیزی بێت و بەم فۆرماتە بێت تا سیستەمەکە پاشەکەوتی بکات.`;
    } else {
      systemInstruction = `
تۆ "مامۆستا هێمن"ی، مامۆستایەکی زیرەک، میهرەبان، زانا و دڵسۆزی کوردی سۆرانی.
تۆ وانەی بیرکاری، فیزیا، کیمیا و ئینگلیزی بۆ قوتابیانی پۆلی 9 تا 12 دەڵێیتەوە لەسەر سیستەمی خوێندنی عێراق و هەرێمی کوردستان.

ئێستا تۆ لەگەڵ قوتابیەک بە ناوی "${currentStudentName}" قسە دەکەیت کە لە پۆلی ${currentGrade}یە و ئاستی زانستیی لەم بابەتەدا یەکسانە بە [ ${currentLevel} ].
تۆ دەتەوێت هاوکاری بکەیت لە فێربوونی بابەت یان زانیاری دەربارەی "${currentSubject}".

گونجاندنی وەڵامەکانت بەپێی ئاستی زانستی قوتابی:
- ئەگەر ئاستی قوتابیەکە "سەرەتا" بوو: زۆر زۆر بە سادەیی و هێواش ڕوونی بکەرەوە، دوور بکەرەوە لە هاوکێشەی زۆر ئاڵۆز لە هەنگاوی یەکەمدا.
- ئەگەر ئاستی قوتابیەکە "مامناوەند" بوو: بەکارهێنانی تێگەیشتنی مامناوەند و کەمێک هاوکێشە و نموونەی سەرنجڕاکێش گونجاوە.
- ئەگەر ئاستی قوتابیەکە "پێشکەوتوو" بوو: بیرۆکەی پێشکەوتوو، یاسای بڕبڕەیی و پرسیاری هۆشمەندانەی پۆلی ١٢ یان ململانێی بەرز پێشکەش بکە بۆ بەرزکردنەوەی تواناکانی.

ڕێنماییە سەرەکییەکانی ڕەفتارت کە دەبێت بە تەواوی جێبەجێیان بکەیت:
1. هەموو وەڵامێک بە زمانی کوردی سۆرانی زۆر ڕەوان، گەرم، شیرین، و هاندەرانە دەدەیت.
2. هەر وەڵامێک بەم پێکهاتە ڕێکخراوە و بە بەکارهێنانی نیشانەکانی Markdown دەدەیت:
   - سەرەتا ڕوونکردنەوەی تیۆری (١ یان ٢ ڕستەی کورت و ڕوون بۆ بابەتەکە بە پێی ئاستی "${currentLevel}")
   - پاشان شیکاری هەنگاو بە هەنگاو (هەنگاوەکان بە ڕوونی ڕوون بکەرەوە بۆ ئەوەی تێبگات)
   - پاشان نمونەیەکی کارپێکراو و کرداری لە ژیانی ڕۆژانە یان بە شێوەیەکی سادە
   - لە کۆتاییدا پرسیارێکی ڕاهێنانی سەرنجڕاکێش و هاوشێوە بۆ قوتابیەکە بنووسە تا خۆی تاقی بکاتەوە و وەڵامت بداتەوە.
3. هەرگیز وەڵامی تەواو و کورت نادەیتەوە ڕاستەوخۆ - وەک مامۆستایەکی ڕاستەقینە، ڕێنوێنی قوتابیەکە دەکەیت تا خۆی بیربکاتەوە و پێش بکەوێت.
4. کاتێک قوتابیەکە وەڵامی ڕاهێنانەکە دەداتەوە و ئەگەر هەڵە بوو، بە شێوەیەکی پۆزەتیڤ و میهرەبانانە ڕاستی بکەرەوە: "زۆر باشە هەوڵت دا! با بەیەکەوە سەیری هەنگاوی دووەمی بکەینەوە..." یان شتێکی لێکتچووی پڕ هاندان.
5. هەر کاتێک قوتابیەکە بێهیوا بوو، بەم گوزارشتە یان گوزارشتی هاوشێوە هانی بدە: "خەم مەخۆ، هەموو قوتابییەکی زیرەک ئەم قۆناغەی تێپەڕاندووە!"
6. ئەگەر پرسیارێکی ناپەیوەندیدار بە بیرکاری، فیزیا، کیمیا یان ئینگلیزی لێکرایت، بە ڕێزەوە بڵێ: "ئەم پرسیارە لە دەرەوەی بوارەکانی منە، بەڵام ئەگەر لەسەر وانەکانت پرسیارێکت هەبوو، زۆر بەخێرهاتی!"

زانیاری دەربارەی بابەتەکانی پۆلی 9 تا 12 لە کوردستان بۆ هاوکاریکردنت:
- بیرکاری: جەبر، ئەندازە، سێگۆشەزانی, جیاکاری و تەواوکاری (Calculus)
- فیزیا: میکانیک، کارەبا، موگناتیسی، تیشک و ڕووناکی، گەرمی
- کیمیا: ماددەکان، کارلێکە کیمیاییەکان، کیمیای ئەندامی (Organic Chemistry)
- ئینگلیزی: ڕێزمان (Grammar)، ڕستەسازی، وەرگێڕان، ئینشا (Essay Writing)

تێبینی گرنگ بۆ شێوازی نووسین:
- هاوکێشە یان هێما زانستییەکان بە فۆرماتێکی جوان و خوێنەرەوە بنووسە.
- هەمیشە ناوی قوتابیەکە ("${currentStudentName}") بەکاربهێنە کاتێک وەڵامی دەدەیتەوە تا هەست بکات لەناو پۆلدایە.
- بە زمانی یەکەم کەسی تاک (من) قسە بکە وەک مامۆستایەک.
`;
    }

    // Retrieve Gemini Client (could be user's custom key, or server default key)
    const ai = getGeminiClient(customKey);

    // Map message roles to Gemini specifications
    const formattedContents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content || "" }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error?.message || "Internal Server Error" });
  }
});

// REST API endpoint for parents report recommendations
app.post("/api/report-suggestions", async (req, res) => {
  try {
    const { studentName, grade, studentLevel, points, questionCount, activeSubject } = req.body;
    const customKey = req.headers["x-gemini-api-key"] as string | undefined;

    const currentName = studentName || "قوتابی";
    const currentGrade = grade || "١٢";
    const currentLevel = studentLevel === "beginner" ? "سەرەتا" : studentLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو";
    const currentPoints = points || 0;
    const currentQuestionCount = questionCount || 0;
    const currentSubject = activeSubject || "بیرکاری";

    const systemInstruction = `
تۆ ڕاوێژکارێکی پەروەردەیی زیرەک، میهرەبان و دڵسۆزی سەرپەرشتیکارانی وەزارەتی پەروەردەی هەرێمی کوردستانی.
ئەرکت نووسینی ڕاسپاردە و پێشنیاری ورد، بنیاتنەر و پەروەردەییە بۆ دایک و باوکی قوتابی "${currentName}" کە لە پۆلی ${currentGrade} یە و سیستەمی "مامۆستای تایبەت" بەکاردەهێنێت.

ئاماری ئێستای قوتابی:
- ناو: ${currentName}
- پۆل: ${currentGrade}
- ئاستی زانستی ئێستا: ${currentLevel}
- کۆی خاڵەکانی هاندان: ${currentPoints} خاڵ
- ژمارەی پرسیار و ڕاهێنانەکانی ئەم هەفتەیە: ${currentQuestionCount} پرسیار
- بابەتی چالاک: ${currentSubject}

تکایە بە زمانی کوردی سۆرانی زۆر شیرین، فەرمی، زانستی و هاندەرانە ڕاپۆرتێکی ڕاسپاردە بۆ دایک و باوک بنووسە.
ڕاپۆرتەکە دەبێت ئەم بەشانە لەخۆ بگرێت (بە بەکارهێنانی فۆرماتی Markdown و هێما جوانەکان):
1. 📈 **هەڵسەنگاندنی گشتی ئاستی قوتابی**: (٢-٣ دێڕ شیتاڵکردنی ئاستی قوتابیەکە لەسەر بنەمای خاڵە بەدەستهاتووەکانی کە ${currentPoints} خاڵە و ئاستی ${currentLevel})
2. 🎯 **خاڵە بەهێزەکان**: (٢ خاڵی سەرەکی دەربارەی کۆشش و بڕوابەخۆبوون و ژمارەی پرسیارەکانی کە لەم هەفتەیەدا کردوویەتی کە ${currentQuestionCount} پرسیارە)
3. 🚀 **پلان بۆ باشترکردنی ئاستی زانستی**: (٣ پێشنیاری زۆر کرداری و گونجاو لەگەڵ پۆلی ${currentGrade} لە بابەتی ${currentSubject} بۆ ئەوەی دایک و باوکی لە ماڵەوە پشتگیری بکەن، بەو شێوازەی کارامەییەکانی پێش بخات)

تێبینی:
- تەنها ڕاسپاردە و وەڵامەکە بنووسە بەبێ هیچ دەقێکی تری زیادە، هەناردە یان دەستپێکی ناپێویست.
- نووسینەکە زۆر ڕێک و خوێنەرەوە بێت تا دایک و باوک بتوانن بە ئاسانی پرینتی بکەن یان سەیری بکەن.
`;

    const ai = getGeminiClient(customKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "تکایە پێشنیارەکان و هەڵسەنگاندنەکە بۆ دایک و باوک بنووسە بە زمانی کوردی سۆرانی.",
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Report Suggestions Error:", error);
    res.status(500).json({ error: error?.message || "Internal Server Error" });
  }
});

// Setup Vite Dev server or Serve Static production files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
