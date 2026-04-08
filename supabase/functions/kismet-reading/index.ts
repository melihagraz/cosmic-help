import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReadingRequest {
  type: "coffee" | "tarot" | "dream" | "palm" | "face" | "birthchart";
  lang: "tr" | "en";
  userProfile?: {
    name?: string;
    zodiacSign?: string;
    gender?: string;
    relation?: string;
    focus?: string[];
  };
  // Type-specific data
  imageBase64?: string;    // coffee, palm, face (kamera görüntüsü)
  dreamText?: string;      // dream
  tarotCards?: string[];    // tarot (seçilen kart isimleri)
  tarotPositions?: string[]; // tarot (past, present, future)
  birthChartData?: string; // birthchart (hesaplanmış gezegen pozisyonları)
}

function buildSystemPrompt(type: string, lang: string): string {
  const langInstruction = lang === "tr"
    ? "Yanıtını Türkçe ver. Sıcak, mistik ama samimi bir ton kullan. Kullanıcıya 'sen' diye hitap et."
    : "Respond in English. Use a warm, mystical but sincere tone. Address the user as 'you'.";

  const prompts: Record<string, string> = {
    coffee: `Sen Cosmic Help, deneyimli bir Türk kahve fincanı analiz uzmanısın. Fincan fotoğraflarından şekilleri yorumluyorsun.
${langInstruction}

Kurallar:
- Fincandaki şekilleri tanımla (kuş, kalp, yol, ağaç, yıldız, göz, at, balık vb.)
- Her şeklin ne anlama geldiğini açıkla
- Geçmiş, şimdi ve gelecek hakkında yorum yap
- Pozitif ama gerçekçi ol
- 3-4 paragraf yaz
- Kullanıcının profil bilgilerini yorumuna entegre et`,

    tarot: `Sen Cosmic Help, bilge bir tarot okuyucususun. Seçilen kartları yorumluyorsun.
${langInstruction}

Kurallar:
- Her kartı pozisyonuyla birlikte yorumla (Geçmiş/Şimdi/Gelecek)
- Kartlar arası bağlantıları göster
- Genel bir özet ver
- Pozitif ve yapıcı ol
- Kullanıcının hayat odağına göre yorumla`,

    dream: `Sen Cosmic Help, rüya yorumcususun. Rüyalardaki sembolleri ve anlamları çözümlüyorsun.
${langInstruction}

Kurallar:
- Rüyadaki temel sembolleri tespit et
- Her sembolün psikolojik ve mistik anlamını açıkla
- Rüyanın genel mesajını özetle
- Bilinçaltı mesajlara dikkat çek
- Pratik öneriler sun
- 3-4 paragraf yaz`,

    palm: `Sen Cosmic Help, el analizi uzmanısın. Avuç içi fotoğraflarından çizgileri okuyorsun.
${langInstruction}

Kurallar:
- Ana çizgileri analiz et: yaşam, kalp, akıl, kader, güneş çizgisi
- Her çizginin derinliği, uzunluğu ve şekline göre yorum yap
- Kişilik analizi yap
- Gelecek hakkında ipuçları ver
- 3-4 paragraf yaz`,

    face: `Sen Cosmic Help, yüz okuma (fizyognomi) uzmanısın. Yüz hatlarından karakter analizi yapıyorsun.
${langInstruction}

Kurallar:
- Yüz hatlarını analiz et: alın, gözler, burun, elmacık kemikleri, çene, dudaklar
- Her özelliğin karakter anlamını açıkla
- Enerji ve aura analizi yap
- Güçlü yönleri ve potansiyeli vurgula
- 3-4 paragraf yaz`,

    birthchart: `Sen Cosmic Help, profesyonel bir astrolog ve doğum haritası yorumcususun. Hesaplanmış gezegen pozisyonlarını, ev yerleşimlerini ve açıları derinlemesine yorumluyorsun.
${langInstruction}

Kurallar:
- Güneş burcunu ve evini yorumla (temel kimlik ve yaşam amacı)
- Ay burcunu ve evini yorumla (duygusal doğa ve iç dünya)
- Yükselen burcu yorumla (dış dünyaya yansıyan kişilik)
- Önemli gezegen açılarını yorumla (güçlü yönler ve zorluklar)
- Kullanıcının hayat odağına göre (kariyer, aşk, sağlık vb.) özel yorumlar yap
- Her gezegen-ev kombinasyonunun pratik hayatta ne anlama geldiğini açıkla
- Pozitif ve yapıcı ol, zorlukları büyüme fırsatı olarak sun
- 5-6 paragraf detaylı yorum yaz
- Haritadaki en güçlü konfigürasyonları (stellium, grand trine, T-square vb.) tespit et
- Kişinin benzersiz potansiyelini vurgula`,
  };

  return prompts[type] || prompts.coffee;
}

