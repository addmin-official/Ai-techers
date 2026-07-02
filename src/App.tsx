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
  Calendar,
  Zap,
  Atom,
  Languages,
  AlertCircle
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
      const levelLabel = studentLevel === "beginner" ? "سەرەتا" : studentLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو";
      
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `سڵاو لە قوتابی زیرەک و بەپەرۆشم، **${studentName}**! زۆر بەخێرهاتی بۆ پۆلی زیرەکی **مامۆستای تایبەت 🤖📚**. 🌟\n\nئێستا تۆ لە پۆلی **${grade}**یت و ئاستی فێربوونت وەک [ **${levelLabel}** ] دەستنیشانکراوە. من لێرەم تا بە شێوازێکی زانستی و هاوچەرخ یارمەتیت بدەم ببیتە یەکەم لە بابەتەکانی **بیرکاری، فیزیا، کیمیا، و ئینگلیزی**.\n\nڕێسا کارپێکراوەکەم زۆر ئاسانە:\n1. ڕوونکردنەوەی تیۆری خێرا پێشکەش دەکەم.\n2. هەنگاو بە هەنگاو شیکاری دەکەین.\n3. نموونەیەکی بەهێزی ژیانی ڕۆژانە باس دەکەین.\n4. لە کۆتاییدا پرسیارێکی ڕاهێنانیت بۆ دادەنێم تا خۆت تاقی بکەیتەوە!\n\nبا پێکەوە فێربوون بکەینە چێژ! 🚀`,
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
      content: `قوتابی خۆشەویستم ${studentName}، بەخێراتی بۆ هەڵسەنگاندنی ئاست لە بابەت و دەرسەکانی **${subjectLabel}** بۆ پۆلی **${grade}**! 📝\n\nمن ٥ پرسیاری کورت و گرنگت ئاڕاستە دەکەم کە لە ئاسانەوە بەرەو قورس دەڕۆن، پاشان ئاستت لە سەرەوە نوێ دەکەینەوە.\n\nتکایە کاتێک ئامادەبوویت، لێرە بنووسە **"ئامادەم"** یان بنووسە **"دەست پێ بکە"** تاوەکو یەکەم پرسیارت بۆ بنێرم!`,
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
        content: `بەخێرهاتی **${nameInput.trim()}** گیان بۆ لای **مامۆستای تایبەت 🤖📚**!\n\nپڕۆفایلەکەت بە سەرکەوتوویی جێگیرکرا: پۆلی **${gradeInput}** • ئاستی **${levelLabel}**.\n\nمن ئامادەم بۆ هەر پرسیار و تێگەیشتنێکی قووڵ لە بابەتەکانی زانست و زمان. بابەتێکی دیاریکراو دەستنیشان بکە یان هەر ئێستا پرسیار بکە! ✨`,
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
      
      const formattedText = `لە بابەتی ${subjectLabel} بۆ پۆلی ${grade}: ${text}`;

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
      
      const levelRegex = /\[LEVEL_RESULT:\s*(beginner|intermediate|advanced)\]/i;
      const match = responseText.match(levelRegex);
      if (match) {
        const detectedLevel = match[1].toLowerCase();
        setStudentLevel(detectedLevel);
        localStorage.setItem("mamosta_student_level", detectedLevel);
        
        setIsAssessmentMode(false);
        localStorage.removeItem("mamosta_is_assessment_mode");
        
        responseText = responseText.replace(levelRegex, "").trim();
        responseText += `\n\n🎉 **پیرۆزە! هەڵسەنگاندنەکە تەواو بوو. ئاستی فێربوونت بە سەرکەوتوویی نوێکرایەوە بۆ: [ ${detectedLevel === "beginner" ? "سەرەتا" : detectedLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو"} ]**`;

        setTimeout(() => {
          addPoints(25, "بۆ تەواوکردنی هەڵسەنگاندنی ئاست 🏆");
        }, 800);
      } else {
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

  const handleSelectTopic = (title: string) => {
    const subjectLabel = SUBJECT_METADATA[activeSubject]?.label || "بیرکاری";
    const promptText = `مامۆستای ئازیز، دەمەوێت بابەتی "${title}" لە وانەی ${subjectLabel} بە تەواوی فێرببم. تکایە بەپێی ڕێساکەت تیۆری، شیکار، نموونەی ژیان و پاشان ڕاهێنانم بۆ بنووسە.`;
    handleSendMessage(promptText);
    if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  const handleSelectExercise = (exercise: any) => {
    setSelectedExerciseId(exercise.id);
    const subjectLabel = SUBJECT_METADATA[activeSubject]?.label || "بیرکاری";
    const promptText = `مامۆستای تایبەتم، من دەمەوێت ئەم ڕاهێنانە لەگەڵ تۆ شیکار بکەم:\n\n**${exercise.title}**\n${exercise.question}\n\nتکایە یارمەتیم بدە بە شێوازە نایابەکەت شیکاری بکەین!`;
    handleSendMessage(promptText);
    if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  const handleSendPredefinedAnswer = (exercise: any) => {
    const promptText = `مامۆستا من وای دەبینم وەڵامی پرسیاری "${exercise.title}" بریتییە لە: [ ${exercise.suggestedAnswer} ]. ئایا ئەمە دروستە؟`;
    handleSendMessage(promptText);
    if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  const activeSubjectData = CURRICULUM_DATA[grade]?.[activeSubject] || { topics: [], exercises: [] };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-100 flex flex-col" dir="rtl" id="root-viewport">
      
      {/* 1. WELCOME PROFILE INITIAL SETUP */}
      {!isConfigured ? (
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-900">
          <div id="setup-card" className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-10 relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500" />
            
            <div className="text-center mb-8 mt-4">
              <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4 shadow-sm border border-blue-100/50">
                <Brain className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">مامۆستای تایبەت 🤖📚</h1>
              <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                سیستەمی فەرمی خوێندنی وەزارەتی پەروەردە • پۆلی ٩ تا ١٢ زانستی
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">ناوی تەواوی قوتابی:</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                    <User className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="بۆ نموونە: ئاران، ڤان، هێلین"
                    className="w-full pr-11 pl-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 font-bold text-sm transition"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">پۆلی خوێندن:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["9", "10", "11", "12"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGradeInput(g)}
                        className={`py-3 rounded-xl border text-xs font-black transition-all duration-200 ${
                          gradeInput === g
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/85"
                        }`}
                      >
                        پۆلی {g === "9" ? "٩" : g === "10" ? "١٠" : g === "11" ? "١١" : "١٢"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">ئاستی ئێستات لە زانستدا:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "beginner", label: "سەرەتا" },
                      { key: "intermediate", label: "مامناوەند" },
                      { key: "advanced", label: "پێشکەوتوو" }
                    ].map((lvl) => (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => setLevelInput(lvl.key)}
                        className={`py-3 rounded-xl border text-xs font-black transition-all duration-200 ${
                          levelInput === lvl.key
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/85"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>کلیلی Gemini API (ئارەزوومەندانە):</span>
                  <span className="text-[10px] text-blue-600 font-bold">بۆ کارکردنی سەربەخۆ 🔑</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                    <Key className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="کلیلی AI تایبەت بە خۆت لێرە بنووسە (یان بەتاڵی جێبهێڵە)"
                    className="w-full pr-11 pl-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-xs font-mono transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-medium">
                  ئەگەر ئەم بەشە بەتاڵ بێت، سیستەمی "مامۆستای تایبەت" بە شێوەیەکی ئۆتۆماتیکی سێرڤەری گشتی پلاتفۆرمەکە بەکاردەهێنێت.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/15 transition-all duration-150 transform active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
              >
                <GraduationCap className="w-5 h-5 shrink-0" />
                <span>دەستپێکردنی پۆلی زیرەک 🚀</span>
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold">
                سیستەمی "مامۆستای تایبەت" یەکەمین ڕێبەری خوێندنی زیرەکە بە زمانی کوردی ☀️
              </p>
            </div>
          </div>
        </div>
      ) : (
        
        // 2. MAIN APPLICATION WORKSPACE
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
          
          {/* Header Area */}
          <header className="bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm relative z-30">
            {/* Right Side: Title and Logo */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-2 bg-blue-50 text-blue-600 hover:bg-blue-100/80 rounded-xl transition-all duration-200 shrink-0"
                title="تەواوی بابەتەکان"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/15 shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
              
              <div>
                <h1 className="text-base font-black text-slate-900 flex items-center gap-1.5 leading-none">
                  <span>مامۆستای تایبەت</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md font-extrabold">زیرەک 🤖📚</span>
                </h1>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5 hidden sm:block">سیستەمی زیرەکی وەزارەتی پەروەردە</p>
              </div>
            </div>

            {/* Middle Section: Student Stats Dashboard */}
            <div className="flex items-center gap-3.5 bg-blue-50/55 border border-blue-100/70 rounded-2xl px-4 py-1.5 text-xs text-slate-700 max-w-sm sm:max-w-md lg:max-w-xl">
              <div className="flex items-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-extrabold text-slate-900">{studentName}</span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="font-bold text-blue-700 hidden xs:inline">{getRankByPoints(points).title}</span>
              <span className="text-slate-300 hidden xs:inline">|</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 rounded-md bg-white border border-blue-100 font-black text-slate-800 text-[10px]">
                  پۆلی {grade === "9" ? "٩" : grade === "10" ? "١٠" : grade === "11" ? "١١" : "١٢"}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-blue-100 font-black text-slate-800 text-[10px] hidden sm:inline">
                  {studentLevel === "beginner" ? "سەرەتا" : studentLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو"}
                </span>
                <span className="font-black text-amber-600 flex items-center gap-0.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>{points} خاڵ</span>
                </span>
              </div>
            </div>

            {/* Left Side: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 text-xs font-black shadow-sm"
                title="ڕاپۆرتی پێشکەوتنی من بۆ دایک و باوک"
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">ڕاپۆرتی من 📊</span>
                <span className="lg:hidden">ڕاپۆرت 📊</span>
              </button>

              <button
                onClick={() => handleStartAssessment()}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 text-xs font-black shadow-sm"
                title="تاقیکردنەوەی ئاستی زانستی"
              >
                <Award className="w-4 h-4 shrink-0 text-white" />
                <span className="hidden lg:inline">هەڵسەنگاندنی نوێ 🏆</span>
                <span className="lg:hidden">تاقیکردنەوە 🏆</span>
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-slate-600 hover:text-blue-600 transition-all duration-200 shrink-0"
                title="کلیلی زیرەکی"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={handleResetProfile}
                className="p-2 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl text-slate-600 hover:text-red-600 transition-all duration-200 shrink-0"
                title="دەستپێکردنەوە لە سەرەتاوە"
              >
                <RotateCcw className="w-4.5 h-4.5" />
              </button>
            </div>
          </header>

          {/* Core App Body (Sidebar + Chat Container) */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* DESKTOP SIDEBAR: Subjects and Curriculum Selector */}
            <aside className="hidden md:flex w-80 bg-white border-l border-slate-200 flex-col shrink-0 overflow-hidden shadow-sm">
              
              {/* Sidebar Header Toggles */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-4 shrink-0">
                
                {/* Grade and Level selectors */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1.5">گۆڕینی خێرای پۆل:</h3>
                    <div className="grid grid-cols-4 gap-1">
                      {["9", "10", "11", "12"].map((g) => (
                        <button
                          key={g}
                          onClick={() => handleQuickChangeGrade(g)}
                          className={`py-1 rounded-lg text-xs font-black transition-all duration-200 ${
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

                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1.5">ئاستی فێربوونی تۆ:</h3>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { key: "beginner", label: "سەرەتا" },
                        { key: "intermediate", label: "مامناوەند" },
                        { key: "advanced", label: "پێشکەوتوو" }
                      ].map((lvl) => (
                        <button
                          key={lvl.key}
                          onClick={() => handleQuickChangeLevel(lvl.key)}
                          className={`py-1 rounded-lg text-[10px] font-black transition-all duration-200 ${
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
                </div>

                {/* Subject Selectors */}
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1.5">بابەتی سەرەکی خوێندن:</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(SUBJECT_METADATA).map(([key, meta]) => {
                      const isActive = activeSubject === key;
                      return (
                        <button
                          key={key}
                          onClick={() => handleQuickChangeSubject(key)}
                          className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-black transition-all duration-200 text-right ${
                            isActive
                              ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-blue-600 animate-pulse" : "bg-slate-300"}`} />
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Scrollable Curriculum and Questions */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                
                {/* Curriculum Topics */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5 text-blue-800">
                    <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">تەوەرە فەرمییەکان</h4>
                  </div>

                  {activeSubjectData.topics.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">بۆ ئەم پۆلە هیچ زانیارییەک دیارینەکراوە.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {activeSubjectData.topics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => handleSelectTopic(topic.title)}
                          className="w-full text-right p-2.5 rounded-xl border border-slate-100 hover:border-blue-300 bg-slate-50/40 hover:bg-blue-50/20 cursor-pointer transition-all duration-200 block group"
                        >
                          <h5 className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition">
                            {topic.title}
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal truncate font-medium">
                            {topic.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Practical Exercises */}
                <div className="pt-2">
                  <div className="flex items-center gap-1.5 mb-2.5 text-blue-800">
                    <BookOpenCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">ڕاهێنانی کلیل و نموونە</h4>
                  </div>

                  {activeSubjectData.exercises.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">ڕاهێنان نەکراوەتەوە بۆ ئەم پۆلە.</p>
                  ) : (
                    <div className="space-y-3">
                      {activeSubjectData.exercises.map((ex) => {
                        const isSelected = selectedExerciseId === ex.id;
                        return (
                          <div
                            key={ex.id}
                            className={`p-2.5 rounded-xl border transition-all duration-200 ${
                              isSelected
                                ? "bg-blue-50/40 border-blue-400 shadow-sm"
                                : "bg-white border-slate-200/70 hover:border-slate-300"
                            }`}
                          >
                            <h5 className="text-xs font-bold text-slate-800">{ex.title}</h5>
                            <div className="bg-slate-50 p-2 rounded-lg text-[10px] font-mono text-slate-600 border border-slate-200/30 my-2 whitespace-pre-wrap leading-relaxed">
                              {ex.question}
                            </div>
                            
                            <div className="mt-2 flex justify-end gap-1">
                              <button
                                onClick={() => handleSelectExercise(ex)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded-lg transition-all duration-150"
                              >
                                شیکارکردن
                              </button>
                              
                              <button
                                onClick={() => handleSendPredefinedAnswer(ex)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-all duration-150"
                              >
                                پێشکەشکردنی وەڵام
                              </button>
                            </div>

                            <details className="mt-2 border-t border-slate-100 pt-1.5">
                              <summary className="text-[9px] font-black text-blue-600 cursor-pointer select-none hover:text-blue-700">
                                بینینی ڕێنمایی (یارمەتیدەر)
                              </summary>
                              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed bg-slate-50 p-2 rounded-lg font-medium">
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
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-white relative z-10">
              
              {/* Responsive Quick Switcher Control Panel for Subject, Grade and Level */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0 shadow-md">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="bg-blue-700 px-2 py-1 rounded-md text-[10px] uppercase font-black tracking-wider border border-blue-500/30">
                    ئێستا لێرەی:
                  </span>
                  <span className="flex items-center gap-1">
                    <span>بابەت:</span>
                    <strong className="font-extrabold text-amber-300">{SUBJECT_METADATA[activeSubject]?.label}</strong>
                  </span>
                  <span className="opacity-60">•</span>
                  <span className="flex items-center gap-1">
                    <span>پۆلی:</span>
                    <strong className="font-extrabold text-amber-300">{grade === "9" ? "٩" : grade === "10" ? "١٠" : grade === "11" ? "١١" : "١٢"}</strong>
                  </span>
                  <span className="opacity-60">•</span>
                  <span className="flex items-center gap-1">
                    <span>ئاستی:</span>
                    <strong className="font-extrabold text-amber-300">
                      {studentLevel === "beginner" ? "سەرەتا" : studentLevel === "intermediate" ? "مامناوەند" : "پێشکەوتوو"}
                    </strong>
                  </span>
                </div>

                {/* Horizontally scrolling Subject picker for mobile dynamically placed in top-bar */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                  {Object.entries(SUBJECT_METADATA).map(([key, meta]) => {
                    const isActive = activeSubject === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleQuickChangeSubject(key)}
                        className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all shrink-0 duration-150 ${
                          isActive 
                            ? "bg-white text-blue-700 shadow-sm font-extrabold border border-white"
                            : "bg-blue-700/60 text-blue-100 hover:bg-blue-700 border border-transparent"
                        }`}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Message Scroll Panel */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-slate-50/50">
                {messages.length === 0 ? (
                  // Nice EMPTY STATE when no messages exist (never occurs normally, but beautiful fallback)
                  <div className="h-full flex items-center justify-center p-6 text-center">
                    <div className="max-w-md bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-black text-slate-800">وانەکەت دەست پێبکە! 🤖</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        تکایە هەر ئێستا پرسیارێکی خۆت لە خوارەوە بنووسە یان یەکێک لە بابەتەکانی لای ڕاست دیاری بکە بۆ دەستپێکردنی گفتوگۆیەکی فێرکاری سەرنجڕاکێش.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAssistant = msg.role === "assistant";
                    return (
                      <div key={msg.id} className="space-y-2">
                        <div
                          className={`flex gap-3 max-w-4xl transition-all duration-300 ${
                            isAssistant ? "mr-0 ml-auto" : "mr-auto ml-0 flex-row-reverse"
                          }`}
                        >
                          {/* Avatar container */}
                          <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-black text-xs shadow-sm transition-all duration-300 ${
                            isAssistant
                              ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white ring-4 ring-blue-50"
                              : "bg-gradient-to-tr from-slate-700 to-slate-950 text-white ring-4 ring-slate-100"
                          }`}>
                            {isAssistant ? "م" : studentName.substring(0, 1)}
                          </div>

                          {/* Chat text box */}
                          <div className="space-y-1 max-w-[85%] md:max-w-[78%]">
                            {/* Author details */}
                            <div className={`text-[10px] font-black text-slate-400 flex items-center gap-1.5 ${
                              isAssistant ? "justify-start" : "justify-end"
                            }`}>
                              <span>{isAssistant ? "مامۆستای تایبەت 🤖📚" : studentName}</span>
                              <span className="font-medium opacity-75">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Message bubble */}
                            <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm font-medium border ${
                              isAssistant
                                ? "bg-white text-slate-800 border-slate-200/60 rounded-tr-none"
                                : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-blue-500/20 rounded-tl-none"
                            }`}>
                              {/* Markdown renderer for Kurdish headers */}
                              {msg.content.split("\n").map((line, idx) => {
                                if (line.startsWith("### ")) {
                                  return (
                                    <h4 key={idx} className={`font-black text-xs md:text-sm mt-3.5 mb-1.5 first:mt-1 ${
                                      isAssistant ? "text-blue-800" : "text-amber-200"
                                    }`}>
                                      {line.replace("### ", "")}
                                    </h4>
                                  );
                                }
                                if (line.startsWith("## ")) {
                                  return (
                                    <h3 key={idx} className={`font-black text-sm md:text-base mt-4 mb-2 first:mt-1 border-b pb-1 ${
                                      isAssistant ? "text-indigo-900 border-slate-100" : "text-amber-100 border-blue-500/30"
                                    }`}>
                                      {line.replace("## ", "")}
                                    </h3>
                                  );
                                }
                                if (line.startsWith("- ") || line.startsWith("* ")) {
                                  return (
                                    <li key={idx} className={`list-disc list-inside mr-2 my-1 leading-relaxed ${
                                      isAssistant ? "text-slate-700" : "text-blue-50"
                                    }`}>
                                      {line.substring(2)}
                                    </li>
                                  );
                                }
                                
                                const parts = line.split(/\*\*(.*?)\*\*/g);
                                return (
                                  <p key={idx} className="mb-1.5 last:mb-0">
                                    {parts.map((part, i) => i % 2 === 1 
                                      ? <strong key={i} className={isAssistant ? "text-blue-700 font-extrabold" : "text-amber-300 font-black"}>{part}</strong> 
                                      : part
                                    )}
                                  </p>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Special Assessment Mode option buttons */}
                        {msg.isAssessmentPrompt && (
                          <div className="flex gap-2 justify-start mr-12 ml-4">
                            <button
                              onClick={() => handleStartAssessment(true)}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/10 transition-all duration-150 flex items-center gap-1"
                            >
                              <Award className="w-4 h-4 shrink-0 text-white" />
                              <span>بەڵێ، دەست پێ بکە</span>
                            </button>
                            <button
                              onClick={() => handleDeclineAssessment(msg.id)}
                              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-xl transition"
                            >
                              دواتر دەکەم
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Loading State Bubble */}
                {isLoading && (
                  <div className="flex gap-3 max-w-lg mr-0 ml-auto">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shrink-0 flex items-center justify-center font-black text-xs animate-pulse shadow-sm">
                      م
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-slate-400">مامۆستای تایبەت 🤖📚</div>
                      <div className="bg-white border border-slate-200/80 shadow-sm px-4 py-3 rounded-2xl rounded-tr-none flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold mr-2">مامۆستا خەریکی داڕشتنی وەڵامەکەیە...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Quick Action Buttons */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 overflow-x-auto flex gap-2 shrink-0 select-none no-scrollbar">
                <button
                  onClick={() => handleSendMessage("مامۆستا دەتوانیت فۆرمولە و هاوکێشەکەم بە کوردی زیاتر ڕوون بکەیتەوە؟")}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 rounded-full text-xs font-black shrink-0 transition"
                >
                  📝 ڕوونکردنەوەی فۆرمولەکە
                </button>
                <button
                  onClick={() => handleSendMessage("ئەتوانیت یەک نموونەی تاقیگەیی یان کارپێکراوم بۆ بهێنیتەوە بۆ تێگەیشتن؟")}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 rounded-full text-xs font-black shrink-0 transition"
                >
                  💡 نموونەی ژیانی ڕۆژانە
                </button>
                <button
                  onClick={() => handleSendMessage("من کەمێک لەم بابەتە دەترسم، چۆن زووتر فێری ببم مامۆستا؟")}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 rounded-full text-xs font-black shrink-0 transition"
                >
                  💖 ئامۆژگاری دەروونی و هاندان
                </button>
                <button
                  onClick={() => handleSendMessage("زۆر سوپاس بۆ ڕوونکردنەوەی جوان، ئێستا بە تەواوی ئامادەم بۆ پرسیارەکەی کۆتایی!")}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 rounded-full text-xs font-black shrink-0 transition"
                >
                  👍 وەڵامدانەوەی ڕاهێنانەکە
                </button>
              </div>

              {/* Bottom Send Action Bar: Fixed above browser elements on mobile */}
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2 items-center"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`پرسیار لەسەر بابەتەکە بنووسە بۆ مامۆستا...`}
                    className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm font-bold transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl shadow-md font-black text-sm transition-all duration-150 flex items-center gap-1 shrink-0"
                  >
                    <span>ناردن</span>
                    <Send className="w-4 h-4 rotate-180" />
                  </button>
                </form>
                
                <div className="text-[9px] text-slate-400 text-center mt-2 font-bold uppercase tracking-wider">
                  دیوانی فەرمی خوێندنی گشتی و زمان • پەروەردەی سەردەم • بە بێ بەرامبەر و زیرەک
                </div>
              </div>

            </main>

          </div>

          {/* 3. SETTINGS MODAL (Gemini API Configuration) */}
          {isSettingsOpen && (
            <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-md z-[999] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Settings className="w-5 h-5" />
                    <h3 className="font-black text-sm">ڕێکخستنی کلیلی زیرەکی (Gemini API Key)</h3>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="p-4 bg-blue-50/60 text-blue-800 text-xs rounded-xl leading-relaxed flex gap-2.5 border border-blue-100">
                    <Info className="w-4.5 h-4.5 shrink-0 text-blue-600 mt-0.5" />
                    <div className="font-medium">
                      ئەم پلاتفۆرمە بە شێوازێکی بێ بەرامبەر بەستراوەتەوە بە سێرڤەری گشتی کۆمپانیا. بەڵام ئەگەر دەتەوێت بۆ پێشخستن کلیلی تایبەتی خۆت بەکاربهێنیت، لێرەدا دەتوانیت جێگیری بکەیت.
                    </div>
                  </div>

                  <form onSubmit={handleSaveApiKey} className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">کلیلی Gemini API تایبەت بە خۆت:</label>
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder={customApiKey && customApiKey !== "YOUR_API_KEY_HERE" ? "••••••••••••••••••••••••••••" : "کلیلەکە لێرە بنووسە (AI_...) ..."}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                      {customApiKey && customApiKey !== "YOUR_API_KEY_HERE" && (
                        <button
                          type="button"
                          onClick={handleClearApiKey}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl text-xs transition"
                        >
                          سڕینەوەی کلیلەکە
                        </button>
                      )}
                      
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition"
                      >
                        پاشەکەوتکردنی کلیل
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 4. MOBILE SIDEBAR DRAWER (Sliding subject select) */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-[999] flex md:hidden">
              {/* Overlay Backdrop */}
              <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" 
                onClick={() => setIsMobileSidebarOpen(false)}
              />

              {/* Drawer Container */}
              <div className="relative flex flex-col w-4/5 max-w-sm h-full bg-white shadow-2xl z-50 animate-slide-left-rtl">
                
                {/* Header inside drawer */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="font-black text-slate-800 text-xs">بابەتەکان و پۆل</span>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content with Scroll */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  
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
                              : "bg-slate-50 border border-slate-200 text-slate-600"
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
                            className={`flex items-center gap-2.5 py-3 px-4 rounded-xl border text-sm font-black transition-all text-right ${
                              isActive
                                ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 animate-pulse" />
                            <span>{meta.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Topics List on Mobile */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-black text-blue-800 mb-2.5 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
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
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
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
                  <Sparkles className="w-3 h-3 text-amber-500 animate-spin" /> پلەی نوێ
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
        <div className="fixed bottom-24 left-6 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-[999] animate-bounce max-w-sm" dir="rtl">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center font-black text-white text-xs shrink-0 shadow-md shadow-amber-500/20">
            +{pointsToast.amount}
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-amber-400">خاڵ بەدەستهات! 🌟</div>
            <div className="text-[10px] text-slate-300 font-bold mt-0.5">{pointsToast.reason}</div>
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
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">ڕاپۆرتی فەرمی دایک و باوک 📊</h3>
                  <p className="text-[10px] text-slate-400 font-bold">چاودێریکردنی ئاست و پێشکەوتنی قوتابی لە ماڵەوە</p>
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
                    <div className="text-[10px] text-emerald-700 font-extrabold tracking-wider uppercase">کۆماری عێراق • حکومەتی هەرێمی کوردستان</div>
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
                      <HelpCircle className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-extrabold">کۆی پرسیارەکان</span>
                      <span className="text-xs font-black text-slate-800">{messages.filter(m => m.role === "user").length} پرسیار</span>
                    </div>
                  </div>

                  {/* KPI 2 */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-amber-700" />
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
                      <BookOpen className="w-5 h-5 text-rose-700" />
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
                      <p className="text-[10px] text-slate-400 font-bold">ژیری دەستکرد خەریکی ئامادەکردنی ڕاپۆرتێکی گونجاوە بۆ دایک و باوک.</p>
                    </div>
                  </div>
                ) : reportError ? (
                  <div className="border border-red-200 bg-red-50/50 rounded-2xl p-5 text-center space-y-3">
                    <p className="text-xs text-red-700 font-bold">{reportError}</p>
                    <button
                      onClick={handleGenerateReport}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition"
                    >
                      دووبارە هەوڵبدەرەوە 🔄
                    </button>
                  </div>
                ) : (
                  <div className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/30 text-slate-800 text-xs leading-relaxed space-y-3 shadow-inner overflow-hidden whitespace-pre-wrap font-bold">
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
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 transition"
              >
                داخستن
              </button>
              <button
                onClick={() => window.print()}
                disabled={isGeneratingReport}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>پرینت کردن / پاشەکەوت وەک PDF 🖨️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden layout specifically rendered for print screen */}
      {isReportOpen && (
        <div id="printable-report-wrapper" className="hidden print-only animate-none" dir="rtl">
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
              <div className="border border-slate-200 rounded-2xl p-6 bg-white text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-bold">
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
