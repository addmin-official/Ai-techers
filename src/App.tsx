import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Send, 
  User, 
  RotateCcw, 
  CheckCircle, 
  Award, 
  Sparkles, 
  MessageSquare,
  BookOpenCheck,
  Brain,
  GraduationCap,
  Settings,
  Key,
  X,
  Menu,
  ChevronRight,
  Info,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  Printer,
  TrendingUp,
  Clock,
  ClipboardList,
  Calendar
} from "lucide-react";
import { CURRICULUM_DATA, ADVICE_QUOTES, SUBJECT_METADATA } from "./data";
import confetti from "canvas-confetti";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isAssessmentPrompt?: boolean;
}

const RANKS = [
  { title: "قوتابی نوێ 🌱", min: 0, max: 100 },
  { title: "قوتابی بەهرەمەند ⭐", min: 101, max: 300 },
  { title: "قوتابی زیرەک 🌟", min: 301, max: 500 },
  { title: "مامۆستای بچووک 👑", min: 501, max: 1000 },
  { title: "پێشەوای زانست 🏆", min: 1001, max: Infinity }
];

export default function App() {
  // Student Profile State
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem("mamosta_student_name") || "";
  });
  const [grade, setGrade] = useState<string>(() => {
    return localStorage.getItem("mamosta_student_grade") || "12";
  });
  const [studentLevel, setStudentLevel] = useState<string>(() => {
    return localStorage.getItem("mamosta_student_level") || "intermediate"; // beginner, intermediate, advanced
  });
  const [isConfigured, setIsConfigured] = useState<boolean>(() => {
    return !!localStorage.getItem("mamosta_student_name");
  });

  // Assessment Mode State
  const [isAssessmentMode, setIsAssessmentMode] = useState<boolean>(() => {
    return localStorage.getItem("mamosta_is_assessment_mode") === "true";
  });

  // Points & Gamification State
  const [points, setPoints] = useState<number>(() => {
    return parseInt(localStorage.getItem("mamosta_points") || "0", 10);
  });
  const [showLevelUpAlert, setShowLevelUpAlert] = useState<{
    show: boolean;
    oldRank: string;
    newRank: string;
    pointsEarned: number;
    message: string;
  } | null>(null);
  const [pointsToast, setPointsToast] = useState<{
    show: boolean;
    amount: number;
    reason: string;
  } | null>(null);

  // Parent Report State
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportSuggestions, setReportSuggestions] = useState<string>("");
  const [reportError, setReportError] = useState<string>("");
  const [reportGeneratedDate, setReportGeneratedDate] = useState<string>("");

  const getSubjectStats = () => {
    const stored = localStorage.getItem("mamosta_subject_stats");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return {};
      }
    }
    return {};
  };

  const incrementSubjectStat = (subj: string) => {
    const stats = getSubjectStats();
    stats[subj] = (stats[subj] || 0) + 1;
    localStorage.setItem("mamosta_subject_stats", JSON.stringify(stats));
  };

  const getMostActiveSubject = () => {
    const stats = getSubjectStats();
    let maxCount = -1;
    let maxSubj = "math"; // default
    
    // Ensure all active subjects are listed
    const subjectKeys = ["math", "physics", "chemistry", "english"];
    subjectKeys.forEach(k => {
      if (!stats[k]) {
        stats[k] = 0;
      }
    });

    Object.keys(stats).forEach(key => {
      if (stats[key] > maxCount) {
        maxCount = stats[key];
        maxSubj = key;
      }
    });

    return SUBJECT_METADATA[maxSubj]?.label || "بیرکاری";
  };

  const handleGenerateReport = async () => {
    setIsReportOpen(true);
    setIsGeneratingReport(true);
    setReportError("");
    setReportSuggestions("");
    
    const formattedDate = new Date().toLocaleDateString("ku-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) || new Date().toLocaleString();
    setReportGeneratedDate(formattedDate);

    // Calculate dynamic stats
    const questionCount = messages.filter(m => m.role === "user").length;
    const mostActiveSubj = getMostActiveSubject();
    
    try {
      const response = await fetch("/api/report-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customApiKey !== "YOUR_API_KEY_HERE" && { "x-gemini-api-key": customApiKey })
        },
        body: JSON.stringify({
          studentName,
          grade,
          studentLevel,
          points,
          questionCount,
          activeSubject: mostActiveSubj
        })
      });

      if (!response.ok) {
        throw new Error("تکایە بمبوورە، نەمتوانی بەستەر لەگەڵ سێرڤەر دروست بکەم بۆ دروستکردنی ڕاپۆرتەکە.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setReportSuggestions(data.text || "هیچ ڕاسپاردەیەک پێشکەش نەکراوە.");
    } catch (err: any) {
      console.error("Report Generation Error:", err);
      setReportError(err?.message || "کێشەیەک لە سێرڤەر ڕوویدا لە کاتی دروستکردنی ڕاسپاردەکان.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getRankByPoints = (pts: number) => {
    return RANKS.find(r => pts >= r.min && pts <= r.max) || RANKS[0];
  };

  const getProgressPercent = () => {
    const rank = getRankByPoints(points);
    if (rank.max === Infinity) return 100;
    const range = rank.max - rank.min + 1;
    const progress = points - rank.min;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const addPoints = (amount: number, reason: string) => {
    setPoints(prev => {
      const nextPoints = prev + amount;
      localStorage.setItem("mamosta_points", nextPoints.toString());

      const oldRank = getRankByPoints(prev);
      const newRank = getRankByPoints(nextPoints);

      if (oldRank.title !== newRank.title) {
        // Trigger celebration
        setTimeout(() => {
          triggerConfetti();
        }, 100);

        setShowLevelUpAlert({
          show: true,
          oldRank: oldRank.title,
          newRank: newRank.title,
          pointsEarned: amount,
          message: `پیرۆزە! گەشتیتە پلەی نوێ: **${newRank.title}** 🎉`
        });
      } else {
        setPointsToast({
          show: true,
          amount,
          reason
        });
      }

      return nextPoints;
    });
  };

  const isCorrectAnswerFeedback = (text: string) => {
    const correctKeywords = [
      "وەڵامەکەت ڕاستە",
      "وەڵامەکەت تەواوە",
      "شیکارەکەت ڕاستە",
      "ڕاستت گوت",
      "ڕاستت وت",
      "زۆر دروستە",
      "ئافەرین",
      "دەستخۆش",
      "نموونەت زۆر بێت",
      "وەڵامی دروست"
    ];
    // Check if any of the positive keywords are present
    return correctKeywords.some(keyword => text.includes(keyword));
  };

  // Custom Gemini API Key State (Optional - fallback to backend)
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem("mamosta_custom_api_key") || "YOUR_API_KEY_HERE";
  });

  // Temporary Form Inputs
  const [nameInput, setNameInput] = useState("");
  const [gradeInput, setGradeInput] = useState("12");
  const [levelInput, setLevelInput] = useState("intermediate");
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return localStorage.getItem("mamosta_custom_api_key") || "YOUR_API_KEY_HERE";
  });

  // Classroom State
  const [activeSubject, setActiveSubject] = useState<string>("math");
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = localStorage.getItem("mamosta_messages");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error("Error parsing stored messages:", e);
      }
    }
    return [];
  });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize random advice quote
  useEffect(() => {
    const randomQuote = ADVICE_QUOTES[Math.floor(Math.random() * ADVICE_QUOTES.length)];
    setCurrentQuote(randomQuote);
  }, []);

  // Auto-dismiss points toast notification after 3 seconds
  useEffect(() => {
    if (pointsToast && pointsToast.show) {
      const timer = setTimeout(() => {
        setPointsToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pointsToast]);

  // Set initial welcome message from Mamosta Taybet once configured
  useEffect(() => {
    if (isConfigured && messages.length === 0) {
      const subjectLabel = SUBJECT_METADATA[activeSubject]?.label || "بیرکاری";
      const levelLabel = studentLevel === "beginner" ? "سەرەتا" : studentLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو";
      
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `سڵاو لە قوتابی زیرەک و بەپەرۆشم، **${studentName}**! زۆر بەخێرهاتی بۆ پۆلی زیرەکی **مامۆستای تایبەت 🤖📚**. 🌟

ئێستا تۆ لە پۆلی **${grade}**یت و ئاستی فێربوونت وەک [ **${levelLabel}** ] دەستنیشانکراوە. من لێرەم تا بە شێوازێکی زانستی و هاوچەرخ یارمەتیت بدەم ببیتە یەکەم لە بابەتەکانی **بیرکاری، فیزیا، کیمیا، و ئینگلیزی**.

ڕێسا کارپێکراوەکەم زۆر ئاسانە:
1. ڕوونکردنەوەی تیۆری خێرا پێشکەش دەکەم.
2. هەنگاو بە هەنگاو شیکاری دەکەین.
3. نموونەیەکی بەهێزی ژیانی ڕۆژانە باس دەکەین.
4. لە کۆتاییدا پرسیارێکی ڕاهێنانیت بۆ دادەنێم تا خۆت تاقی بکەیتەوە!

با پێکەوە فێربوون بکەینە چێژ! 🚀`,
          timestamp: new Date()
        },
        {
          id: "welcome-assessment-prompt",
          role: "assistant",
          content: `ئایا دەتەوێت ئاستی زانستی خۆت تاقی بکەیتەوە لەم بابەتەدا؟ 📝✨\n\nمن دەتوانم ٥ پرسیاری خێرام ئاڕاستە بکەم تا ئاستی دروستی فێربوونت (سەرەتا، مامناوەند، پێشکەوتوو) دیاری بکەم و شێوازی وتنەوەی وانەکانت بە تەواوی بگونجێنم!`,
          timestamp: new Date(),
          isAssessmentPrompt: true
        }
      ]);
    }
  }, [isConfigured, studentName, grade, studentLevel]);

  // Assessment Logic Helpers
  const handleStartAssessment = (fromWelcomePrompt = false) => {
    const subjectLabel = SUBJECT_METADATA[activeSubject]?.label || "بیرکاری";
    
    setIsAssessmentMode(true);
    localStorage.setItem("mamosta_is_assessment_mode", "true");

    const startMsg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `قوتابی خۆشەویستم ${studentName}، بەخێرهاتی بۆ هەڵسەنگاندنی ئاست لە بابەت و دەرسەکانی **${subjectLabel}** بۆ پۆلی **${grade}**! 📝\n\nمن ٥ پرسیاری کورت و گرنگت ئاڕاستە دەکەم کە لە ئاسانەوە بەرەو قورس دەڕۆن، پاشان ئاستت لە سەرەوە نوێ دەکەینەوە.\n\nتکایە کاتێک ئامادەبوویت، لێرە بنووسە **"ئامادەم"** یان بنووسە **"دەست پێ بکە"** تاوەکو یەکەم پرسیارت بۆ بنێرم!`,
      timestamp: new Date()
    };
    
    setMessages([startMsg]);
    if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  const handleDeclineAssessment = (promptId: string) => {
    setMessages(prev => prev.filter(m => m.id !== promptId));
  };

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("mamosta_messages", JSON.stringify(messages));
    } else {
      localStorage.removeItem("mamosta_messages");
    }
  }, [messages]);

  // Handle student profile submission
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    
    localStorage.setItem("mamosta_student_name", nameInput.trim());
    localStorage.setItem("mamosta_student_grade", gradeInput);
    localStorage.setItem("mamosta_student_level", levelInput);
    if (apiKeyInput.trim() && apiKeyInput.trim() !== "YOUR_API_KEY_HERE") {
      localStorage.setItem("mamosta_custom_api_key", apiKeyInput.trim());
      setCustomApiKey(apiKeyInput.trim());
    } else {
      localStorage.removeItem("mamosta_custom_api_key");
      setCustomApiKey("YOUR_API_KEY_HERE");
    }
    
    setStudentName(nameInput.trim());
    setGrade(gradeInput);
    setStudentLevel(levelInput);
    setIsConfigured(true);

    const levelLabel = levelInput === "beginner" ? "سەرەتا" : levelInput === "intermediate" ? "مامناوەند" : "پێشکەوتوو";

    setMessages([
      {
        id: "welcome-init",
        role: "assistant",
        content: `بەخێرهاتی **${nameInput.trim()}** گیان بۆ لای **مامۆستای تایبەت 🤖📚**!
        
پڕۆفایلەکەت بە سەرکەوتوویی جێگیرکرا: پۆلی **${gradeInput}** • ئاستی **${levelLabel}**.

من ئامادەم بۆ هەر پرسیار و تێگەیشتنێکی قووڵ لە بابەتەکانی زانست و زمان. بابەتێکی دیاریکراو دەستنیشان بکە یان هەر ئێستا پرسیار بکە! ✨`,
        timestamp: new Date()
      }
    ]);
  };

  // Reset profile or switch options
  const handleResetProfile = () => {
    if (confirm("ئایا دڵنیایت دەتەوێت ناوی قوتابی، پۆل، یان ئاستی فێربوون بگۆڕیت؟")) {
      localStorage.removeItem("mamosta_student_name");
      localStorage.removeItem("mamosta_student_grade");
      localStorage.removeItem("mamosta_student_level");
      localStorage.removeItem("mamosta_messages");
      localStorage.removeItem("mamosta_points");
      setStudentName("");
      setGrade("12");
      setStudentLevel("intermediate");
      setPoints(0);
      setIsConfigured(false);
      setNameInput("");
      setMessages([]);
    }
  };

  // Quick Switchers during runtime
  const handleQuickChangeGrade = (newGrade: string) => {
    setGrade(newGrade);
    localStorage.setItem("mamosta_student_grade", newGrade);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `🔔 پۆلەکەت گۆڕدرا بۆ **پۆلی ${newGrade}**. بابەتەکانی لای ڕاست نوێ کرانەوە بۆ تەوەری فەرمی پۆلی ${newGrade}.`,
        timestamp: new Date()
      }
    ]);
  };

  const handleQuickChangeLevel = (newLevel: string) => {
    setStudentLevel(newLevel);
    localStorage.setItem("mamosta_student_level", newLevel);
    const levelLabel = newLevel === "beginner" ? "سەرەتا" : newLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو";
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `🎯 ئاستی فێربوون نوێکرایەوە بۆ [ **${levelLabel}** ]. وەڵام و ڕوونکردنەوەکانی داهاتووم بەپێی ئەم ئاستە دەگونجێنرێن.`,
        timestamp: new Date()
      }
    ]);
  };

  const handleQuickChangeSubject = (subjKey: string) => {
    setActiveSubject(subjKey);
    setSelectedExerciseId(null);
    const subjName = SUBJECT_METADATA[subjKey]?.label || subjKey;
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `📚 ئێستا سەرنجمان لەسەر بابەتی **[ ${subjName} ]** دەبێت. فەرموو پرسیار لەسەر هەر بابەتێک بکە یان بەشی لای ڕاست بەکار بهێنە!`,
        timestamp: new Date()
      }
    ]);
    if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  // Save customized API key from Settings menu
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("mamosta_custom_api_key", apiKeyInput.trim());
    setCustomApiKey(apiKeyInput.trim());
    setIsSettingsOpen(false);
    alert("کلیلەکە بە سەرکەوتوویی پاشەکەوت کرا! ئێستا چات بە کلیلە تایبەتەکەت ئەنجام دەدرێت.");
  };

  const handleClearApiKey = () => {
    localStorage.removeItem("mamosta_custom_api_key");
    setCustomApiKey("");
    setApiKeyInput("");
    setIsSettingsOpen(false);
    alert("کلیلەکەت سڕایەوە. چاتەکە گەڕایەوە سەر سیستەمی سێرڤەری زیرەکی پارێزراو.");
  };

  // Send message to Mamosta
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date()
    };

    // Update messages state synchronously
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    if (!textToSend) setInputValue("");
    setIsLoading(true);

    // Increment subject stats
    incrementSubjectStat(activeSubject);

    // Award 5 points for asking a question / participating
    addPoints(5, "بۆ پرسیارکردن و چالاکبوونت لە پۆلدا 📝");

    try {
      const subjectLabel = SUBJECT_METADATA[activeSubject]?.label || "گشتی";
      const levelLabel = studentLevel === "beginner" ? "سەرەتا" : studentLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو";
      
      // Format the prompt text exactly as requested: "لە بابەتی {بابەت} بۆ پۆلی {پۆل}: {پرسیاری بەکارهێنەر}"
      const formattedText = `لە بابەتی ${subjectLabel} بۆ پۆلی ${grade}: ${text}`;

      // Construct payload with the last user message mapped to the formatted prompt
      const payload = {
        messages: nextMessages.map((m, index) => {
          if (index === nextMessages.length - 1 && m.role === "user") {
            return {
              role: m.role,
              content: formattedText
            };
          }
          return {
            role: m.role,
            content: m.content
          };
        }),
        subject: subjectLabel,
        grade: grade,
        studentName: studentName,
        studentLevel: levelLabel,
        isAssessment: isAssessmentMode
      };

      // Set headers. If customApiKey is saved, we send it over in custom header (if it's not the placeholder)
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (customApiKey && customApiKey !== "YOUR_API_KEY_HERE") {
        headers["x-gemini-api-key"] = customApiKey;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("سێرڤەر وەڵامی نەبوو.");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      let responseText = data.text || "مەخابن قوتابی خۆشەویستم، نەمتوانی وەڵامەکەت بدەمەوە. تکایە دووبارە هەوڵ بدەرەوە.";
      
      // Parse level evaluation result if present in response
      const levelRegex = /\[LEVEL_RESULT:\s*(beginner|intermediate|advanced)\]/i;
      const match = responseText.match(levelRegex);
      if (match) {
        const detectedLevel = match[1].toLowerCase();
        setStudentLevel(detectedLevel);
        localStorage.setItem("mamosta_student_level", detectedLevel);
        
        // Disable assessment mode
        setIsAssessmentMode(false);
        localStorage.removeItem("mamosta_is_assessment_mode");
        
        // Clean the special tag from the response so the user doesn't see raw code
        responseText = responseText.replace(levelRegex, "").trim();
        
        // Append a beautiful congratulations message
        responseText += `\n\n🎉 **پیرۆزە! هەڵسەنگاندنەکە تەواو بوو. ئاستی فێربوونت بە سەرکەوتوویی نوێکرایەوە بۆ: [ ${detectedLevel === "beginner" ? "سەرەتا" : detectedLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو"} ]**`;

        // Award 25 points for completing assessment
        setTimeout(() => {
          addPoints(25, "بۆ تەواوکردنی هەڵسەنگاندنی ئاست 🏆");
        }, 800);
      } else {
        // Check for correct answer keywords
        if (isCorrectAnswerFeedback(responseText)) {
          setTimeout(() => {
            addPoints(10, "بۆ وەڵامی دروست بۆ پرسیاری مامۆستا 🌟");
          }, 800);
        }
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responseText,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `داوای لێبوردن دەکەم قوتابی ئازیزم ${studentName}، کێشەیەک لە پەیوەندیکردن بە ژیری دەستکرد (Gemini API) دروستبوو. تکایە دڵنیابەرەوە لە هێڵی ئینتەرنێتەکەت یان ڕاستی کلیلی API تایبەتەکەت ئەگەر داتناوە، پاشان دووبارە تاقی بکەرەوە. ❤️`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle click on pre-made topic
  const handleSelectTopic = (title: string) => {
    const subjectLabel = SUBJECT_METADATA[activeSubject]?.label || "بیرکاری";
    const promptText = `مامۆستای ئازیز، دەمەوێت بابەتی "${title}" لە وانەی ${subjectLabel} بە تەواوی فێرببم. تکایە بەپێی ڕێساکەت تیۆری، شیکار، نموونەی ژیان و پاشان ڕاهێنانم بۆ بنووسە.`;
    handleSendMessage(promptText);
    if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  // Handle click on pre-made exercise
  const handleSelectExercise = (exercise: any) => {
    setSelectedExerciseId(exercise.id);
    const subjectLabel = SUBJECT_METADATA[activeSubject]?.label || "بیرکاری";
    const promptText = `مامۆستای تایبەتم، من دەمەوێت ئەم ڕاهێنانە لەگەڵ تۆ شیکار بکەم:\n\n**${exercise.title}**\n${exercise.question}\n\nتکایە یارمەتیم بدە بە شێوازە نایابەکەت شیکاری بکەین!`;
    handleSendMessage(promptText);
    if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  // Send feedback of a pre-made question
  const handleSendPredefinedAnswer = (exercise: any) => {
    const promptText = `مامۆستا من وای دەبینم وەڵامی پرسیاری "${exercise.title}" بریتییە لە: [ ${exercise.suggestedAnswer} ]. ئایا ئەمە دروستە؟`;
    handleSendMessage(promptText);
    if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  // Get active subject curriculum
  const activeSubjectData = CURRICULUM_DATA[grade]?.[activeSubject] || { topics: [], exercises: [] };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-100 flex flex-col" dir="rtl" id="root-viewport">
      
      {/* 1. WELCOME PROFILE INITIAL SETUP */}
      {!isConfigured ? (
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900">
          <div id="setup-card" className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 md:p-10 relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 left-0 h-3 bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400" />
            
            <div className="text-center mb-8 mt-4">
              <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4 animate-bounce">
                <Brain className="w-12 h-12" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">مامۆستای تایبەت 🤖📚</h1>
              <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                بەخێربێیت بۆ هاوڕێی زیرەک و پێشکەوتووی خوێندکارانی نایاب. لێرە زانست و زمان بە چێژەوە فێرببە.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">ناوی تەواوت:</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="بۆ نموونە: ئاران، ڤان، هێلین"
                    className="w-full pr-11 pl-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 font-medium text-sm transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">پۆلی خوێندن:</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["9", "10", "11", "12"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGradeInput(g)}
                        className={`py-3 px-1 rounded-xl border text-xs font-black transition-all ${
                          gradeInput === g
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        پۆلی {g === "9" ? "٩" : g === "10" ? "١٠" : g === "11" ? "١١" : "١٢"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">ئاستی ئێستات لە زانستدا:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: "beginner", label: "سەرەتا" },
                      { key: "intermediate", label: "مامناوەند" },
                      { key: "advanced", label: "پێشکەوتوو" }
                    ].map((lvl) => (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => setLevelInput(lvl.key)}
                        className={`py-3 px-1 rounded-xl border text-xs font-bold transition-all ${
                          levelInput === lvl.key
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gemini API Key input field requested in instructions */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>کلیلی Gemini API (ئارەزوومەندانە):</span>
                  <span className="text-[10px] text-blue-600 font-medium">پەسەندترە بۆ سەربەخۆیی تەواو</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="کلیلی AI تایبەت بە خۆت لێرە بنووسە (یاخود بەتاڵی جێبهێڵە)"
                    className="w-full pr-10 pl-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 text-xs font-mono transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  ئەگەر ئەم بەشە بەتاڵ جێبهێڵیت، سیستەمی "مامۆستای تایبەت" بە شێوەیەکی خۆکار سێرڤەری گشتی و پارێزراوی کۆمپانیا بەکاردەهێنێت.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-blue-600/20 transition duration-150 transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              >
                <GraduationCap className="w-5 h-5" />
                دەستپێکردنی وانەکە و فێربوون
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400">
                سیستەمی فەرمی خوێندنی وەزارەتی پەروەردە • پۆلی 9 تا 12 زانستی و وێژەیی
              </p>
            </div>
          </div>
        </div>
      ) : (
        
        // 2. MAIN APPLICATION WORKSPACE
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          
          {/* Header Area */}
          <header className="bg-white border-b border-slate-200/80 px-4 py-3.5 flex items-center justify-between shrink-0 shadow-sm relative z-30">
            {/* Right Side: Title and Logo */}
            <div className="flex items-center gap-3">
              {/* Mobile Sidebar Trigger */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition"
                title="تەواوی بابەتەکان"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Brain className="w-5 h-5" />
              </div>
              
              <div>
                <h1 className="text-lg font-black text-slate-900 flex items-center gap-1.5 leading-none">
                  <span>مامۆستای تایبەت</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">زیرەک 🤖</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">پلاتفۆرمی هاوچەرخی فێربوونی وەزارەتی پەروەردە</p>
              </div>
            </div>

            {/* Middle Section: Active Information */}
            <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-1.5 text-xs text-slate-600">
              <span className="font-bold text-blue-700">ئامۆژگاری ڕۆژ:</span>
              <span className="italic max-w-md truncate font-medium">{currentQuote}</span>
              <button
                onClick={() => {
                  const randomQuote = ADVICE_QUOTES[Math.floor(Math.random() * ADVICE_QUOTES.length)];
                  setCurrentQuote(randomQuote);
                }}
                className="text-slate-400 hover:text-blue-600 transition p-0.5"
                title="نوێکردنەوە"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Left Side: Student Controls */}
            <div className="flex items-center gap-3">
              <div className="text-right flex flex-col items-end">
                <div className="text-xs font-black text-slate-900 leading-tight flex items-center gap-1.5 justify-end">
                  <span>{studentName}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-black border border-amber-200">
                    {getRankByPoints(points).title}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5 justify-end">
                  <span>پۆلی {grade === "9" ? "٩" : grade === "10" ? "١٠" : grade === "11" ? "١١" : "١٢"}</span>
                  <span>•</span>
                  <span>ئاستی {studentLevel === "beginner" ? "سەرەتا" : studentLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو"}</span>
                  <span>•</span>
                  <span className="text-amber-600 font-black">{points} خاڵ</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-24 md:w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-200/50 relative" title={`پێشکەوتن بەرەو پلەی داهاتوو: ${Math.round(getProgressPercent())}%`}>
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercent()}%` }}
                  />
                </div>
              </div>

              {/* Parent Report Button */}
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl transition text-xs font-bold shadow-sm"
                title="ڕاپۆرتی دایک و باوک"
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span>ڕاپۆرتی من 📊</span>
              </button>

              {/* New Evaluation Button */}
              <button
                onClick={() => handleStartAssessment()}
                className="flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-xl text-blue-700 hover:text-blue-800 transition text-xs font-bold shadow-sm"
                title="تاقیکردنەوەی ئاستی نوێ"
              >
                <Award className="w-4 h-4 shrink-0 text-blue-600 animate-pulse" />
                <span className="hidden sm:inline">هەڵسەنگاندنی نوێ</span>
              </button>

              {/* Settings Trigger */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 transition"
                title="ڕێکخستنەکان"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Logout/Reset Trigger */}
              <button
                onClick={handleResetProfile}
                className="p-2.5 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl text-slate-600 hover:text-red-600 transition"
                title="گۆڕینی ناو"
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Core App Body (Sidebar + Chat Container) */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* DESKTOP SIDEBAR: Subjects and Curriculum Selector */}
            <aside className="hidden md:flex w-80 bg-white border-l border-slate-200 flex-col shrink-0 overflow-hidden">
              {/* Quick Select Panel */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-4">
                
                {/* 1. Grade Selectors */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">دیاریکردنی پۆل:</h3>
                  <div className="grid grid-cols-4 gap-1">
                    {["9", "10", "11", "12"].map((g) => (
                      <button
                        key={g}
                        onClick={() => handleQuickChangeGrade(g)}
                        className={`py-1.5 px-0.5 rounded-lg text-[11px] font-black transition-all ${
                          grade === g
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        پۆلی {g === "9" ? "٩" : g === "10" ? "١٠" : g === "11" ? "١١" : "١٢"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Student Level Selectors */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">ئاستی فێربوونی قوتابی:</h3>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { key: "beginner", label: "سەرەتا" },
                      { key: "intermediate", label: "مامناوەند" },
                      { key: "advanced", label: "پێشکەوتوو" }
                    ].map((lvl) => (
                      <button
                        key={lvl.key}
                        onClick={() => handleQuickChangeLevel(lvl.key)}
                        className={`py-1.5 px-0.5 rounded-lg text-[10px] font-black transition-all ${
                          studentLevel === lvl.key
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Subject Selectors */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">بابەتەکانی خوێندن:</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(SUBJECT_METADATA).map(([key, meta]) => {
                      const isActive = activeSubject === key;
                      return (
                        <button
                          key={key}
                          onClick={() => handleQuickChangeSubject(key)}
                          className={`flex items-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-right ${
                            isActive
                              ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Scrollable Curriculum and Questions */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Curriculum Topics */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-blue-800">
                    <BookOpen className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">تەوەرە فەرمییەکان</h4>
                  </div>

                  {activeSubjectData.topics.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">بۆ ئەم پۆلە هیچ زانیارییەک دیارینەکراوە.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeSubjectData.topics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => handleSelectTopic(topic.title)}
                          className="w-full text-right p-3 rounded-xl border border-slate-200/60 hover:border-blue-300 bg-white hover:bg-blue-50/20 cursor-pointer transition-all block group"
                        >
                          <h5 className="text-xs font-extrabold text-slate-800 group-hover:text-blue-700 transition">
                            {topic.title}
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-1 leading-normal truncate">
                            {topic.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Practical Exercises */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-blue-800">
                    <BookOpenCheck className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider font-sans">ڕاهێنانی کلیل و نموونە</h4>
                  </div>

                  {activeSubjectData.exercises.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">ڕاهێنان نەکراوەتەوە بۆ ئەم پۆلە.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {activeSubjectData.exercises.map((ex) => {
                        const isSelected = selectedExerciseId === ex.id;
                        return (
                          <div
                            key={ex.id}
                            className={`p-3 rounded-xl border transition-all ${
                              isSelected
                                ? "bg-blue-50/40 border-blue-400 shadow-sm"
                                : "bg-white border-slate-200/80 hover:border-slate-300"
                            }`}
                          >
                            <h5 className="text-xs font-bold text-slate-800">{ex.title}</h5>
                            <div className="bg-slate-50 p-2 rounded-lg text-[10px] font-mono text-slate-600 border border-slate-200/50 my-2 whitespace-pre-wrap leading-relaxed">
                              {ex.question}
                            </div>
                            
                            <div className="mt-2.5 flex justify-end gap-1.5">
                              <button
                                onClick={() => handleSelectExercise(ex)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition"
                              >
                                شیکارکردن
                              </button>
                              
                              <button
                                onClick={() => handleSendPredefinedAnswer(ex)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium rounded-lg transition"
                              >
                                پێشکەشکردنی وەڵام
                              </button>
                            </div>

                            <details className="mt-2 border-t border-slate-100 pt-1.5">
                              <summary className="text-[9px] font-bold text-blue-600 cursor-pointer select-none">
                                بینینی ڕێنمایی (یارمەتیدەر)
                              </summary>
                              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed bg-slate-50 p-2 rounded-lg">
                                {ex.hint}
                              </p>
                            </details>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </aside>

            {/* MAIN PORTAL AREA: Active Chat window */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-slate-50/70 to-slate-100 relative z-10">
              
              {/* Educational Subtitle Status */}
              <div className="bg-blue-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>مەیدانی فێربوونی: <strong className="font-extrabold">{SUBJECT_METADATA[activeSubject]?.label}</strong></span>
                  <span className="opacity-75">•</span>
                  <span>پۆلی: <strong className="font-extrabold">{grade}</strong></span>
                  <span className="opacity-75">•</span>
                  <span>ئاستی: <strong className="font-extrabold">{studentLevel === "beginner" ? "سەرەتا" : studentLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو"}</strong></span>
                </div>
                
                {customApiKey && (
                  <span className="bg-blue-500/80 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold border border-blue-400">
                    کلیلی تایبەت چالاکە 🔑
                  </span>
                )}
              </div>

              {/* Chat Message Scroll Panel */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.map((msg) => {
                  const isAssistant = msg.role === "assistant";
                  return (
                    <div key={msg.id} className="space-y-3">
                      <div
                        className={`flex gap-3.5 max-w-4xl ${
                          isAssistant ? "mr-0 ml-auto" : "mr-auto ml-0 flex-row-reverse"
                        }`}
                      >
                        {/* Avatar container */}
                        <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-xs shadow-sm ${
                          isAssistant
                            ? "bg-blue-600 text-white ring-4 ring-blue-50 border border-blue-400"
                            : "bg-slate-800 text-white ring-4 ring-slate-100 border border-slate-700"
                        }`}>
                          {isAssistant ? "م" : studentName.substring(0, 2)}
                        </div>

                        {/* Chat text box */}
                        <div className="space-y-1 max-w-[85%]">
                          <div className={`text-[10px] font-bold text-slate-400 flex items-center gap-1.5 ${
                            isAssistant ? "justify-start" : "justify-end"
                          }`}>
                            <span>{isAssistant ? "مامۆستای تایبەت 🤖📚" : studentName}</span>
                            <span className="font-normal opacity-85">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className={`px-4.5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                            isAssistant
                              ? "bg-white text-slate-800 border border-slate-200/80 rounded-tr-none"
                              : "bg-blue-600 text-white rounded-tl-none font-medium"
                          }`}>
                            {/* Markdown renderer for Kurdish headers */}
                            {msg.content.split("\n").map((line, idx) => {
                              if (line.startsWith("### ")) {
                                return <h4 key={idx} className="font-extrabold text-blue-900 mt-4 mb-1.5 first:mt-1">{line.replace("### ", "")}</h4>;
                              }
                              if (line.startsWith("## ")) {
                                return <h3 key={idx} className="font-black text-base text-blue-900 mt-5 mb-2 first:mt-1 border-b pb-1 border-slate-100">{line.replace("## ", "")}</h3>;
                              }
                              if (line.startsWith("- ") || line.startsWith("* ")) {
                                return <li key={idx} className="list-disc list-inside mr-2 text-slate-700 my-1 font-normal leading-relaxed">{line.substring(2)}</li>;
                              }
                              
                              const parts = line.split(/\*\*(.*?)\*\*/g);
                              return (
                                <p key={idx} className="mb-2 last:mb-0">
                                  {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className={isAssistant ? "text-blue-700 font-extrabold" : "text-blue-100 font-black"}>{part}</strong> : part)}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {msg.isAssessmentPrompt && (
                        <div className="flex gap-2 justify-start mr-12 ml-4">
                          <button
                            onClick={() => handleStartAssessment(true)}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/10 transition-all flex items-center gap-1.5"
                          >
                            <Award className="w-4.5 h-4.5" />
                            بەڵێ، دەست پێ بکە
                          </button>
                          <button
                            onClick={() => handleDeclineAssessment(msg.id)}
                            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
                          >
                            دواتر دەکەم
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading State Bubble */}
                {isLoading && (
                  <div className="flex gap-3.5 max-w-lg mr-0 ml-auto">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white shrink-0 flex items-center justify-center font-bold text-xs animate-bounce border border-blue-400">
                      م
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400">مامۆستای تایبەت 🤖📚</div>
                      <div className="bg-white border border-slate-200/80 shadow-sm px-4.5 py-3 rounded-2xl rounded-tr-none flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        <span className="text-[11px] text-slate-400 mr-2 font-medium">مامۆستا خەریکی شیکارکردنە...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Quick Buttons */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/80 overflow-x-auto flex gap-1.5 shrink-0 select-none">
                <button
                  onClick={() => handleSendMessage("مامۆستا دەتوانیت فۆرمولە و هاوکێشەکەم بە کوردی زیاتر ڕوون بکەیتەوە؟")}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 text-slate-600 hover:text-blue-600 rounded-full text-xs font-bold shrink-0 transition"
                >
                  📝 ڕوونکردنەوەی فۆرمولەکە
                </button>
                <button
                  onClick={() => handleSendMessage("ئەتوانیت یەک نموونەی تاقیگەیی یان کارپێکراوم بۆ بهێنیتەوە بۆ تێگەیشتن؟")}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 text-slate-600 hover:text-blue-600 rounded-full text-xs font-bold shrink-0 transition"
                >
                  💡 نموونەی ژیانی ڕۆژانە
                </button>
                <button
                  onClick={() => handleSendMessage("من کەمێک لەم بابەتە دەترسم، چۆن زووتر فێری ببم مامۆستا؟")}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 text-slate-600 hover:text-blue-600 rounded-full text-xs font-bold shrink-0 transition"
                >
                  💖 ئامۆژگاری دەروونی و هاندان
                </button>
                <button
                  onClick={() => handleSendMessage("زۆر سوپاس بۆ ڕوونکردنەوەی جوان، ئێستا بە تەواوی ئامادەم بۆ پرسیارەکەی کۆتایی!")}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 text-slate-600 hover:text-blue-600 rounded-full text-xs font-bold shrink-0 transition"
                >
                  👍 وەڵامدانەوەی ڕاهێنانەکە
                </button>
              </div>

              {/* Bottom Send Action Bar */}
              <div className="p-4 bg-white border-t border-slate-200/80 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`پرسیار لەسەر بابەت بنووسە بۆ مامۆستا...`}
                    className="flex-1 px-4 py-3.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 text-sm font-medium transition"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-2xl shadow-md font-bold text-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>ناردن</span>
                    <Send className="w-4 h-4 rotate-180" />
                  </button>
                </form>
                
                <div className="text-[10px] text-slate-400 text-center mt-2.5 font-medium">
                  دیوانی فەرمی خوێندنی گشتی و زمان • پەروەردەی سەردەم • بە بێ بەرامبەر و زیرەک
                </div>
              </div>

            </main>

          </div>

          {/* 3. SETTINGS MODAL (Gemini API Configuration) */}
          {isSettingsOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Settings className="w-5 h-5" />
                    <h3 className="font-extrabold text-sm">ڕێکخستنی کلیلی زیرەکی (Gemini API Key)</h3>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-xl leading-relaxed flex gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      ئەم پلاتفۆرمە بە خۆڕایی و بە شێوازێکی پارێزراو بەستراوەتەوە بە سێرڤەری گشتی. بەڵام ئەگەر دەتەوێت بۆ پێشخستن کلیلی خۆت بەکاربهێنیت، لە خوارەوە بینوسە. کلیلەکەت تەنها لەناو وێبگەڕەکەتدا پاشەکەوت دەبێت.
                    </div>
                  </div>

                  <form onSubmit={handleSaveApiKey} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">کلیلی Gemini API:</label>
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder={customApiKey ? "••••••••••••••••••••••••••••" : "کلیلەکە لێرە لکێنە (AI_...) ..."}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-2xl text-xs font-mono"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      {customApiKey && (
                        <button
                          type="button"
                          onClick={handleClearApiKey}
                          className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition"
                        >
                          سڕینەوەی کلیلەکە
                        </button>
                      )}
                      
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        پاشەکەوتکردن
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 4. MOBILE SIDEBAR DRAWER (Sliding subject select) */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-40 flex md:hidden animate-fade-in">
              {/* Overlay Backdrop */}
              <div 
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" 
                onClick={() => setIsMobileSidebarOpen(false)}
              />

              {/* Drawer Container */}
              <div className="relative flex flex-col w-4/5 max-w-sm h-full bg-white shadow-2xl z-50 animate-slide-left-rtl">
                
                {/* Header inside drawer */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <span className="font-extrabold text-slate-800 text-xs">ڕێکخستنەکان و بابەتەکان</span>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content with Scroll */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  
                  {/* Select Grade */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 mb-2 uppercase">دیاریکردنی پۆل:</h4>
                    <div className="grid grid-cols-4 gap-1">
                      {["9", "10", "11", "12"].map((g) => (
                        <button
                          key={g}
                          onClick={() => {
                            handleQuickChangeGrade(g);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`py-2 rounded-lg text-xs font-black transition-all ${
                            grade === g
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          پۆلی {g === "9" ? "٩" : g === "10" ? "١٠" : g === "11" ? "١١" : "١٢"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Student Level */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 mb-2 uppercase">ئاستی فێربوونی تۆ:</h4>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { key: "beginner", label: "سەرەتا" },
                        { key: "intermediate", label: "مامناوەند" },
                        { key: "advanced", label: "پێشکەوتوو" }
                      ].map((lvl) => (
                        <button
                          key={lvl.key}
                          onClick={() => {
                            handleQuickChangeLevel(lvl.key);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`py-2 rounded-lg text-xs font-black transition-all ${
                            studentLevel === lvl.key
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subjects selection */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 mb-2 uppercase">بابەتەکانی خوێندن:</h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {Object.entries(SUBJECT_METADATA).map(([key, meta]) => {
                        const isActive = activeSubject === key;
                        return (
                          <button
                            key={key}
                            onClick={() => handleQuickChangeSubject(key)}
                            className={`flex items-center gap-3 py-3 px-4 rounded-xl border text-sm font-bold transition-all text-right ${
                              isActive
                                ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            <span>{meta.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Topics List on Mobile */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-black text-blue-800 mb-2.5 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>تەوەرە فەرمییەکان</span>
                    </h4>
                    <div className="space-y-1.5">
                      {activeSubjectData.topics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => handleSelectTopic(topic.title)}
                          className="w-full text-right p-3 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/20 block"
                        >
                          <h5 className="text-xs font-bold text-slate-800">{topic.title}</h5>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{topic.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Level Up Modal / Popup Alert */}
      {showLevelUpAlert && showLevelUpAlert.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-3xl border border-amber-200/50 shadow-2xl p-8 max-w-md w-full text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl" />
            
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-amber-500/30 border border-amber-300 relative z-10 animate-bounce">
              <Award className="w-10 h-10" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <h3 className="text-xl font-black text-slate-900">سەرکەوتن بۆ ئاستی نوێ! 🎉</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                هەوڵەکانت بەرهەمیان هەبوو! تۆ ئێستا لە ئاستێکی بەرزتردایت لەگەڵ مامۆستای تایبەت.
              </p>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex justify-around items-center relative z-10" dir="rtl">
              <div className="text-center">
                <span className="block text-[10px] text-slate-400 font-bold">پلەی پێشوو</span>
                <span className="text-xs font-black text-slate-500">{showLevelUpAlert.oldRank}</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <span className="block text-[10px] text-amber-500 font-black flex items-center gap-0.5 justify-center">
                  <Sparkles className="w-3 h-3 text-amber-500" /> پلەی نوێ
                </span>
                <span className="text-sm font-black text-amber-700">{showLevelUpAlert.newRank}</span>
              </div>
            </div>

            <button
              onClick={() => setShowLevelUpAlert(null)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20 transition duration-300 relative z-10"
            >
              زۆر نایابە، بەردەوام بە! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Floating Points-Earned Toast Indicator */}
      {pointsToast && pointsToast.show && (
        <div className="fixed bottom-24 left-6 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-[999] animate-bounce max-w-sm" dir="rtl">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center font-black text-white text-xs shrink-0 shadow-md shadow-amber-500/20">
            +{pointsToast.amount}
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-amber-400">خاڵ بەدەستهات! 🌟</div>
            <div className="text-[10px] text-slate-300 font-semibold mt-0.5">{pointsToast.reason}</div>
          </div>
        </div>
      )}

      {/* Parents Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] no-print">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body > * {
                display: none !important;
              }
              #printable-report-wrapper {
                display: block !important;
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                color: black !important;
                direction: rtl !important;
                padding: 40px !important;
              }
            }
          `}} />
          
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden relative" dir="rtl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">ڕاپۆرتی فەرمی دایک و باوک 📊</h3>
                  <p className="text-[10px] text-slate-400 font-bold">بۆ چاودێریکردنی ئاست و پێشکەوتنی قوتابی لە ماڵەوە</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                title="داخستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" id="printable-report">
              
              {/* Report Official Banner */}
              <div className="border-2 border-emerald-500/20 bg-emerald-50/30 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-emerald-100">
                  <div className="space-y-1">
                    <div className="text-[10px] text-emerald-700 font-extrabold tracking-wider uppercase">حکومەتی هەرێمی کوردستان • وەزارەتی پەروەردە</div>
                    <div className="text-base font-black text-slate-900">ڕاپۆرتی فێربوونی زیرەک (دایک و باوک)</div>
                    <div className="text-[10px] text-slate-400 font-bold">پلاتفۆرمی نیشتمانی "مامۆستای تایبەت"</div>
                  </div>
                  <div className="text-left">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200/50">
                      سیستەمی فەرمی 🌟
                    </span>
                  </div>
                </div>

                {/* Student Info Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
                  <div className="bg-white/65 p-2.5 rounded-xl border border-slate-100/85">
                    <span className="block text-[10px] text-slate-400 mb-0.5">ناوی قوتابی:</span>
                    <span className="text-slate-900 font-black">{studentName}</span>
                  </div>
                  <div className="bg-white/65 p-2.5 rounded-xl border border-slate-100/85">
                    <span className="block text-[10px] text-slate-400 mb-0.5">پۆل و خوێندن:</span>
                    <span className="text-slate-900 font-black">پۆلی {grade === "9" ? "٩" : grade === "10" ? "١٠" : grade === "11" ? "١١" : "١٢"} زانستی</span>
                  </div>
                  <div className="bg-white/65 p-2.5 rounded-xl border border-slate-100/85">
                    <span className="block text-[10px] text-slate-400 mb-0.5">ئاستی ئێستا:</span>
                    <span className="text-emerald-700 font-black">
                      {studentLevel === "beginner" ? "سەرەتا" : studentLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistical KPI Grid */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">📊 ئامار و دەستکەوتەکانی ئەم هەفتەیە:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* KPI 1 */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-extrabold">کۆی پرسیارەکان</span>
                      <span className="text-xs font-black text-slate-800">{messages.filter(m => m.role === "user").length} پرسیار</span>
                    </div>
                  </div>

                  {/* KPI 2 */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-extrabold">کاتی خوێندن (خەمڵێنراو)</span>
                      <span className="text-xs font-black text-slate-800">
                        {messages.filter(m => m.role === "user").length * 4 + 10} خولەک
                      </span>
                    </div>
                  </div>

                  {/* KPI 3 */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-extrabold">بابەتی زۆرترین پرسیار</span>
                      <span className="text-xs font-black text-slate-800">{getMostActiveSubject()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-amber-800">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>خاڵە بەدەستهاتووەکانی هاندان:</span>
                  </div>
                  <span className="font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">{points} خاڵ</span>
                </div>
              </div>

              {/* AI Recommendations Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">🧠 پێشنیار و ڕاسپاردەکانی مامۆستای زیرەک:</h4>
                
                {isGeneratingReport ? (
                  <div className="border border-slate-200 rounded-2xl p-8 text-center space-y-4 bg-slate-50/50">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-800">لە کاتی شیکارکردنی کارامەییەکانی قوتابی...</p>
                      <p className="text-[10px] text-slate-400 font-semibold">ژیری دەستکرد خەریکی ئامادەکردنی ڕاپۆرتێکی گونجاوە بۆ دایک و باوک.</p>
                    </div>
                  </div>
                ) : reportError ? (
                  <div className="border border-red-200 bg-red-50/50 rounded-2xl p-5 text-center space-y-3">
                    <p className="text-xs text-red-700 font-bold">{reportError}</p>
                    <button
                      onClick={handleGenerateReport}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      دووبارە هەوڵبدەرەوە 🔄
                    </button>
                  </div>
                ) : (
                  <div className="border border-slate-200/80 rounded-2xl p-5 bg-white text-slate-700 text-xs leading-relaxed space-y-3 shadow-inner overflow-hidden whitespace-pre-wrap font-medium">
                    {reportSuggestions}
                  </div>
                )}
              </div>

              {/* Signature / Date Section */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] text-slate-400 font-bold gap-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>ڕێکەوتی دروستکردنی ڕاپۆرتەکە: {reportGeneratedDate}</span>
                </div>
                <div className="text-left">
                  <span>دیزاین کراوە بۆ خوێندنی مۆدێرنی کوردی ☀️</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setIsReportOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
              >
                داخستن
              </button>
              <button
                onClick={() => window.print()}
                disabled={isGeneratingReport}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>پرینت کردن / پاشەکەوت وەک PDF 🖨️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden layout specifically rendered for print screen */}
      {isReportOpen && (
        <div id="printable-report-wrapper" className="hidden print-only" dir="rtl">
          <div className="max-w-4xl mx-auto space-y-8 bg-white text-black p-8 font-sans">
            {/* Header */}
            <div className="border-b-4 border-emerald-600 pb-5 flex justify-between items-end">
              <div className="space-y-1">
                <div className="text-sm text-emerald-800 font-black">کۆماری عێراق • حکومەتی هەرێمی کوردستان</div>
                <div className="text-xs text-slate-500 font-bold">وەزارەتی پەروەردە • بەڕێوبەرایەتی گشتی خوێندن</div>
                <h1 className="text-2xl font-black text-slate-900 mt-2">ڕاپۆرتی فەرمی فێربوونی زیرەک (مامۆستای تایبەت)</h1>
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-emerald-700">ڕاپۆرتی دایک و باوک</div>
                <div className="text-[10px] text-slate-400 font-semibold">پلاتفۆرمی پەروەردەیی دیجیتاڵی</div>
              </div>
            </div>

            {/* Profile */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-3 gap-4 text-xs font-bold text-slate-700">
              <div>
                <span className="block text-[10px] text-slate-400 mb-0.5">ناوی قوتابی:</span>
                <span className="text-slate-900 font-black text-sm">{studentName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 mb-0.5">پۆلی خوێندن:</span>
                <span className="text-slate-900 font-black text-sm">پۆلی {grade === "9" ? "٩" : grade === "10" ? "١٠" : grade === "11" ? "١١" : "١٢"} زانستی</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 mb-0.5">ئاستی فێربوونی ئێستا:</span>
                <span className="text-emerald-700 font-black text-sm">
                  {studentLevel === "beginner" ? "سەرەتا" : studentLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو"}
                </span>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-xl p-4 text-center">
                <span className="block text-[10px] text-slate-400 font-bold mb-1">کۆی پرسیارەکان</span>
                <span className="text-base font-black text-slate-800">{messages.filter(m => m.role === "user").length} پرسیار</span>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 text-center">
                <span className="block text-[10px] text-slate-400 font-bold mb-1">کاتی خوێندن (خەمڵێنراو)</span>
                <span className="text-base font-black text-slate-800">{messages.filter(m => m.role === "user").length * 4 + 10} خولەک</span>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 text-center">
                <span className="block text-[10px] text-slate-400 font-bold mb-1">بابەتی چالاک</span>
                <span className="text-base font-black text-slate-800">{getMostActiveSubject()}</span>
              </div>
            </div>

            {/* Score */}
            <div className="border border-amber-200 bg-amber-50/25 rounded-xl p-4 flex justify-between items-center text-xs font-bold text-slate-700">
              <span>خاڵە بەدەستهاتووەکانی هاندان (دەستکەوتی گشتی):</span>
              <span className="text-sm font-black text-amber-700">{points} خاڵ ({getRankByPoints(points).title})</span>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wide">📋 ڕاسپاردەکانی مامۆستای زیرەک بۆ دایک و باوک:</h3>
              <div className="border border-slate-200 rounded-2xl p-6 bg-white text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                {reportSuggestions || "لە کاتی ئامادەکردنی زانیارییەکان..."}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-5 flex justify-between text-[10px] text-slate-400 font-bold">
              <span>ڕێکەوتی دروستکردنی ڕاپۆرتەکە: {reportGeneratedDate}</span>
              <span>ئەم مۆرە فەرمییە و لەلایەن ژیری دەستکردی "مامۆستای تایبەت" پەسەند کراوە</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
