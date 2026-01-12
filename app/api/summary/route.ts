import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
    try {
        const { menuDays } = await req.json();

        if (!menuDays || !Array.isArray(menuDays)) {
            return NextResponse.json(
                { error: "Invalid menu data" },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        const client = new OpenAI({ apiKey });

        const systemPrompt = `
あなたは食材計算の達人です。
渡された「数日分の献立データ」から、以下の2つのリストを作成してください。

1. **総買い出しリスト (Total Shopping List)**: 
   - 各食事の "ingredients_missing" をすべて合算してください。
   - 同じ食材は足し合わせてください（例: 「人参1本」+「人参2本」=「人参3本」）。
   - 単位が曖昧な場合も常識的な範囲で合算してください。

2. **総消費リスト (Total Usage from Fridge)**:
   - 各食事の "ingredients_used" をすべて合算してください。
   - これも同様に同じ食材はまとめてください。

**出力フォーマット (JSONのみ):**
{
  "total_shopping_list": ["食材名 (合計数量)", ...],
  "total_fridge_usage": ["食材名 (合計数量)", ...]
}
        `.trim();

        // 献立データをテキスト化して渡す（トークン節約のため要約）
        const menuText = JSON.stringify(menuDays);

        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `以下の献立データを集計してください:\n${menuText}` },
            ],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content received");

        const result = JSON.parse(content);
        return NextResponse.json({ result });

    } catch (error) {
        console.error("Error summarizing menu:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
