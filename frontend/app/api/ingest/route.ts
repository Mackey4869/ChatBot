// チャンク生成&DB登録
// 記事受信 → チャンク化 → embedding → Supabase保存
import { NextResponse } from 'next/server';
import createServerClient from '@/lib/supabase.server'; // サーバー専用クライアント
import { generateEmbedding } from '@/lib/ai';
import { splitText } from '@/utils/textSplit';

export async function POST(req: Request) {
  try {
    const { title, content, category_id, author_id, tags } = await req.json();
    const supabase = createServerClient();

    // 1. ブログ本記事を保存
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .insert([{ title, content, category_id, author_id, tags, is_published: true }])
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

    export async function PUT(req: Request) {
    try {
    const { id, title, content, category_id, author_id, tags } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const supabase = createServerClient();

    // 1. ブログ記事を更新
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .update({ title, content, category_id, author_id, tags, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (blogError) throw blogError;

    // 2. 内容が更新されている可能性があるため、チャンクを再生成（簡易的な実装として全削除→全登録）
    // ※ パフォーマンスを考慮する場合は、内容の変更検知を行うのが望ましい
    const { error: deleteError } = await supabase
      .from('blog_sections')
      .delete()
      .eq('blog_id', id);

    if (deleteError) console.error("Section delete error:", deleteError);

    const chunks = splitText(content);
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);
      const { error: sectionError } = await supabase
        .from('blog_sections')
        .insert({
          blog_id: id,
          content: chunk,
          embedding: embedding
        });
      if (sectionError) console.error("Section save error:", sectionError);
    }

    return NextResponse.json({ success: true, blog: blog });

    } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
    }
    }