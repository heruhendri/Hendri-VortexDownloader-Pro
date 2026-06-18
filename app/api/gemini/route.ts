import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini with server-side API Key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { url, title, downloadMode = "video", customTopic } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL wajib diisi" }, { status: 400 });
    }

    const modeLabel = downloadMode === "audio" ? "Audio (MP3)" : "Video";
    const prompt = `
    Anda adalah seorang copywriter media sosial profesional dan asisten downloader media berkualitas tinggi.
    Tugas Anda adalah membuat deskripsi / caption media sosial yang sangat menarik dan elegan dalam Bahasa Indonesia untuk konten yang diunduh.

    Berikut detail konten:
    - URL Sumber: ${url}
    - Judul Konten (jika ada): ${title || "Tidak diketahui"}
    - Jenis Konten: ${modeLabel}
    ${customTopic ? `- Topik Tambahan/Konteks Khusus dari User: ${customTopic}` : ""}

    Ketentuan Caption:
    1. Buat caption yang engaging, persuasif, ringkas, dan ramah yang cocok diletakkan di postingan media sosial atau pesan Telegram.
    2. Sertakan beberapa hashtag yang sangat relevan (minimal 3-5 hashtag populer di Indonesia).
    3. Hubungkan secara halus bahwa konten ini diunduh dengan cepat menggunakan Multi-Platform Video Downloader.
    4. Strukturkan dengan visual emoji yang rapi dan teratur (tidak terlalu ramai, elegan).
    5. Berikan juga rekomendasi ringkas (1-2 baris) tentang bagaimana user bisa mengunggah ulang konten ini dengan performa terbaik.

    Format keluaran: Kembalikan teks Markdown rapi dengan bagian caption dan tips unggah ulang.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const replyText = response.text || "Gagal membuat caption AI.";

    return NextResponse.json({
      success: true,
      text: replyText
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message || "Gagal menghubungi Gemini AI",
      success: false
    }, { status: 500 });
  }
}
