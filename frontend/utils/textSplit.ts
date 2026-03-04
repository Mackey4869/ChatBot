// 文章分割ユーティリティ
/**
 * テキストを句読点で分割し、文脈を維持したチャンク（断片）を作成します。
 */
export function splitText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] {
  // 日本語と英語の主要な句読点で分割（セパレータを残すために正規表現で取得）
  // 環境で後読みが使えない場合でもこのパターンは安全に動作します
  const sentences = text.match(/[^。！？\.\!\?]+[。！？\.\!\?]?/g) || [text];

  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    // 現在のチャンクに次の文を足してもサイズ内なら追加
    if ((currentChunk + sentence).length <= chunkSize) {
      currentChunk += sentence;
    } else {
      // サイズを越える場合は現在のチャンクを保存
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      // オーバーラップを実現するため、現在のチャンクの末尾から overlap 分の文字を抽出して結合
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + sentence;

      // もし1文が極端に長く、chunkSize を超えている場合の処理
      if (currentChunk.length > chunkSize) {
        // 強制的に分割して次のループへ（稀なケース）
        chunks.push(currentChunk.slice(0, chunkSize));
        currentChunk = currentChunk.slice(chunkSize - overlap);
      }
    }
  }

  // 最後のチャンクを追加
  if (currentChunk.trim()) {
    chunks.push(currentChunk);
  }

  return chunks;
}
