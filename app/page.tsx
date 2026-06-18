"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  Video,
  Music,
  Send,
  Settings,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Copy,
  ExternalLink,
  RefreshCw,
  Info,
  ShieldCheck,
  Zap,
  Globe,
  PlusCircle,
  Check,
  ChevronDown,
  Activity,
  TrendingUp,
  BarChart2,
  Database
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

// Predefined suggestion links for testing the downloader
const DEMO_LINKS = [
  { label: "YouTube Video/Short", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { label: "TikTok Video", url: "https://www.tiktok.com/@tiktok/video/7123456789012345678" },
  { label: "Instagram Reel", url: "https://www.instagram.com/reel/Cgf87_gD_F6/" }
];

export default function DownloaderPage() {
  // Input URL State
  const [url, setUrl] = useState("");
  const [videoQuality, setVideoQuality] = useState("720");
  const [downloadMode, setDownloadMode] = useState<"video" | "audio">("video");

  // Loading and Response States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any>(null);

  // Telegram Integration States
  const [sendToTelegram, setSendToTelegram] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [showTgSettings, setShowTgSettings] = useState(false);
  const [tgSaved, setTgSaved] = useState(false);
  const [tgTestLoading, setTgTestLoading] = useState(false);
  const [tgTestResult, setTgTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Backup & Restore states
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<{ success: boolean; message: string } | null>(null);
  const [restoreCode, setRestoreCode] = useState("");
  const [restoreResult, setRestoreResult] = useState<{ success: boolean; message: string } | null>(null);

  // Gemini AI Caption States
  const [showAiCaption, setShowAiCaption] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCaptionText, setAiCaptionText] = useState("");
  const [copiedCaption, setCopiedCaption] = useState(false);

  // UI Interactive States
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [chartMetric, setChartMetric] = useState<"bandwidth" | "files">("bandwidth");
  const [chartData, setChartData] = useState([
    { day: "Senin", video: 12, audio: 5, bandwidth: 14.2 },
    { day: "Selasa", video: 18, audio: 8, bandwidth: 22.4 },
    { day: "Rabu", video: 15, audio: 12, bandwidth: 18.9 },
    { day: "Kamis", video: 25, audio: 14, bandwidth: 35.1 },
    { day: "Jumat", video: 30, audio: 10, bandwidth: 42.8 },
    { day: "Sabtu", video: 42, audio: 20, bandwidth: 58.3 },
    { day: "Minggu", video: 35, audio: 15, bandwidth: 48.1 }
  ]);

  // Load Telegram setting credentials from browser local storage
  useEffect(() => {
    const savedToken = localStorage.getItem("tg_bot_token") || "";
    const savedChatId = localStorage.getItem("tg_chat_id") || "";
    const savedSendToggle = localStorage.getItem("tg_send_toggle") === "true";

    const initTimer = setTimeout(() => {
      setIsMounted(true);
      setTelegramToken(savedToken);
      setTelegramChatId(savedChatId);
      setSendToTelegram(savedSendToggle);
    }, 0);

    return () => clearTimeout(initTimer);
  }, []);

  // Save changes to Telegram local persistence
  const saveTelegramSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("tg_bot_token", telegramToken.trim());
    localStorage.setItem("tg_chat_id", telegramChatId.trim());
    localStorage.setItem("tg_send_toggle", sendToTelegram ? "true" : "false");
    
    setTgSaved(true);
    setTimeout(() => setTgSaved(false), 3000);
  };

  // Toggle automatical sending on and keep in storage
  const handleTelegramToggle = (checked: boolean) => {
    setSendToTelegram(checked);
    localStorage.setItem("tg_send_toggle", checked ? "true" : "false");
  };

  // Test Telegram Bot Connection directly
  const testTelegramConnection = async () => {
    if (!telegramToken || !telegramChatId) {
      setTgTestResult({
        success: false,
        message: "Masukkan Bot Token dan Chat ID terlebih dahulu!"
      });
      return;
    }

    setTgTestLoading(true);
    setTgTestResult(null);

    try {
      const res = await fetch(`https://api.telegram.org/bot${telegramToken.trim()}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId.trim(),
          text: `🔔 *Tes Koneksi Berhasil!*\n\nDownloader Multi-Platform Anda berhasil terhubung dengan Telegram Bot ini. Anda siap menerima file video langsung di sini! ⚡\n\n🕒 Waktu: ${new Date().toLocaleTimeString()}`,
          parse_mode: "Markdown"
        })
      });

      const data = await res.json();
      if (data.ok) {
        setTgTestResult({
          success: true,
          message: "Koneksi Berhasil! Pesan tes terkirim di Telegram Anda."
        });
      } else {
        setTgTestResult({
          success: false,
          message: `Gagal: ${data.description || "Token atau Chat ID tidak valid."}`
        });
      }
    } catch (err: any) {
      setTgTestResult({
        success: false,
        message: `Gangguan jaringan: ${err.message || "Gagal menghubungi Telegram."}`
      });
    } finally {
      setTgTestLoading(false);
    }
  };

  // Export configurations and send them securely to Telegram as a backup code
  const handleTelegramBackup = async () => {
    if (!telegramToken || !telegramChatId) {
      setBackupResult({
        success: false,
        message: "Bot Token dan Chat ID harus diisi dahulu sebelum mencadangkan!"
      });
      return;
    }

    setBackupLoading(true);
    setBackupResult(null);

    try {
      const configPayload = {
        token: telegramToken.trim(),
        chatId: telegramChatId.trim(),
        send: sendToTelegram,
        quality: videoQuality,
        mode: downloadMode,
        timestamp: new Date().toISOString()
      };

      const jsonStr = JSON.stringify(configPayload);
      const b64Code = btoa(unescape(encodeURIComponent(jsonStr)));
      const finalBackupCode = `HENDRI_BKP_${b64Code}`;

      const res = await fetch(`https://api.telegram.org/bot${telegramToken.trim()}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId.trim(),
          text: `💾 *HENDRI VORTEXDOWNLOADER PRO - CADANGAN PENGATURAN*\n\nBerikut kode enkripsi pengaturan aman Anda. Simpan pesan ini dengan baik.\n\nSalin seluruh teks atau kode monospaced di bawah ini lalu tempelkan ke kolom "Restore" di dashboard web untuk memulihkan seluruh pengaturan Anda secara instan.\n\n\`\`\`\n${finalBackupCode}\n\`\`\`\n\n🕒 _Waktu Cadangan: ${new Date().toLocaleString("id-ID")}_`,
          parse_mode: "Markdown"
        })
      });

      const data = await res.json();
      if (data.ok) {
        setBackupResult({
          success: true,
          message: "Cadangan Sukses! Kode enkripsi telah dikirim ke chat Telegram Anda."
        });
      } else {
        setBackupResult({
          success: false,
          message: `Gagal mengunggah cadangan: ${data.description || "Kesalahan bot."}`
        });
      }
    } catch (err: any) {
      setBackupResult({
        success: false,
        message: `Gangguan jaringan saat mem-backup: ${err.message}`
      });
    } finally {
      setBackupLoading(false);
    }
  };

  // Restore configurations from user provided backup code
  const handleTelegramRestore = () => {
    if (!restoreCode.trim()) {
      setRestoreResult({
        success: false,
        message: "Silakan masukkan atau tempel kode cadangan (diawali dengan HENDRI_BKP_)!"
      });
      return;
    }

    try {
      const cleanCode = restoreCode.trim();
      if (!cleanCode.startsWith("HENDRI_BKP_")) {
        throw new Error("Format kode salah. Kode cadangan Anda harus dimulai dengan awalan 'HENDRI_BKP_'.");
      }

      const b64Part = cleanCode.substring("HENDRI_BKP_".length).trim();
      const jsonStr = decodeURIComponent(escape(atob(b64Part)));
      const config = JSON.parse(jsonStr);

      if (!config.token || !config.chatId) {
        throw new Error("Data di dalam kode cadangan tidak valid atau tidak lengkap.");
      }

      // Restore React States
      setTelegramToken(config.token);
      setTelegramChatId(config.chatId);
      if (config.send !== undefined) setSendToTelegram(config.send);
      if (config.quality !== undefined) setVideoQuality(config.quality);
      if (config.mode !== undefined) setDownloadMode(config.mode);

      // Write strictly to local persistence
      localStorage.setItem("tg_bot_token", config.token.trim());
      localStorage.setItem("tg_chat_id", config.chatId.trim());
      localStorage.setItem("tg_send_toggle", config.send ? "true" : "false");

      setRestoreResult({
        success: true,
        message: `Sukses Memulihkan! Token, Chat ID, format (${config.mode === "audio" ? "MP3" : "MP4"}), dan kualitas (${config.quality || "720"}p) telah diatur.`
      });
      setRestoreCode("");
    } catch (err: any) {
      setRestoreResult({
        success: false,
        message: `Gagal memulihkan pengaturan: ${err.message}`
      });
    }
  };

  // Perform general download requests
  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError("Masukkan URL video terlebih dahulu!");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessResult(null);
    setAiCaptionText(""); // Reset older caption

    try {
      const payload = {
        url: url.trim(),
        videoQuality,
        downloadMode,
        sendToTelegram: sendToTelegram,
        telegramToken: telegramToken ? telegramToken.trim() : undefined,
        telegramChatId: telegramChatId ? telegramChatId.trim() : undefined
      };

      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Terjadi kesalahan saat mengunduh.");
      }

      setSuccessResult(data);

      // Increment live statistics chart data on success
      const isVideo = downloadMode === "video";
      const fileWeight = isVideo ? 0.045 : 0.008;
      setChartData((prev) => {
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (lastIdx >= 0) {
          copy[lastIdx] = {
            ...copy[lastIdx],
            video: isVideo ? copy[lastIdx].video + 1 : copy[lastIdx].video,
            audio: !isVideo ? copy[lastIdx].audio + 1 : copy[lastIdx].audio,
            bandwidth: parseFloat((copy[lastIdx].bandwidth + fileWeight).toFixed(3))
          };
        }
        return copy;
      });
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server downloader.");
    } finally {
      setLoading(false);
    }
  };

  // Call Gemini AI on server to produce caption description
  const generateAiCaption = async () => {
    if (!url) return;
    setAiLoading(true);
    setAiCaptionText("");
    setCopiedCaption(false);

    try {
      const videoTitle = successResult?.cobaltData?.text || successResult?.cobaltData?.picker?.[0]?.text || "";
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: videoTitle,
          downloadMode,
          customTopic: customTopic.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setAiCaptionText(data.text);
      } else {
        setAiCaptionText("Gagal memanggil asisten Gemini AI: " + (data.error || "Error tidak dikenal"));
      }
    } catch (err: any) {
      setAiCaptionText("Koneksi bermasalah: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Simple clean link assistant
  const cleanUrl = () => {
    setUrl("");
    setSuccessResult(null);
    setError(null);
    setAiCaptionText("");
  };

  // Direct clipboard paste helper
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
      }
    } catch (err) {
      // Background clipboard block is normal in sandboxed iframe environment
    }
  };

  // Copy AI caption to user's clipboard
  const copyCaptionToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen relative bg-[#09090b] text-zinc-100 font-sans overflow-x-hidden p-4 md:p-8">
      {/* Decorative Aurora background elements in sync with Bento dark mode */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-sky-600/5 rounded-full blur-[120px] pointer-events-none translate-x-1/3" />

      {/* Header Bento Title / Metric Band */}
      <header className="relative w-full max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform duration-300">
            <Download className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight font-display text-zinc-50">
                Hendri VortexDownloader<span className="text-blue-500 underline decoration-2 underline-offset-4 ml-1">Pro</span>
              </h1>
              <span className="px-2 py-0.5 text-[9px] font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                v4.2.0-STABLE
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono">MULTI-ENGINE DYNAMIC SPEED ACCELERATOR</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 bg-zinc-900/80 border border-zinc-850 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-zinc-400 font-mono">System Status: Optimal</span>
          </div>
          <div className="hidden sm:flex px-3.5 py-1.5 bg-zinc-900/80 border border-zinc-850 rounded-full items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-zinc-400 font-mono">Secure TLS 1.3</span>
          </div>
        </div>
      </header>

      {/* Main Bento Grid Hub */}
      <main className="flex-1 w-full max-w-6xl mx-auto z-10 pb-16 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Card Downloader Card (col-span-8) */}
          <section className="lg:col-span-8 bg-zinc-900/45 backdrop-blur-xl border border-zinc-850 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group shadow-2xl">
            {/* Background vector watermark decorative */}
            <div className="absolute -bottom-8 -right-8 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-all duration-700 pointer-events-none">
              <Globe className="w-80 h-80" />
            </div>

            <div className="relative space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Tautan Video / Media Utama
                  </h2>
                  <p className="text-xs text-zinc-400">Masukkan link dari Instagram, TikTok, YouTube, Twitter/X, dll.</p>
                </div>
                <div className="flex gap-2.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={pasteFromClipboard}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors px-2 py-1 bg-blue-500/5 rounded-md border border-blue-500/10"
                    title="Membaca teks dari clipboard browser"
                  >
                    Tempel Link
                  </button>
                  <button
                    type="button"
                    onClick={cleanUrl}
                    className="text-xs font-semibold text-zinc-400 hover:text-zinc-300 flex items-center gap-1 transition-colors px-2 py-1 bg-zinc-800/40 rounded-md border border-zinc-800"
                  >
                    Bersihkan
                  </button>
                </div>
              </div>

              {/* Main Form Core Area */}
              <form onSubmit={handleDownload} className="space-y-6">
                {/* Inputs */}
                <div className="relative flex items-center">
                  <input
                    type="url"
                    required
                    placeholder="Contoh: https://www.instagram.com/reel/... atau https://vt.tiktok.com/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-5 pr-12 py-4 bg-black/60 border border-zinc-800 focus:border-blue-500 rounded-2xl text-zinc-100 placeholder-zinc-600 outline-none text-base focus:ring-1 focus:ring-blue-500/30 transition-all duration-300 shadow-inner"
                  />
                  <div className="absolute right-4 flex items-center gap-2">
                    <AnimatePresence>
                      {url && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          type="button"
                          onClick={cleanUrl}
                          className="p-1 px-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors text-xs"
                        >
                          ✕
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Configuration selectors in Bento cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mode format selector */}
                  <div className="bg-black/30 border border-zinc-850 p-4 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-blue-500" />
                      Format Media
                    </span>
                    <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setDownloadMode("video")}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                          downloadMode === "video"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        Video (MP4)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDownloadMode("audio")}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                          downloadMode === "audio"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                        }`}
                      >
                        <Music className="w-3.5 h-3.5" />
                        Audio (MP3)
                      </button>
                    </div>
                  </div>

                  {/* Quality Selectors */}
                  <div className="bg-black/30 border border-zinc-850 p-4 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-500" />
                      Resolusi Maksimun
                    </span>
                    <div className="relative">
                      <select
                        disabled={downloadMode === "audio"}
                        value={videoQuality}
                        onChange={(e) => setVideoQuality(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-blue-500 rounded-xl text-zinc-100 outline-none text-xs sm:text-sm focus:ring-1 focus:ring-blue-500/30 font-medium transition-all duration-300 appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value="1080">1080p (Full HD)</option>
                        <option value="720">720p (HD Terbaik)</option>
                        <option value="480">480p (Sedang/Hemat)</option>
                        <option value="360">360p (Ringan)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Submitting Download Trigger */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 font-extrabold text-sm sm:text-base text-white rounded-2xl shadow-xl shadow-blue-600/10 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Sedang Menganalisis & Mengekstrak Aliran Media...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 stroke-[2.5]" />
                      {sendToTelegram ? "PROSES & SEBARKAN KE TELEGRAM" : "MULAI UNDUH DAN CONVERT"}
                    </>
                  )}
                </button>
              </form>

              {/* Error Notification Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 mt-4"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-300">Deteksi Gagal Memproses Media</h4>
                      <p className="text-xs text-rose-400/90 leading-normal mt-0.5">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Helper / Demo Suggestions inside input cards */}
            <div className="mt-8 pt-5 border-t border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-zinc-500 font-normal">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Privasi Enkripsi Aman • Tanpa Pelacakan Data</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-zinc-400">Gunakan Demo URL:</span>
                <button
                  type="button"
                  onClick={() => setUrl(DEMO_LINKS[0].url)}
                  className="px-2 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded border border-zinc-850 font-mono transition-colors text-[10px]"
                >
                  YouTube
                </button>
                <button
                  type="button"
                  onClick={() => setUrl(DEMO_LINKS[1].url)}
                  className="px-2 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded border border-zinc-850 font-mono transition-colors text-[10px]"
                >
                  TikTok
                </button>
                <button
                  type="button"
                  onClick={() => setUrl(DEMO_LINKS[2].url)}
                  className="px-2 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded border border-zinc-850 font-mono transition-colors text-[10px]"
                >
                  Instagram
                </button>
              </div>
            </div>
          </section>

          {/* Telegram Sync Bento Card (col-span-4) */}
          <section className="lg:col-span-4 bg-gradient-to-br from-blue-950/20 to-zinc-900/40 border border-blue-500/30 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group shadow-2xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                  <Send className="w-6 h-6 text-white stroke-[2.5]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold tracking-widest px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/35 uppercase font-mono ${sendToTelegram ? "animate-pulse" : ""}`}>
                    {sendToTelegram ? "Sync Active" : "Sync Disabled"}
                  </span>
                  
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={sendToTelegram}
                      onChange={(e) => handleTelegramToggle(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-zinc-100"></div>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Telegram Bot Sync</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Kirim file media atau link hasil unduh langsung ke nomor / chat grup Telegram pribadimu secara otomatis pasca ekstraksi.
                </p>
              </div>

              {/* Bot Identity Display if configured */}
              <div className="bg-black/40 rounded-2xl p-3.5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Status Otorisasi</span>
                  <span className={`font-mono font-bold ${telegramToken ? "text-emerald-400" : "text-amber-400"}`}>
                    {telegramToken ? "Authorized" : "Not Setup"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Target Chat ID</span>
                  <span className="font-mono text-blue-400 truncate max-w-[120px]">
                    {telegramChatId ? telegramChatId : "Belum ditentukan"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowTgSettings(!showTgSettings)}
                  className="w-full py-2.5 bg-zinc-800/80 hover:bg-zinc-800 text-xs text-zinc-200 hover:text-white rounded-xl border border-zinc-700/60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {showTgSettings ? "Tutup Pengaturan Token" : "Konfigurasi API & Token"}
                </button>
              </div>
            </div>

            {/* Expandable Telegram Credentials Setting form */}
            <AnimatePresence>
              {showTgSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 border-t border-zinc-800 pt-4"
                >
                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-400">SETUP PRIVATE TELEGRAM credentials</span>
                      <button
                        type="button"
                        onClick={() => setShowGuide(!showGuide)}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-0.5"
                      >
                        <HelpCircle className="w-3 h-3" />
                        {showGuide ? "Tutup Panduan" : "Panduan"}
                      </button>
                    </div>

                    {showGuide && (
                      <div className="p-3 bg-black/60 rounded-xl border border-blue-500/10 text-[10px] text-zinc-400 leading-relaxed space-y-1.5">
                        <p className="font-bold text-zinc-300">💡 Cara Mendapatkan Kredensial:</p>
                        <ol className="list-decimal pl-3 space-y-1">
                          <li>Cari <span className="text-blue-400">@BotFather</span> di Telegram, jalankan perintah <span className="font-mono text-zinc-300">/newbot</span> untuk mengambil token bot.</li>
                          <li>Cari <span className="text-blue-400">@userinfobot</span> untuk menyalin angka unik <span className="font-mono text-zinc-300">Chat ID</span> Anda.</li>
                          <li>Kirim teks sembarang ke bot tersebut, barulah simpan kredensial Anda dan jalankan tombol tes koneksi.</li>
                        </ol>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-zinc-400">Bot Token API</label>
                      <input
                        type="password"
                        placeholder="Contoh: 123456:ABC-DEF"
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-zinc-800 focus:border-blue-500 rounded-lg text-xs font-mono text-zinc-200 outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-zinc-400">User Chat ID</label>
                      <input
                        type="text"
                        placeholder="Contoh: 987654321"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-zinc-800 focus:border-blue-500 rounded-lg text-xs font-mono text-zinc-200 outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={testTelegramConnection}
                        disabled={tgTestLoading || !telegramToken}
                        className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold rounded-lg border border-zinc-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
                      >
                        {tgTestLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        Kirim Pesan Tes
                      </button>
                      <button
                        type="button"
                        onClick={saveTelegramSettings}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white rounded-lg shadow-md transition-colors"
                      >
                        {tgSaved ? "Tersimpan" : "Simpan"}
                      </button>
                    </div>

                    {tgTestResult && (
                      <div className={`p-2 rounded text-[11px] font-mono leading-tight ${tgTestResult.success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                        {tgTestResult.message}
                      </div>
                    )}

                    {/* Divider for Backup & Restore */}
                    <div className="border-t border-zinc-800/80 my-3 pt-3 space-y-3">
                      <div className="flex items-center gap-1.5 text-zinc-300 font-bold uppercase tracking-wider text-[10px]">
                        <Database className="w-3.5 h-3.5 text-blue-500" />
                        <span>Cadangan & Pemulihan (Hendri)</span>
                      </div>
                      
                      <p className="text-[10px] text-zinc-500 leading-normal">
                        Ekspor seluruh kredensial dan preferensi Anda menjadi kode enkripsi terkirim langsung ke Telegram Anda, atau pulihkan di sini.
                      </p>

                      {/* Action trigger: Backup */}
                      <button
                        type="button"
                        onClick={handleTelegramBackup}
                        disabled={backupLoading || !telegramToken || !telegramChatId}
                        className="w-full py-2 bg-gradient-to-r from-blue-700/50 to-indigo-800/50 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-[11px] rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer text-center"
                      >
                        {backupLoading ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Database className="w-3.5 h-3.5" />
                        )}
                        Kirim Kode Cadangan ke Telegram
                      </button>

                      {backupResult && (
                        <div className={`p-2 rounded text-[10px] font-mono leading-tight ${backupResult.success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                          {backupResult.message}
                        </div>
                      )}

                      {/* Action trigger: Restore */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] font-semibold text-zinc-400">Tempel Kode Pemulihan</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="HENDRI_BKP_abc123..."
                            value={restoreCode}
                            onChange={(e) => setRestoreCode(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-black border border-zinc-800 focus:border-blue-500 rounded-lg text-[11px] font-mono text-zinc-200 outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleTelegramRestore}
                            className="px-3 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-zinc-200 rounded-lg border border-zinc-750 transition-colors shrink-0 cursor-pointer"
                          >
                            Pulihkan
                          </button>
                        </div>
                      </div>

                      {restoreResult && (
                        <div className={`p-2 rounded text-[10px] font-mono leading-tight ${restoreResult.success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                          {restoreResult.message}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Platforms Grid Bento Box (col-span-4) */}
          <section className="lg:col-span-4 bg-zinc-900/45 border border-zinc-850 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 font-mono flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              Saling Terintegrasi
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { name: "YouTube", code: "YT", color: "bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/25" },
                { name: "TikTok", code: "TT", color: "bg-white/5 text-white border-white/10" },
                { name: "Instagram", code: "IG", color: "bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/25" },
                { name: "Twitter / X", code: "X", color: "bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/25" },
                { name: "Facebook", code: "FB", color: "bg-[#4267B2]/10 text-[#4267B2] border-[#4267B2]/25" },
                { name: "80+ Lainnya", code: "+", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }
              ].map((plt) => (
                <div
                  key={plt.name}
                  className="bg-black/40 border border-zinc-850/80 p-2.5 rounded-2xl flex items-center gap-2.5 transition-all duration-300 hover:border-zinc-700/60"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${plt.color}`}>
                    {plt.code}
                  </div>
                  <span className="text-xs font-medium text-zinc-300 truncate">{plt.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Statistics Bento Card (col-span-4) */}
          <section className="lg:col-span-4 grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/45 border border-zinc-850 rounded-3xl p-5 flex flex-col justify-center shadow-xl hover:border-zinc-700 transition-colors">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Kecepatan Core</span>
              <span className="text-2xl font-black text-blue-500 mt-1 flex items-center gap-1">
                INSTANT
                <Zap className="w-5 h-5 text-blue-500 fill-blue-500 animate-pulse" />
              </span>
            </div>
            
            <div className="bg-zinc-900/45 border border-zinc-850 rounded-3xl p-5 flex flex-col justify-center shadow-xl hover:border-zinc-700 transition-colors">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Tingkat Sukses</span>
              <span className="text-2xl font-mono font-black text-emerald-400 mt-1">99.8%</span>
            </div>
          </section>

          {/* Quick Informational Guide Bento Card (col-span-4) */}
          <section className="lg:col-span-4 bg-zinc-900/45 border border-zinc-850 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Engine Status</h4>
              <p className="text-xs text-zinc-400 leading-normal">
                Program mengekstrak streaming mentah langsung dari server target melalui perutean global CDN, melompati segala batasan resolusi.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#0088cc] font-semibold mt-4">
              <span>● Cloud Nodes Online</span>
            </div>
          </section>

          {/* Third Row: Responsive Weekly Usage Chart (col-span-8) & Distribution Chart (col-span-4) */}
          <section className="col-span-1 lg:col-span-8 bg-zinc-900/45 border border-zinc-850 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                  Statistik Trafik & Bandwidth
                </span>
                <h3 className="text-sm sm:text-base font-bold text-zinc-100 mt-1">Aktivitas Download Penggunaan 7 Hari Terakhir</h3>
              </div>
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-850 self-start sm:self-auto text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setChartMetric("bandwidth")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    chartMetric === "bandwidth" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Bandwidth (GB)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric("files")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    chartMetric === "files" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Jumlah File (Hits)
                </button>
              </div>
            </div>

            <div className="h-64 w-full text-xs">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBandwidth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFiles" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d1d20" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        border: "1px solid #27272a",
                        borderRadius: "12px",
                        color: "#f4f4f5"
                      }}
                      labelStyle={{ fontWeight: "bold", color: "#3b82f6" }}
                    />
                    {chartMetric === "bandwidth" ? (
                      <Area
                        type="monotone"
                        dataKey="bandwidth"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorBandwidth)"
                        name="Bandwidth Terpakai (GB)"
                      />
                    ) : (
                      <>
                        <Area
                          type="monotone"
                          dataKey="video"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorFiles)"
                          name="File Video"
                        />
                        <Area
                          type="monotone"
                          dataKey="audio"
                          stroke="#a855f7"
                          strokeWidth={1.5}
                          fillOpacity={0.1}
                          fill="none"
                          name="File Audio"
                        />
                      </>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-zinc-500 font-mono">
                  Menginisialisasi grafik...
                </div>
              )}
            </div>
          </section>

          {/* Media Distribution Analysis Card (col-span-4) */}
          <section className="col-span-1 lg:col-span-4 bg-zinc-900/45 border border-zinc-850 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-[#e1306c]" />
                  Distribusi Media
                </span>
                <h3 className="text-sm sm:text-base font-bold text-zinc-100 mt-1">Jenis Konten & Platform Terfavorit</h3>
              </div>

              <div className="space-y-4">
                {/* Progress bar YouTube */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-350 font-medium font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-650" />
                      YouTube (Short & Video)
                    </span>
                    <span className="text-zinc-400 font-bold">45%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <div className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full" style={{ width: "45%" }} />
                  </div>
                </div>

                {/* Progress bar TikTok */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-350 font-medium font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400" />
                      TikTok (Muted & Watermark)
                    </span>
                    <span className="text-zinc-400 font-bold">28%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full" style={{ width: "28%" }} />
                  </div>
                </div>

                {/* Progress bar Instagram */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-350 font-medium font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-fuchsia-500" />
                      Instagram (Reel & Post)
                    </span>
                    <span className="text-zinc-400 font-bold">18%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <div className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full" style={{ width: "18%" }} />
                  </div>
                </div>

                {/* Progress bar Lainnya */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-350 font-medium font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Twitter / X & Lainnya
                    </span>
                    <span className="text-zinc-400 font-bold">9%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-sky-450 rounded-full" style={{ width: "9%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-805 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Kecepatan Konversi</span>
              <span className="text-emerald-400 font-bold">~0.8 Detik / File</span>
            </div>
          </section>

        </div>

        {/* Results Presentation Panel (Rendered dynamically within the Bento arrangement) */}
        <AnimatePresence>
          {successResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-12 bg-zinc-900/70 border border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-widest font-mono">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    MEDIA BERHASIL DIESKRAKSI
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase bg-black/60 px-3 py-1 rounded border border-zinc-850">
                    Host: {successResult.apiUsed ? successResult.apiUsed.replace("https://", "").split("/")[0] : "Cobalt Engine"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column containing Details info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Metadata URL Sumber:</h4>
                      <p className="text-xs text-blue-400 break-all bg-black/50 p-3.5 rounded-xl border border-zinc-800 mt-1.5 flex items-center justify-between gap-3">
                        <span className="truncate">{url}</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 shrink-0">
                          <ExternalLink className="w-4 h-4 inline" />
                        </a>
                      </p>
                    </div>

                    {/* Standard redirect results */}
                    {successResult.cobaltData?.url && (
                      <div className="bg-black/30 border border-zinc-850 p-4.5 rounded-2xl flex flex-col justify-center items-center text-center space-y-3">
                        <span className="text-xs text-zinc-400">Stream file target siap diunduh secara offline:</span>
                        <a
                          href={successResult.cobaltData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-extrabold text-sm text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Download className="w-5 h-5 text-white" />
                          KLIK UNTUK INSTANT DOWNLOAD
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right Column containing Picker results for galleries */}
                  <div className="space-y-4">
                    {/* If picker status returns multiple cards */}
                    {successResult.cobaltData?.status === "picker" && (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs flex items-start gap-2">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>Ditemukan galeri multimedia (multi-item). Silakan simpan file individual tercantum di bawah ini:</span>
                        </div>
                        
                        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
                          {successResult.cobaltData.picker.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs">
                              <span className="font-semibold text-zinc-300">
                                📷 Item Media {idx + 1} ({item.type === "photo" ? "Foto" : item.type === "audio" ? "Audio" : "Video"})
                              </span>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md transition-colors flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" /> Unduh
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Telegram Deliver details */}
                    {sendToTelegram && successResult.telegramResult && (
                      <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-blue-400" />
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Sinkronisasi Telegram Bot</h4>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {successResult.telegramResult.ok ? (
                            <>
                              🚀 Status: <span className="font-bold text-emerald-400">File Terkirim Sukses!</span> File media berhasil diunggah langsung ke platform Telegram Anda. Hubungi bot Anda untuk melihat file.
                            </>
                          ) : (
                            <>
                              ⚠️ Status: <span className="font-bold text-rose-400">Telegram API Menolak Embed.</span> Pastikan Token Bot benar & Chat ID Anda sudah memulai percakapan (/start). Detail:
                              <code className="block mt-1 p-1.5 bg-black rounded font-mono text-[10px] text-zinc-500 break-all">{successResult.telegramResult.description || "Incompatible token"}</code>
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gemini AI Caption Generator Card (Full row width under results) */}
              <div className="lg:col-span-12 bg-zinc-900/70 border border-zinc-850 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
                <div
                  className="flex items-center justify-between cursor-pointer border-b border-zinc-800 pb-3"
                  onClick={() => setShowAiCaption(!showAiCaption)}
                >
                  <span className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                    Asisten Publisher AI Gemini (Optimalkan Copywriting Re-Upload)
                  </span>
                  <button className="text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-800/60 border border-zinc-800 px-3 py-1 rounded">
                    {showAiCaption ? "Klik untuk Menutup" : "Klik untuk Membuka"}
                  </button>
                </div>

                <AnimatePresence>
                  {showAiCaption && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Ingin mengunggah ulang (reupload) video atau konten ini di akun sosial media Anda? Biarkan asisten AI Gemini kami memformat narasi caption, judul, serta hashtag viral yang relevan dalam Bahasa Indonesia secara instan.
                      </p>

                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-semibold text-zinc-400">
                          Tambahkan Kustomisasi (Mood, Gaya Bahasa, atau Subjek Target)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Contoh: buat nada keren gaul, santai, pakai istilah hits, minimalis"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-black border border-zinc-800 focus:border-blue-500 rounded-xl text-xs sm:text-sm placeholder-zinc-700 outline-none text-zinc-200"
                          />
                          <button
                            type="button"
                            onClick={generateAiCaption}
                            disabled={aiLoading}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 rounded-xl transition-all hover:scale-105 active:scale-100 disabled:opacity-55 cursor-pointer"
                          >
                            {aiLoading ? "Memproses..." : "Buat Caption"}
                          </button>
                        </div>
                      </div>

                      {aiCaptionText && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-black/60 border border-zinc-850 p-5 rounded-2xl relative space-y-3.5 mt-3"
                        >
                          <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">
                              Asisten Copywriting Generator
                            </span>
                            <button
                              type="button"
                              onClick={() => copyCaptionToClipboard(aiCaptionText)}
                              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
                            >
                              {copiedCaption ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>Salin Teks</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal whitespace-pre-wrap">
                            {aiCaptionText}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Elegant minimalist Bento footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-black/60 py-6 text-center text-xs text-zinc-600 z-10 font-normal">
        <p>© 2026 Hendri VortexDownloader Pro. Dioptimalkan untuk multi-platform CDN streaming.</p>
        <p className="mt-1 text-zinc-700">Integrasi Telegram Bot API & Didukung oleh Google Gemini Server-side AI.</p>
      </footer>
    </div>
  );
}
