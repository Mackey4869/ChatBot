// 文章分割ユーティリティ
/**
 * テキストを指定した文字数で分割します（簡易版チャンク分割）
 */
export function splitText(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = startIndex + chunkSize;
    chunks.push(text.slice(startIndex, endIndex));
    // 前のチャンクと少し重ねることで文脈の断絶を防ぎます
    startIndex += (chunkSize - overlap);
  }

  return chunks;
}
