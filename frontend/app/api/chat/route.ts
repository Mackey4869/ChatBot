import { NextResponse } from 'next/server';
import createServerClient from '@/lib/supabase.server';
import { generateEmbedding, generateChatResponse } from '@/lib/ai';

const supabaseServer = createServerClient();

/**
 * RAGチャットAPI
 * 1. 質問をベクトル化
 * 2. Supabaseで類似するチャンクを検索 (RPC: match_blog_sectionsを想定)
 * 3. 取得した断片をコンテキストとしてLLMに渡し、回答を生成
 */
export async function POST(req: Request) {
	try {
		const body = await req.json();
		const message = body?.message;

		if (!message || typeof message !== 'string') {
			return NextResponse.json({ error: 'メッセージを入力してください' }, { status: 400 });
		}

		// 1. ユーザーの質問をベクトル化
		const queryEmbedding = await generateEmbedding(message);

		// 2. Supabase の RPC を呼び出して類似チャンクを取得
		const { data: matchedSections, error: rpcError } = await supabaseServer.rpc(
			'match_blog_sections',
			{
				query_embedding: queryEmbedding,
				match_threshold: 0.3,
				match_count: 5,
			}
		);

		if (rpcError) {
			console.error('RPC Search Error:', rpcError);
			throw rpcError;
		}

		const sections = Array.isArray(matchedSections) ? matchedSections : [];

		// 3. 検索結果からコンテキストを構築
		const context = sections.length > 0
			? sections.map((s: any, idx: number) => `--- source #${idx + 1} ---\n${s.content}`).join('\n')
			: '関連する情報は見つかりませんでした。';

		// 4. LLM に投げて回答を生成
		const aiResponse = await generateChatResponse(message, context);

		return NextResponse.json({ answer: aiResponse, sources: sections });

	} catch (error: any) {
		console.error('Chat API Route Error:', error);
		return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
	}
}
