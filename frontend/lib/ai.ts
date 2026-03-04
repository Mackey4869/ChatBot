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

// チャット応答を生成するヘルパー
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';

export async function generateChatResponse(question: string, context: string): Promise<string> {
  const client = getGenAI();
  const model = client.getGenerativeModel({
    model: CHAT_MODEL,
    generationConfig: {
      temperature: 0.2,
    },
  });

  const prompt = `参照情報:
${context}

ユーザーの質問:
${question}

上記の参照情報を踏まえて、日本語で簡潔に回答してください。必要なら出典を示してください。`;

  try {
    // SDK の generateContent を利用
    const result: any = await model.generateContent(prompt);

    // SDK の一般的なレスポンス取得方法に合わせてテキストを抽出
    const response = await result.response;
    const text = await (typeof response.text === 'function' ? response.text() : String(response));

    if (!text) {
      throw new Error('モデルからの応答が空でした。');
    }

    return String(text);
  } catch (err) {
    console.error('generateChatResponse error:', err);
    throw err;
  }
}