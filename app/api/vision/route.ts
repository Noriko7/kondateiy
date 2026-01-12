import { NextResponse } from "next/server";
import OpenAI from "openai";

// レスポンスの型定義（ドキュメント用）
// 実際にはAIが返すJSON文字列をパースしてこの形にする
type Ingredient = {
  name: string;
  quantity: string;
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { result: "画像ファイルが送信されていません。" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const systemPrompt = `
あなたは冷蔵庫の画像から「食材名」と「数量」のみを抽出する厳格なデータ入力マシーンです。
以下のルールを絶対に守ってください。

1. 出力は **JSON形式のみ** です。Markdownのコードブロックも不要です。
2. 以下のJSON構造で出力してください:
   [
     { "name": "食材名", "quantity": "数量" }
   ]
3. **禁止事項**:
   - 包装状態（「袋入り」「パック」など）は名前に入れない
   - ブランド名（「日本ハム」「サントリー」など）は含めない
   - 栄養素情報の記載禁止
   - 「冷蔵庫にあります」などの文章禁止
   - 推測によるコメント禁止
4. 数量が明確に見えない場合は "数量不明" としてください。
5. できるだけ一般的な名称（例：「シャウエッセン」→「ソーセージ」）に変換してください。
6. **単位のルール**（必ず守ること）:
   - 玉ねぎ、じゃがいも、トマト、りんご、みかん、卵 → 「個」を使う
   - にんじん、大根、ねぎ、きゅうり、ごぼう → 「本」を使う
   - キャベツ、レタス、白菜 → 「個」または「玉」を使う
   - 肉類 → 「g」または「パック」を使う
   - きのこ類（しめじ、えのき、まいたけ）→ 「パック」を使う
   - 豆腐 → 「丁」を使う
   - 牛乳、ジュース → 「本」または「パック」を使う
    `.trim();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "この画像の食材リストをJSONで出力せよ。",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1, // 決定論的挙動を強くする
    });

    const content = response.choices[0]?.message?.content;

    // JSON文字列のみを抽出（万が一Markdown記法が含まれていた場合への対策）
    let cleanJson = content || "[]";
    cleanJson = cleanJson.replace(/```json/g, "").replace(/```/g, "").trim();

    let ingredients: Ingredient[] = [];
    try {
      ingredients = JSON.parse(cleanJson);
    } catch (e) {
      console.error("JSON Parse Error:", content);
      // パース失敗時は空配列、またはエラーメッセージを含める設計も可だが、
      // ここでは仕様通り「食材のみ」を返すため、生テキストを無理やり返さずエラー扱いとするか、
      // あるいはAIが指示を無視した場合のフォールバックなどを検討する。
      // 今回は厳格なJSON指示をしているため、空配列で返すか、エラーとして処理する。
      return NextResponse.json({ result: [], error: "解析結果の形式が不正でした。" });
    }

    return NextResponse.json({ result: ingredients });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { result: [], error: "画像解析中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
