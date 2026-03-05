import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// 管理者向け API
// - GET: 現在のユーザーの role を返す。クエリ `?list=true` を付けると管理者一覧を返す（自身が admin の場合のみ）。
// - POST: { action: 'grant'|'revoke', userId: '<uuid>' } 管理者付与/剥奪（呼び出し元は admin である必要あり）

async function getUserFromToken(supabase: any, token?: string | null) {
  if (!token) return { user: null, error: 'no token' };
  const { data, error } = await supabase.auth.getUser(token);
  return { user: data?.user || null, error };
}

export async function GET(req: Request) {
  try {
    const supabase = createClient(); // SERVER: uses SERVICE_ROLE_KEY per lib/supabase.ts

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || null;

    const { user, error: userErr } = await getUserFromToken(supabase, token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // 簡易的に自分の role を返す
    const { data: row, error: rowErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (rowErr) {
      return NextResponse.json({ error: 'failed to get role', detail: rowErr.message }, { status: 500 });
    }

    const url = new URL(req.url);
    const list = url.searchParams.get('list');

    // list=true が指定されていれば、管理者一覧を返す（自身が admin の場合のみ）
    if (list === 'true') {
      if (row?.role !== 'admin') {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }

      const { data: admins, error: adminErr } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('role', 'admin');

      if (adminErr) return NextResponse.json({ error: 'failed to list admins', detail: adminErr.message }, { status: 500 });
      return NextResponse.json({ admins });
    }

    return NextResponse.json({ role: row?.role || null });
  } catch (err: any) {
    console.error('admin GET error:', err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || null;

    const { user, error: userErr } = await getUserFromToken(supabase, token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // 呼び出し元が admin であることを確認
    const { data: callerRow } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (callerRow?.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const action = body?.action;
    const targetUserId = body?.userId;

    if (!action || !['grant', 'revoke'].includes(action) || !targetUserId) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
    }

    const newRole = action === 'grant' ? 'admin' : 'student';

    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select('id, role')
      .single();

    if (updateErr) {
      return NextResponse.json({ error: 'failed to update role', detail: updateErr.message }, { status: 500 });
    }

    // 変更を監査ログとして残す場合はここで別テーブルに insert するなどの処理を追加

    return NextResponse.json({ ok: true, updated });
  } catch (err: any) {
    console.error('admin POST error:', err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // DELETE は targetUserId を body で受け取り、管理者権限の剥奪を行う（revoke）
    const supabase = createClient();

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || null;

    const { user, error: userErr } = await getUserFromToken(supabase, token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { data: callerRow } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (callerRow?.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const targetUserId = body?.userId;
    if (!targetUserId) return NextResponse.json({ error: 'invalid payload' }, { status: 400 });

    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update({ role: 'student' })
      .eq('id', targetUserId)
      .select('id, role')
      .single();

    if (updateErr) return NextResponse.json({ error: 'failed to revoke admin', detail: updateErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, updated });
  } catch (err: any) {
    console.error('admin DELETE error:', err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