function buildUserMessage(req: ReadingRequest): any[] {
  const content: any[] = [];
  const profile = req.userProfile;
  let profileContext = "";

  if (profile) {
    const parts = [];
    if (profile.name) parts.push(`İsim: ${profile.name}`);
    if (profile.zodiacSign) parts.push(`Burç: ${profile.zodiacSign}`);
    if (profile.gender) parts.push(`Cinsiyet: ${profile.gender}`);
    if (profile.relation) parts.push(`İlişki: ${profile.relation}`);
    if (profile.focus?.length) parts.push(`Odak: ${profile.focus.join(", ")}`);
    if (parts.length) profileContext = `\n\nKullanıcı profili: ${parts.join(" | ")}`;
  }

  switch (req.type) {
    case "coffee":
      if (req.imageBase64) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: req.imageBase64 },
        });
      }
      content.push({
        type: "text",
        text: `Bu kahve fincanını oku ve yorumla.${profileContext}`,
      });
      break;

    case "tarot":
      const cards = req.tarotCards?.join(", ") || "Büyücü, Kader Çarkı, Yıldız";
      const positions = req.tarotPositions?.join(", ") || "Geçmiş, Şimdi, Gelecek";
      content.push({
        type: "text",
        text: `Seçilen tarot kartları: ${cards}\nPozisyonlar: ${positions}\n\nBu kartları detaylı yorumla.${profileContext}`,
      });
      break;

    case "dream":
      content.push({
        type: "text",
        text: `Şu rüyayı yorumla: "${req.dreamText}"${profileContext}`,
      });
      break;

    case "palm":
      if (req.imageBase64) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: req.imageBase64 },
        });
      }
      content.push({
        type: "text",
        text: `Bu avuç içi fotoğrafını analiz et ve el analizi yap.${profileContext}`,
      });
      break;

    case "face":
      if (req.imageBase64) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: req.imageBase64 },
        });
      }
      content.push({
        type: "text",
        text: `Bu yüz fotoğrafını analiz et ve karakter/enerji analizi yap.${profileContext}`,
      });
      break;

    case "birthchart":
      content.push({
        type: "text",
        text: `Aşağıdaki doğum haritası verilerini detaylı yorumla:\n\n${req.birthChartData || "Veri bulunamadı"}${profileContext}`,
      });
      break;
  }

  return content;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const body: ReadingRequest = await req.json();

    if (!body.type || !body.lang) {
      throw new Error("Missing required fields: type, lang");
    }

    const systemPrompt = buildSystemPrompt(body.type, body.lang);
    const userMessage = buildUserMessage(body);

    // Görselli istekler için claude-sonnet (vision), text için haiku (ucuz)
    const needsVision = body.imageBase64 && ["coffee", "palm", "face"].includes(body.type);
    const model = needsVision ? "claude-sonnet-4-20250514" : "claude-haiku-4-5-20251001";

    // Birth chart needs more tokens for detailed interpretation
    const maxTokens = body.type === "birthchart" ? 2048 : 1024;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const reading = data.content?.[0]?.text || "Yorum oluşturulamadı.";

    return new Response(
      JSON.stringify({ success: true, reading, model }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
