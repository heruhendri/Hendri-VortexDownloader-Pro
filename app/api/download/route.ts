import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { join } from "path";
import { existsSync } from "fs";

// Determine absolute path of yt-dlp to run
function resolveYtdlpPath(): string {
  if (process.env.YT_DLP_PATH) {
    return process.env.YT_DLP_PATH;
  }
  
  // Local bin fallback (great for shared hosting where users can upload binary to /bin)
  const localBin = join(process.cwd(), "bin", "yt-dlp");
  if (existsSync(localBin)) {
    return localBin;
  }
  
  const nodeBin = join(process.cwd(), "node_modules", ".bin", "yt-dlp");
  if (existsSync(nodeBin)) {
    return nodeBin;
  }

  // System absolute path check
  const usrLocalBin = "/usr/local/bin/yt-dlp";
  if (existsSync(usrLocalBin)) {
    return usrLocalBin;
  }
  
  const usrBinYtdlp = "/usr/bin/yt-dlp";
  if (existsSync(usrBinYtdlp)) {
    return usrBinYtdlp;
  }

  // Defalut command lookup
  return "yt-dlp";
}

// Determine optional absolute path of ffmpeg (critically useful for audio-video merging on shared hostings)
function resolveFfmpegPath(): string | null {
  if (process.env.FFMPEG_PATH) {
    return process.env.FFMPEG_PATH;
  }

  const localFfmpeg = join(process.cwd(), "bin", "ffmpeg");
  if (existsSync(localFfmpeg)) {
    return localFfmpeg;
  }

  return null;
}

