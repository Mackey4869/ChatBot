// チャンク生成&DB登録
// 記事受信 → チャンク化 → embedding → Supabase保存
import { NextResponse } from 'next/server';
import createServerClient from '@/lib/supabase.server'; // サーバー専用クライアント
import { generateEmbedding } from '@/lib/ai';
import { splitText } from '@/utils/textSplit';

export async function POST(req: Request) {
  try {
    const { title, content, category_id, author_id } = await req.json();
    const supabase = createServerClient();

    // 1. ブログ本記事を保存
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .insert([{ title, content, category_id, author_id, is_published: true }])
      .select()
      .single();

    if (blogError) throw blogError;

    // 2. 本文をチャンクに分割
    const chunks = splitText(content);

    // 3. 各チャンクをベクトル化して blog_sections に保存
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);

      const { error: sectionError } = await supabase
        .from('blog_sections')
        .insert({
          blog_id: blog.id,
          content: chunk,
          embedding: embedding
        });

      if (sectionError) console.error("Section save error:", sectionError);
    }

    return NextResponse.json({ success: true, blogId: blog.id });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}