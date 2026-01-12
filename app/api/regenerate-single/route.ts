import { NextResponse } from "next/server";
import OpenAI from "openai";

type RegenerateRequest = {
    ingredients: any[];
    currentMenu: {
        main: string;
        side: string;
        soup: string;
    };
    mealType: string;
    existingMenus?: string[]; // 現在の全献立（主菜名リスト）を受け取る
};

export async function POST(req: Request) {
    try {
        const { ingredients, currentMenu, mealType, existingMenus = [], history = [], banned = [], otherUsage = [], option = "" } = await req.json();

        if (!ingredients || !currentMenu) {
            return NextResponse.json(
                { error: "Invalid request data" },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        const client = new OpenAI({ apiKey });

        // 食事タイプ別の特別ルール
        const mealTypeRules: Record<string, string> = {
            "breakfast": `
**【朝食の特別ルール】**
- 朝にふさわしい料理を提案してください
- 準備時間が短く、手軽に食べられるもの
- 例: 卵料理、トースト、おにぎり、サラダ、味噌汁
`,
            "lunch": `
**【昼食の特別ルール】**
- 昼にふさわしいボリュームのある料理を提案してください
- 午後の活力になるような献立
`,
            "dinner": `
**【夕食の特別ルール】**
- 一日のメイン食事として、しっかりとした献立を提案してください
- 主菜・副菜・汁物のバランスを重視
`,
            "snack": `
**【おやつ・間食の特別ルール】**
- 軽いスナックやデザートを提案してください
- 軽食向きのメニュー（サンドイッチ、フルーツ、軽い麺類など）
`,
            "night_snack": `
**【夜食の特別ルール】**
- **軽めの夜食**を提案してください
- 消化に良く、寝る前に適した軽い料理
- 例: お茶漬け、うどん、雑炊、軽いスープ、サンドイッチ
- 重い料理や揚げ物は避けてください
`
        };

        // snack/night_snack は主菜のみ
        const isSnackType = mealType === "snack" || mealType === "night_snack";

        const systemPrompt = `
あなたはプロの料理研究家です。
ユーザーは現在の提案された献立（${mealType}）を気に入っていません。
**同じ食材リスト**を使って、**別の献立**を再提案してください。

${isSnackType ? `
**【間食・夜食の特別ルール】**
- これは間食または夜食です。**主菜のみ**を提案してください。
- 副菜・汁物は不要です。
` : `
**通常の食事**として、1食分（主菜・副菜・汁物）を再提案してください。
`}

**考慮事項:**
1. **在庫の有効活用**: 
   - これが現在の冷蔵庫在庫です。
   - すでに他の食事で確保されている食材もあります（後述）。
   - 可能であれば、**「残っている在庫」**を優先的に使ってください。
2. **バラエティ**: 他の日程の献立と被らないようにしてください。
3. **意外性**: 前回と同じような料理は避けてください。

**制約事項:**
1. **出力はJSON形式のみ**。
2. 以下の形式で出力:
${isSnackType ? `
   {
     "menu": {
       "main": "新・料理名"
     },
     "ingredients": ["食材A: 2個", "醤油: 大さじ2"] 
   }
   - **注意**: 間食・夜食なので side と soup は**出力しないでください**
` : `
   {
     "menu": {
       "main": "新・主菜名",
       "side": "新・副菜名",
       "soup": "新・汁物名"
     },
     "ingredients": ["食材A: 2個", "食材B: 1/4パック", "醤油: 大さじ2"] 
   }
`}
   - **重要**: 「ingredients」には、その料理を作るために必要な**すべての食材**をリストアップしてください。（在庫の有無は気にせず、必要なものを全て書いてください）
   - **数量の書き方**: 「大さじ2」「小さじ1」のように単位を先に書いてください（❌「2大さじ」は不可）
   - **曖昧な表現禁止**: 「残り全部」「適宜」「ひとつかみ」は使わず、具体的な数量を書いてください。少量の場合は「少々」か「適量」を使用。

3. **禁止**: 以下のリストにある料理（またはそれに類似しすぎる料理）は提案しないでください。

【現在のアクティブな献立(重複NG)】: ${existingMenus.join(", ")}
【今回見送った料理(一時的NG)】: ${history.join(", ")}
【苦手・禁止リスト(恒久的NG)】: ${banned.join(", ")}

4. 前回のメニュー（${currentMenu.main}）とも当然違うものを提案してください。

**重視するスタイル/要望:** ${option || "バランス良く"}

${option === "キャンプ飯" ? `
**【キャンプ飯の特別ルール】**
キャンプらしい料理を提案してください：
- 焚き火・バーベキュー・スキレット・ダッチオーブン・ホットサンドメーカーで作れる料理
- ワイルドで豪快な料理を優先
- 洗い物が少なくて済む一品料理
` : ""}

${mealTypeRules[mealType] || ""}
    `.trim();

        const userPrompt = `
【元の冷蔵庫の在庫リスト】
${ingredients.map((i: any) => `- ${i.name} (${i.quantity})`).join("\n")}

※ ここから「他の食事確保分」を引いた残りで考えてください。

【現在の提案（却下）】
Main: ${currentMenu.main}
Side: ${currentMenu.side}
Soup: ${currentMenu.soup}

代わりの献立を提案してください。
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
        if (!content) throw new Error("No content");

        const result = JSON.parse(content);
        return NextResponse.json({ result: result });

    } catch (error) {
        console.error("Error regenerating single meal:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