// Helper function to safely execute yt-dlp using spawn to prevent command injection
function runYtdlp(url: string, isAudio: boolean, quality: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // We pass -f best to fetch the single progressive format or ba to fetch the best audio.
    const args: string[] = ["--dump-json", "--no-playlist", "--no-warnings"];
    
    // Auto-inject ffmpeg location if local or env specified
    const ffmpegPath = resolveFfmpegPath();
    if (ffmpegPath) {
      args.push("--ffmpeg-location", ffmpegPath);
    }

    if (isAudio) {
      args.push("-f", "ba/best");
    } else {
      const h = quality || "720";
      // Select format where height is less than or equal to chosen quality (with progressive fallback)
      args.push("-f", `best[height<=${h}]/best`);
    }
    
    args.push(url);

    const binaryToRun = resolveYtdlpPath();
    const child = spawn(binaryToRun, args);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const errorMsg = stderr.trim();
        if (errorMsg.includes("ENOENT") || errorMsg.includes("not found")) {
          return reject(new Error(`Perintah 'yt-dlp' tidak ditemukan di server. Silakan install 'yt-dlp' atau hubungi hoster Anda!`));
        }
        return reject(new Error(errorMsg || `Gagal memproses link dengan kode status ${code}.`));
      }

      try {
        const metadata = JSON.parse(stdout);
        resolve(metadata);
      } catch (parseErr) {
        reject(new Error("Gagal mengurai output metadata dari downloader."));
      }
    });

    child.on("error", (err: any) => {
      if (err.code === "ENOENT") {
        reject(new Error(`Perintah 'yt-dlp' tidak ditemukan. Harap unggah biner yt-dlp ke folder "/bin" atau pastikan ia terpasang di server VPS/Hosting Anda!`));
      } else {
        reject(err);
      }
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const {
      url,
      videoQuality = "720",
      downloadMode = "video",
      sendToTelegram = false,
      telegramToken,
      telegramChatId
    } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL media wajib diisi", success: false }, { status: 400 });
    }

    // Run local yt-dlp engine
    let metadata: any = null;
    try {
      metadata = await runYtdlp(url.trim(), downloadMode === "audio", videoQuality);
    } catch (err: any) {
      return NextResponse.json({
        error: `Gagal memproses media: ${err.message}`,
        success: false
      }, { status: 500 });
    }

    if (!metadata) {
      return NextResponse.json({
        error: "Gagal mengekstraksi metadata video. Periksa kembali URL Anda.",
        success: false
      }, { status: 500 });
    }

    // Process formats and locate the download stream URL
    let mediaUrl = metadata.url;

    // Fallback if metadata.url is empty (progressive stream format resolution)
    if (!mediaUrl && metadata.requested_formats && metadata.requested_formats.length > 0) {
      mediaUrl = metadata.requested_formats[0].url;
    }

    if (!mediaUrl && metadata.formats && metadata.formats.length > 0) {
      const bestFormat = metadata.formats[metadata.formats.length - 1];
      mediaUrl = bestFormat.url;
    }

    if (!mediaUrl) {
      return NextResponse.json({
        error: "Tidak didapatkan URL unduhan langsung dari CDN. Perbarui yt-dlp di server Anda.",
        success: false
      }, { status: 500 });
    }

    // Compatibility mapper for the UI
    let cobaltResult: any = {
      url: mediaUrl,
      status: "stream",
      text: metadata.title || "Video Tanpa Judul"
    };

    if (metadata._type === "playlist" || (metadata.entries && metadata.entries.length > 0)) {
      const pickerItems = metadata.entries.map((entry: any, i: number) => ({
        url: entry.url || (entry.formats && entry.formats.length > 0 ? entry.formats[entry.formats.length - 1].url : ""),
        type: entry.vcodec === 'none' ? 'audio' : 'video',
        text: entry.title || `Media Item ${i + 1}`
      })).filter((item: any) => item.url);

      if (pickerItems.length > 0) {
        cobaltResult = {
          status: "picker",
          picker: pickerItems,
          text: metadata.title || "Koleksi Berkas Media"
        };
      }
    }

    // Send to Telegram if integrated
    let telegramDispatchResult: any = null;
    let telegramMode = "none";

    if (sendToTelegram && telegramToken && telegramChatId) {
      const parsedTelegramToken = telegramToken.trim();
      const parsedTelegramChatId = telegramChatId.trim();

      if (cobaltResult.status === "picker") {
        // Multi-media text list dispatch
        let text = `📬 *Unduhan Koleksi Platform (${videoQuality}p)*\n\nDitemukan beberapa item media dari:\n🔗 ${url}\n\n*Silakan unduh satu-persatu melalui tautan berikut:*\n`;
        cobaltResult.picker.forEach((item: any, idx: number) => {
          let typeLabel = "Media";
          if (item.type === "photo") typeLabel = "🖼️ Foto";
          if (item.type === "video") typeLabel = "📹 Video";
          if (item.type === "audio") typeLabel = "🎵 Audio";
          text += `👉 ${idx + 1}. [Unduh ${typeLabel} ${idx + 1}](${item.url})\n`;
        });

        try {
          const tgRes = await fetch(`https://api.telegram.org/bot${parsedTelegramToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: parsedTelegramChatId,
              text: text,
              parse_mode: "Markdown"
            })
          });
          telegramDispatchResult = await tgRes.json();
          telegramMode = "picker_text";
        } catch (err: any) {
          telegramDispatchResult = { ok: false, error: err.message };
        }
      } else if (mediaUrl) {
        let isMediaSent = false;

        // Try direct file embedding in Telegram (limit size: ~20MB for links)
        if (downloadMode === "video" && cobaltResult.status !== "audio") {
          try {
            const tgRes = await fetch(`https://api.telegram.org/bot${parsedTelegramToken}/sendVideo`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: parsedTelegramChatId,
                video: mediaUrl,
                caption: `📥 *Video Berhasil Terunduh!*\n\n📝 *Judul:* ${cobaltResult.text}\n🔗 *URL Sumber:* ${url}\n⚡ Diunduh via Hendri VortexDownloader Pro (Self-Hosted)`,
                parse_mode: "Markdown"
              })
            });
            const tgJson = await tgRes.json();
            if (tgJson.ok) {
              isMediaSent = true;
              telegramDispatchResult = tgJson;
              telegramMode = "video_embed";
            }
          } catch (e) {
            // failed to embed directly, fallback below
          }
        } else if (downloadMode === "audio") {
          try {
            const tgRes = await fetch(`https://api.telegram.org/bot${parsedTelegramToken}/sendAudio`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: parsedTelegramChatId,
                audio: mediaUrl,
                caption: `🎵 *Audio Berhasil Terunduh!*\n\n📝 *Judul:* ${cobaltResult.text}\n🔗 *URL Sumber:* ${url}\n⚡ Diunduh via Hendri VortexDownloader Pro (Self-Hosted)`,
                parse_mode: "Markdown"
              })
            });
            const tgJson = await tgRes.json();
            if (tgJson.ok) {
              isMediaSent = true;
              telegramDispatchResult = tgJson;
              telegramMode = "audio_embed";
            }
          } catch (e) {
            // failed to embed directly, fallback below
          }
        }

        // Fallback message link transmission jika direct send gagal
        if (!isMediaSent) {
          const typeLabel = downloadMode === "audio" ? "Audio (MP3)" : "Video";
          const tgTextRes = await fetch(`https://api.telegram.org/bot${parsedTelegramToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: parsedTelegramChatId,
              text: `📬 *Hasil Downloader Hendri VortexDownloader Pro*\n\n✅ *Status:* Media berhasil diekstrak!\n📝 *Judul:* ${cobaltResult.text}\n📹 *Format:* ${typeLabel}\n\n📥 *Link Unduh Langsung:* [Klik di Sini untuk Mengunduh](${mediaUrl})\n\n🔗 *URL Posting Asli:* ${url}\n\n⚠️ _Catatan: Jika media tidak disematkan berupa video langsung, hal ini disebabkan batasan file besar (>20MB) dari platform Telegram._`,
              parse_mode: "Markdown"
            })
          });
          telegramDispatchResult = await tgTextRes.json();
          telegramMode = "text_link";
        }
      }
    }

    return NextResponse.json({
      success: true,
      cobaltResult,
      cobaltData: cobaltResult,
      telegramMode: telegramMode,
      telegramResult: telegramDispatchResult,
      apiUsed: "Local yt-dlp (VPS Self-Hosted)"
    });

  } catch (err: any) {
    return NextResponse.json({
      error: err.message || "Terjadi kesalahan internal pada server downloader.",
      success: false
    }, { status: 500 });
  }
}
