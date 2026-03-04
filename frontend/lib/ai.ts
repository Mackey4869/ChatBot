import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. モデル名の定数化 (models/ を含めるのが確実です)
const EMBEDDING_MODEL = "gemini-embedding-001"; 

let genAI: GoogleGenerativeAI | null = null;

/**
 * APIキーの取得
 * Next.jsのサーバーサイドでは process.env を使用するのが標準的です。
 */
function resolveApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('環境変数 GEMINI_API_KEY が設定されていません。');
  }
  return apiKey;
}

export function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(resolveApiKey());
  }
  return genAI;
}

/**
 * テキストをベクトル化
 * @param text ベクトル化したい文字列
 * @returns 768次元の数値配列
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getGenAI();
  
  // 2. 正確なモデル名を指定
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  
  try {
    // API側で次元数を 768 に指定してリクエストする
    const result = await model.embedContent({
      content: { parts: [{ text }], role: 'user' },
      outputDimensionality: 768,
    });

    const values: number[] = result?.embedding?.values;

    if (!Array.isArray(values)) {
      throw new Error('Embedding の取得に失敗しました');
    }

    const TARGET_DIM = 768;
    if (values.length === TARGET_DIM) return values;
    if (values.length > TARGET_DIM) return values.slice(0, TARGET_DIM);

    // values.length < TARGET_DIM の場合は 0 でパディングして返す
    return values.concat(new Array(TARGET_DIM - values.length).fill(0));
  } catch (error) {
    console.error("Embedding生成に失敗しました:", error);
    throw error;
  }
}