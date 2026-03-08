import { NextResponse } from 'next/server';
import createServerClient from '@/lib/supabase.server';

/**
 * GET: ブログ一覧または特定IDのブログを取得する API
 * 
 * クエリパラメータ:
 * - id: 特定のブログID (uuid)
 * - category_id: カテゴリでフィルタ
 * - author_id: 著者でフィルタ
 * - limit: 取得件数 (デフォルト 20)
 * - offset: スキップ件数 (デフォルト 0)
 * - include_unpublished: true の場合、非公開記事も含む (要管理者権限)
 */
export async function GET(req: Request) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get('id');
    const category_id = searchParams.get('category_id');
    const author_id = searchParams.get('author_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeUnpublished = searchParams.get('include_unpublished') === 'true';

    // 認証情報の取得 (管理者権限確認のため)
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || null;
    
    let isAdmin = false;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        isAdmin = userData?.role === 'admin';
      }
    }

    let query = supabase
      .from('blogs')
      .select(`
        *,
        author:users(id, name),
        category:blog_categories(id, name)
      `);

    // ID指定がある場合
    if (id) {
      query = query.eq('id', id).single();
    } else {
      // フィルタリング
      if (category_id) {
        query = query.eq('category_id', category_id);
      }
      if (author_id) {
        query = query.eq('author_id', author_id);
      }
      
      // 公開設定によるフィルタ (管理者でない場合は公開済みのみ)
      if (!includeUnpublished || !isAdmin) {
        query = query.eq('is_published', true);
      }

      // 並び順 (作成日降順)
      query = query.order('created_at', { ascending: false });

      // ページネーション
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Blogs fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data && id) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ data });

  } catch (err: any) {
    console.error('Unexpected API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE: ブログを削除する API (管理者限定)
 * 
 * クエリパラメータ:
 * - id: 削除するブログのID (uuid)
 */
export async function DELETE(req: Request) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 });
    }

    // 認証情報の取得
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    // 権限確認 (adminロールのみ許可)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // ブログの削除 (blog_sections は ON DELETE CASCADE により自動削除される)
    const { error: deleteError } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Blog deletion error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Blog deleted successfully' });

  } catch (err: any) {
    console.error('Unexpected API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
