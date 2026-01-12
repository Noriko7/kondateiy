import { NextResponse } from "next/server";
import OpenAI from "openai";

type RecipeRequest = {
    mealName: string;
    side: string;
    soup: string;
    ingredients: string[];
    people: number;
};

type RecipeResponse = {
    mainRecipe: {
        name: string;
        steps: string[];
        tips: string;
        cookingTime: string;
    };
    sideRecipe: {
        name: string;
        steps: string[];
        cookingTime: string;
    };
    soupRecipe: {
        name: string;
        steps: string[];
        cookingTime: string;
    };
};

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { mealName, side, soup, ingredients, people } = await req.json();

        if (!mealName) {
            return NextResponse.json({ error: "Meal name is required" }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
        }

        const client = new OpenAI({ apiKey });

        const systemPrompt = `
あなたはプロの料理研究家です。
指定された料理のレシピ（作り方）を分かりやすく説明してください。

**ルール:**
1. 手順は番号付きで、簡潔に書いてください。
2. 初心者でも分かるように、具体的な時間や火加減を記載してください。
3. コツやポイントがあれば教えてください。
4. **全ての料理に調理時間の目安を「約○分」の形式で記載してください。**

**出力フォーマット (JSONのみ):**
{
  "mainRecipe": {
    "name": "主菜名",
    "steps": [
      "1. 材料を切る。人参は乱切り、玉ねぎは薄切りにする。",
      "2. フライパンに油を熱し、中火で肉を炒める（3分）。",
      ...
    ],
    "tips": "肉は常温に戻してから調理すると柔らかく仕上がります。",
    "cookingTime": "約25分"
  },
  "sideRecipe": {
    "name": "副菜名",
    "steps": ["1. ...", "2. ..."],
    "cookingTime": "約10分"
  },
  "soupRecipe": {
    "name": "汁物名",
    "steps": ["1. ...", "2. ..."],
    "cookingTime": "約15分"
  }
}
`.trim();

        const userPrompt = `
【作りたい献立】
- 主菜: ${mealName}
- 副菜: ${side || "なし"}
- 汁物: ${soup || "なし"}

【使う材料】
${ingredients.join(", ")}

【人数】
${people}人分

上記の献立のレシピを教えてください。
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

        const result: RecipeResponse = JSON.parse(content);
        return NextResponse.json({ result });

    } catch (error) {
        console.error("Recipe API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
