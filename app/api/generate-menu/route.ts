import { NextResponse } from "next/server";
import OpenAI from "openai";

// 1食分の献立構造（材料も食事単位で持つ）
type MealSet = {
    main: string;
    side: string;
    soup: string;
    ingredients_used: string[]; // この食事で使った在庫
    ingredients_missing: string[]; // この食事で足りなくて買うもの
};

// 1日分の献立構造
type DayMenu = {
    day_label: string;
    meals: Record<string, MealSet>; // "breakfast", "lunch", "dinner", "snack", "night_snack"
};

type GenerateMenuResponse = {
    days: DayMenu[];
};

export async function POST(req: Request) {
    try {
        const {
            ingredients,
            days = 3,
            people = 2,
            mealTypes = ["dinner"],
            option = "",
            banned = []
        } = await req.json();

        if (!ingredients || !Array.isArray(ingredients)) {
            return NextResponse.json({ error: "Invalid ingredients data" }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
        }

        const client = new OpenAI({ apiKey });
        const mealKeysStr = mealTypes.map((t: string) => `"${t}"`).join(", ");

        const systemPrompt = `
あなたはプロの料理研究家兼フードロスアドバイザーです。
${days}日分の献立を作成してください。
対象人数: ${people}名

**======================================**
**最優先目標: 冷蔵庫の食材を確実に使い切る**
**======================================**

この献立は【2つのフェーズ】で構成してください：

【フェーズ1: 在庫消費フェーズ】（最初の1〜2日間）
- 冷蔵庫にある食材を**積極的に使い切る**献立を考えてください
- 例: 大根1本あれば → 大根サラダ、豚バラ大根、味噌汁の具として複数回使用
- 1つの食材を複数の料理に分けて使うことを推奨
- このフェーズでは「冷蔵庫にあるもの」を中心に献立を組む

【フェーズ2: バランス補完フェーズ】（残りの日数）
- 冷蔵庫食材を使い切った後は、**栄養バランスと彩り**を重視
- **重要: フェーズ1で使った冷蔵庫食材とは異なる、新しい食材を提案してください**
- 例: フェーズ1で豚肉・大根・卵を使ったなら → フェーズ2では鶏肉・ブロッコリー・豆腐など
- 買い物リストがシンプルになるよう、同じ新食材を複数日で使い回す
- バリエーション豊かな献立で飽きが来ないように工夫

**手順:**
1. まず冷蔵庫の在庫を確認し、何日分の献立が組めるか判断
2. フェーズ1で在庫を使い切る計画を立てる
3. フェーズ2で残りの日数をバランス良く埋める
4. それぞれの料理に**必要な食材をすべて**リストアップ（調味料含む）

**食材リストの書き方ルール:**
- 数量は「食材名: 数量単位」の形式で書いてください（例: 「玉ねぎ: 1個」「豚肉: 200g」）
- 調味料は「単位 + 数字」の順で書いてください（例: 「大さじ2」「小さじ1」、❌「2大さじ」は不可）
- 「残り全部」「適宜」「ひとつかみ」などの曖昧な表現は使わず、具体的な数量を書いてください
- 少量の場合は「少々」または「適量」を使用してください

**出力フォーマット (JSON形式のみ):**
{
  "days": [
    // ${days}日分の配列
    {
      "day_label": "1日目",
      "meals": {
        // 要求されたキー毎に記載
        "breakfast": { 
          "main": "主菜名", "side": "副菜名", "soup": "汁物名",
          "ingredients": ["鮭: 2切れ", "納豆: 2パック", "味噌: 大さじ2"]
        },
        // ... 他の指定された食事タイプ
      }
    },
    ...
  ]
}

**重要:** 
- JSONの配列数は必ず ${days} にすること。
- 指定された食事タイプ (${mealKeysStr}) のみを生成すること。

**【間食・夜食の特別ルール】**
- 食事タイプが "snack"（間食）または "night_snack"（夜食）の場合：
  - **主菜 (main) のみ**を提案してください
  - 副菜 (side) と汁物 (soup) は**空文字 ""**で返してください
  - 軽食やおやつ、夜食に適したメニューを提案
  - 例: { "main": "おにぎり", "side": "", "soup": "", "ingredients": [...] }

**重視するスタイル/要望:** ${option || "バランス良く、食材を使い切る工夫"}

${option === "キャンプ飯" ? `
**【キャンプ飯の特別ルール】**
キャンプらしい料理を提案してください：
- 焚き火・バーベキュー・スキレット・ダッチオーブン・ホットサンドメーカーで作れる料理
- 例: カレー、BBQ、ホイル焼き、スキレットパエリア、ホットサンド、焼き鳥、アヒージョ、燻製、チリコンカン、ジャンバラヤ、焼きマシュマロ、コーンバター
- ワイルドで豪快な料理を優先
- 洗い物が少なくて済む一品料理
- 缶詰や常温保存できる食材を活用
` : ""}

**禁止食材・料理リスト:**
以下の料理（またはそれに類似しすぎる料理）は提案しないでください（ユーザーの苦手・拒否リスト）:
${(banned || []).join(", ")}
    `.trim();

        const userPrompt = `
【現在の冷蔵庫の在庫】
${ingredients.map((i: any) => `- ${i.name} (${i.quantity})`).join("\n")}

【条件】
- 期間: ${days}日間
- 人数: ${people}人
- 必要な食事: ${mealTypes.join(", ")}

この条件で在庫シミュレーションを行いながら献立を作成してください。
    `.trim();

        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content received from OpenAI");

        let result: GenerateMenuResponse;
        try {
            result = JSON.parse(content);
        } catch (e) {
            console.error("JSON Parse Error:", content);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        return NextResponse.json({ result: result.days });
    } catch (error) {
        console.error("Error generating menu:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
