const SUPABASE_URL = "https://vtnuirobrtswsjoxkkpl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bnVpcm9icnRzd3Nqb3hra3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTkyOTAsImV4cCI6MjA4OTA5NTI5MH0.PVdzHnmCHcJlHRRQf-HuQFcty6DgAQMczuxT97cCN88";

const EDGE_FUNCTION_URL = SUPABASE_URL + "/functions/v1/kismet-reading";

export interface UserProfile {
  name?: string;
  zodiacSign?: string;
  gender?: string;
  relation?: string;
  focus?: string[];
}

export interface ReadingRequest {
  type: "coffee" | "tarot" | "dream" | "palm" | "face" | "birthchart";
  lang: "tr" | "en";
  userProfile?: UserProfile;
  imageBase64?: string;
  dreamText?: string;
  tarotCards?: string[];
  tarotPositions?: string[];
  birthChartData?: string; // Formatted chart data for AI interpretation
}

export interface ReadingResponse {
  success: boolean;
  reading?: string;
  model?: string;
  error?: string;
}

export async function getAIReading(request: ReadingRequest): Promise<ReadingResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("API error: " + response.status + " - " + errorText);
    }

    const data: ReadingResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error("AI Reading error:", error);
    return {
      success: false,
      error: error.message || "Bağlantı hatası",
    };
  }
}

// Convenience functions
export async function getCoffeeReading(imageBase64: string, lang: "tr" | "en", profile?: UserProfile) {
  return getAIReading({ type: "coffee", lang, imageBase64, userProfile: profile });
}

export async function getTarotReading(cards: string[], positions: string[], lang: "tr" | "en", profile?: UserProfile) {
  return getAIReading({ type: "tarot", lang, tarotCards: cards, tarotPositions: positions, userProfile: profile });
}

export async function getDreamReading(dreamText: string, lang: "tr" | "en", profile?: UserProfile) {
  return getAIReading({ type: "dream", lang, dreamText, userProfile: profile });
}

export async function getPalmReading(imageBase64: string, lang: "tr" | "en", profile?: UserProfile) {
  return getAIReading({ type: "palm", lang, imageBase64, userProfile: profile });
}

export async function getFaceReading(imageBase64: string, lang: "tr" | "en", profile?: UserProfile) {
  return getAIReading({ type: "face", lang, imageBase64, userProfile: profile });
}

export async function getBirthChartReading(birthChartData: string, lang: "tr" | "en", profile?: UserProfile) {
  return getAIReading({ type: "birthchart", lang, birthChartData, userProfile: profile });
}
