import { NextResponse } from "next/server";
import OpenAI from "openai";

type RecalculateRequest = {
    ingredients: any[];
    menuDays: any[];
    people: number;
};

// カテゴリ定義 (調味料は最後に表示)
const CATEGORIES = ["野菜", "きのこ類", "肉類", "魚介類", "乳製品", "卵", "豆腐・大豆製品", "穀物・麺類", "その他", "調味料"] as const;
type Category = typeof CATEGORIES[number];

// 1. AIが返す生データの型（変換前）
type RawAIItem = {
    name: string;        // 食材名 (例: "人参")
    raw_quantity: string; // 生の数量文字列 (例: "1パック", "1/2本")
};

type RawAIResponse = {
    required_items: RawAIItem[];
    fridge_items: RawAIItem[];
};

// 2. TypeScriptで正規化した後のデータ型
type NormalizedItem = {
    name: string;     // 食材名 (例: "人参")
    amount: number;   // 数量 (例: 1.5)
    unit: string;     // 単位 (例: "本", "g", "パック")
    category: Category; // カテゴリ (例: "野菜")
};

// ========================================
// TypeScript 変換テーブル（AIに依存しない）
// ========================================

type ConversionRule = {
    baseUnit: string;
    conversions: Record<string, number>; // unit -> baseUnit の倍率
    aliases: string[]; // 別名リスト
    category: Category;
};

const CONVERSION_TABLE: Record<string, ConversionRule> = {
    "ソーセージ": {
        baseUnit: "本",
        conversions: { "パック": 5, "袋": 5 },
        aliases: ["ウインナー", "フランクフルト", "ポークビッツ"],
        category: "肉類"
    },
    "ベーコン": {
        baseUnit: "枚",
        conversions: { "パック": 10 },
        aliases: [],
        category: "肉類"
    },
    "卵": {
        baseUnit: "個",
        conversions: { "パック": 10 },
        aliases: ["たまご", "玉子"],
        category: "卵"
    },
    "しめじ": {
        baseUnit: "パック",
        conversions: { "袋": 1 },
        aliases: [],
        category: "きのこ類"
    },
    "えのき": {
        baseUnit: "パック",
        conversions: { "袋": 1 },
        aliases: ["えのきだけ", "えのき茸"],
        category: "きのこ類"
    },
    "しいたけ": {
        baseUnit: "パック",
        conversions: { "袋": 1, "個": 0.15 }, // 約6-7個でパック
        aliases: ["椎茸"],
        category: "きのこ類"
    },
    "もやし": {
        baseUnit: "パック",
        conversions: { "袋": 1 },
        aliases: [],
        category: "野菜"
    }
};

// ========================================
// カテゴリ分類マップ（変換不要だがカテゴリ必要な食材）
// ========================================
const CATEGORY_MAP: Record<string, Category> = {
    // 野菜
    "じゃがいも": "野菜", "ジャガイモ": "野菜", "じゃが芋": "野菜", "馬鈴薯": "野菜",
    "人参": "野菜", "にんじん": "野菜", "ニンジン": "野菜",
    "玉ねぎ": "野菜", "たまねぎ": "野菜", "タマネギ": "野菜",
    "大根": "野菜", "だいこん": "野菜",
    "キャベツ": "野菜", "きゃべつ": "野菜",
    "白菜": "野菜", "はくさい": "野菜",
    "レタス": "野菜", "れたす": "野菜",
    "トマト": "野菜", "とまと": "野菜", "ミニトマト": "野菜",
    "きゅうり": "野菜", "キュウリ": "野菜", "胡瓜": "野菜",
    "なす": "野菜", "ナス": "野菜", "茄子": "野菜",
    "ピーマン": "野菜", "ぴーまん": "野菜", "パプリカ": "野菜",
    "ほうれん草": "野菜", "ホウレンソウ": "野菜", "ほうれんそう": "野菜",
    "小松菜": "野菜", "こまつな": "野菜",
    "ブロッコリー": "野菜", "ぶろっこりー": "野菜",
    "かぼちゃ": "野菜", "カボチャ": "野菜", "南瓜": "野菜",
    "ごぼう": "野菜", "ゴボウ": "野菜", "牛蒡": "野菜",
    "れんこん": "野菜", "レンコン": "野菜", "蓮根": "野菜",
    "ねぎ": "野菜", "ネギ": "野菜", "長ネギ": "野菜", "長ねぎ": "野菜",
    "青ネギ": "野菜", "万能ねぎ": "野菜",
    "ニラ": "野菜", "にら": "野菜", "韮": "野菜",
    "アスパラ": "野菜", "アスパラガス": "野菜",
    "さつまいも": "野菜", "サツマイモ": "野菜", "薩摩芋": "野菜",
    "里芋": "野菜", "さといも": "野菜",
    "にんにく": "野菜", "ニンニク": "野菜", "大蒜": "野菜",
    "生姜": "野菜", "しょうが": "野菜", "ショウガ": "野菜",
    "大葉": "野菜", "しそ": "野菜", "紫蘇": "野菜",
    "水菜": "野菜", "みずな": "野菜",
    "セロリ": "野菜", "せろり": "野菜",
    "オクラ": "野菜", "おくら": "野菜",
    "ズッキーニ": "野菜",
    "アボカド": "野菜",

    // きのこ類
    "きのこ": "きのこ類", "キノコ": "きのこ類",
    "まいたけ": "きのこ類", "マイタケ": "きのこ類", "舞茸": "きのこ類",
    "エリンギ": "きのこ類", "えりんぎ": "きのこ類",
    "マッシュルーム": "きのこ類", "ましゅるーむ": "きのこ類",
    "なめこ": "きのこ類", "ナメコ": "きのこ類",
    "きくらげ": "きのこ類", "キクラゲ": "きのこ類", "木耳": "きのこ類",

    // 肉類
    "豚肉": "肉類", "ぶたにく": "肉類", "豚バラ": "肉類", "豚ロース": "肉類", "豚こま": "肉類",
    "鶏肉": "肉類", "とりにく": "肉類", "鶏もも": "肉類", "鶏モモ": "肉類", "鶏もも肉": "肉類", "鶏むね": "肉類", "鶏むね肉": "肉類", "鶏胸肉": "肉類", "鶏ささみ": "肉類", "ささみ": "肉類",
    "牛肉": "肉類", "ぎゅうにく": "肉類", "牛バラ": "肉類", "ビーフステーキ": "肉類", "ステーキ": "肉類", "ステーキ肉": "肉類",
    "ひき肉": "肉類", "挽き肉": "肉類", "ミンチ": "肉類", "ミンチ肉": "肉類", "合挽き": "肉類", "合いびき": "肉類", "合挽き肉": "肉類", "合びき肉": "肉類", "豚ひき肉": "肉類", "鶏ひき肉": "肉類", "牛ひき肉": "肉類", "牛豚合挽き": "肉類",
    "ハム": "肉類", "はむ": "肉類",
    "手羽元": "肉類", "手羽先": "肉類",

    // 魚介類
    "鮭": "魚介類", "さけ": "魚介類", "サーモン": "魚介類",
    "さば": "魚介類", "サバ": "魚介類", "鯖": "魚介類",
    "まぐろ": "魚介類", "マグロ": "魚介類", "鮪": "魚介類",
    "えび": "魚介類", "エビ": "魚介類", "海老": "魚介類",
    "いか": "魚介類", "イカ": "魚介類", "烏賊": "魚介類",
    "たこ": "魚介類", "タコ": "魚介類", "蛸": "魚介類",
    "あさり": "魚介類", "アサリ": "魚介類", "浅蜊": "魚介類",
    "しじみ": "魚介類", "シジミ": "魚介類",
    "たら": "魚介類", "タラ": "魚介類", "鱈": "魚介類",
    "ぶり": "魚介類", "ブリ": "魚介類", "鰤": "魚介類",
    "あじ": "魚介類", "アジ": "魚介類", "鯵": "魚介類",
    "ちくわ": "魚介類", "竹輪": "魚介類",
    "かまぼこ": "魚介類", "蒲鉾": "魚介類",
    "かに": "魚介類", "カニ": "魚介類", "蟹": "魚介類", "カニカマ": "魚介類",
    "ツナ": "魚介類", "ツナ缶": "魚介類", "シーチキン": "魚介類",

    // 乳製品
    "牛乳": "乳製品", "ぎゅうにゅう": "乳製品", "ミルク": "乳製品",
    "チーズ": "乳製品", "ちーず": "乳製品", "スライスチーズ": "乳製品", "とろけるチーズ": "乳製品", "ピザ用チーズ": "乳製品", "モッツァレラチーズ": "乳製品", "クリームチーズ": "乳製品", "カマンベールチーズ": "乳製品", "チェダーチーズ": "乳製品",
    "バター": "乳製品", "ばたー": "乳製品",
    "ヨーグルト": "乳製品", "よーぐると": "乳製品",
    "生クリーム": "乳製品", "クリーム": "乳製品",

    // 豆腐・大豆製品
    "豆腐": "豆腐・大豆製品", "とうふ": "豆腐・大豆製品",
    "絹ごし豆腐": "豆腐・大豆製品", "木綿豆腐": "豆腐・大豆製品",
    "納豆": "豆腐・大豆製品", "なっとう": "豆腐・大豆製品",
    "油揚げ": "豆腐・大豆製品", "あぶらあげ": "豆腐・大豆製品",
    "厚揚げ": "豆腐・大豆製品", "あつあげ": "豆腐・大豆製品",
    "豆乳": "豆腐・大豆製品", "とうにゅう": "豆腐・大豆製品",
    "大豆": "豆腐・大豆製品", "だいず": "豆腐・大豆製品",
    "がんもどき": "豆腐・大豆製品", "がんも": "豆腐・大豆製品",
    "おから": "豆腐・大豆製品",

    // 穀物・麺類
    "米": "穀物・麺類", "こめ": "穀物・麺類", "ご飯": "穀物・麺類", "ごはん": "穀物・麺類",
    "パン": "穀物・麺類", "ぱん": "穀物・麺類", "食パン": "穀物・麺類", "フランスパン": "穀物・麺類", "バゲット": "穀物・麺類", "バンズ": "穀物・麺類", "ハンバーガーバンズ": "穀物・麺類",
    "うどん": "穀物・麺類", "ウドン": "穀物・麺類",
    "そば": "穀物・麺類", "蕎麦": "穀物・麺類",
    "パスタ": "穀物・麺類", "スパゲッティ": "穀物・麺類", "スパゲティ": "穀物・麺類",
    "ラーメン": "穀物・麺類", "中華麺": "穀物・麺類",
    "そうめん": "穀物・麺類", "素麺": "穀物・麺類",
    "餅": "穀物・麺類", "もち": "穀物・麺類",
    "小麦粉": "穀物・麺類", "薄力粉": "穀物・麺類", "強力粉": "穀物・麺類",
    "片栗粉": "穀物・麺類",

    // 調味料
    "醤油": "調味料", "しょうゆ": "調味料", "しょう油": "調味料",
    "味噌": "調味料", "みそ": "調味料", "ミソ": "調味料",
    "塩": "調味料", "しお": "調味料",
    "砂糖": "調味料", "さとう": "調味料",
    "酢": "調味料", "す": "調味料", "お酢": "調味料",
    "みりん": "調味料", "ミリン": "調味料", "味醂": "調味料",
    "酒": "調味料", "料理酒": "調味料", "日本酒": "調味料",
    "油": "調味料", "サラダ油": "調味料", "ごま油": "調味料", "オリーブオイル": "調味料",
    "マヨネーズ": "調味料", "まよねーず": "調味料",
    "ケチャップ": "調味料", "けちゃっぷ": "調味料",
    "ソース": "調味料", "中濃ソース": "調味料", "ウスターソース": "調味料",
    "めんつゆ": "調味料", "麺つゆ": "調味料",
    "だし": "調味料", "出汁": "調味料", "顆粒だし": "調味料", "ほんだし": "調味料",
    "コンソメ": "調味料", "コンソメキューブ": "調味料", "顆粒コンソメ": "調味料",
    "鶏ガラスープ": "調味料", "鶏がらスープ": "調味料",
    "こしょう": "調味料", "コショウ": "調味料", "胡椒": "調味料",
    "わさび": "調味料", "からし": "調味料", "マスタード": "調味料",
    "ポン酢": "調味料", "ぽんず": "調味料",
    "オイスターソース": "調味料",
    "豆板醤": "調味料", "トウバンジャン": "調味料",
    "甜麺醤": "調味料", "テンメンジャン": "調味料",
    "カレー粉": "調味料", "カレールー": "調味料",
    "シチューの素": "調味料", "シチュールー": "調味料",
    "粉チーズ": "調味料", "パルメザンチーズ": "調味料",
    "バーベキューソース": "調味料", "BBQソース": "調味料",
    "白ワイン": "調味料", "赤ワイン": "調味料", "ワイン": "調味料",
    "オリーブ油": "調味料", "サフラン": "調味料"
};

// 名前の別名→正規名変換マップを構築
const NAME_ALIAS_MAP: Record<string, string> = {};
Object.entries(CONVERSION_TABLE).forEach(([canonicalName, rule]) => {
    rule.aliases.forEach(alias => {
        NAME_ALIAS_MAP[alias] = canonicalName;
    });
});

/**
 * 食材名を正規化（別名を統一）
 */
function normalizeIngredientName(name: string): string {
    return NAME_ALIAS_MAP[name] || name;
}

/**
 * 生の数量文字列をパース
 * 例: "1パック" -> { amount: 1, unit: "パック" }
 * 例: "1/2本" -> { amount: 0.5, unit: "本" }
 */
function parseQuantity(raw: string): { amount: number; unit: string } {
    if (!raw || raw === "数量不明") {
        return { amount: 0, unit: "適量" };
    }

    // 大さじ/小さじ パターン: 単位が数字の前にある (例: 大さじ2, 小さじ1/2)
    const tbspMatch = raw.match(/^(大さじ|小さじ)([\d.]+(?:\/\d+)?)$/);
    if (tbspMatch) {
        const unit = tbspMatch[1];
        const numStr = tbspMatch[2];
        let amount: number;
        // 分数の場合 (例: 1/2)
        if (numStr.includes('/')) {
            const [num, denom] = numStr.split('/');
            amount = parseFloat(num) / parseFloat(denom);
        } else {
            amount = parseFloat(numStr);
        }
        return { amount, unit };
    }

    // 分数パターン: 1/2, 1/4 など
    const fractionMatch = raw.match(/^(\d+)\/(\d+)\s*(.*)$/);
    if (fractionMatch) {
        const amount = parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
        const unit = fractionMatch[3] || "個";
        return { amount, unit };
    }

    // 小数パターン: 0.5パック など
    const decimalMatch = raw.match(/^([\d.]+)\s*(.*)$/);
    if (decimalMatch) {
        const amount = parseFloat(decimalMatch[1]);
        const unit = decimalMatch[2] || "個";
        return { amount, unit };
    }

    // 適量、少々など
    if (raw.includes("適量") || raw.includes("少々") || raw.includes("適宜")) {
        return { amount: 0, unit: "適量" };
    }

    return { amount: 1, unit: raw };
}

/**
 * 食材を基本単位に正規化
 * 例: ソーセージ 1パック -> ソーセージ 5本
 */
function normalizeToBaseUnit(name: string, amount: number, unit: string): { amount: number; unit: string } {
    const rule = CONVERSION_TABLE[name];
    if (!rule) {
        return { amount, unit }; // 変換ルールがなければそのまま
    }

    // すでに基本単位の場合
    if (unit === rule.baseUnit) {
        return { amount, unit };
    }

    // 変換係数を適用
    const multiplier = rule.conversions[unit];
    if (multiplier !== undefined) {
        return {
            amount: Math.round(amount * multiplier * 100) / 100,
            unit: rule.baseUnit
        };
    }

    return { amount, unit }; // 変換ルールがなければそのまま
}

/**
 * 食材のカテゴリを取得
 */
function getIngredientCategory(name: string): Category {
    // 1. CONVERSION_TABLE をチェック（変換ルールがあるもの）
    const rule = CONVERSION_TABLE[name];
    if (rule) return rule.category;

    // 2. CATEGORY_MAP をチェック（カテゴリのみ定義されているもの）
    const category = CATEGORY_MAP[name];
    if (category) return category;

    // 3. デフォルトは「その他」
    return "その他";
}

export const maxDuration = 60; // タイムアウト延長

export async function POST(req: Request) {
    try {
        const { ingredients, menuDays, people } = await req.json();

        if (!menuDays || !ingredients) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        const client = new OpenAI({ apiKey });

        // ============================================
        // Phase 1: AI は「抽出のみ」担当（変換しない）
        // ============================================
        const systemPrompt = `
あなたは食材データの抽出エンジンです。
与えられた「献立」と「冷蔵庫の在庫」から、食材名と数量を**そのまま**抽出してください。

**重要なルール:**
1. **変換禁止**: 単位の変換や計算は一切しないでください
2. **生データ抽出**: 入力されたままの形式で出力してください
3. **名前の統一のみ行う**:
   - 「ウインナー」「フランクフルト」→「ソーセージ」
   - 「たまご」「玉子」→「卵」
   - 「人参」「にんじん」→「人参」

**出力フォーマット (JSONのみ):**
{
  "required_items": [
    { "name": "人参", "raw_quantity": "1本" },
    { "name": "ソーセージ", "raw_quantity": "4本" }
  ],
  "fridge_items": [
    { "name": "人参", "raw_quantity": "2本" },
    { "name": "ソーセージ", "raw_quantity": "1パック" }
  ]
}

**注意:**
- 献立の各メニューに書かれている食材を全てリストアップしてください
- 同じ食材が複数回出てきても、それぞれ別のエントリとして出力してください（後でTypeScriptが集計します）
- 「適量」「少々」なども raw_quantity としてそのまま出力してください
`.trim();

        // 必要な情報（食材リスト）を含めて渡す
        const simplifiedMenu = menuDays.map((day: any) => ({
            day_label: day.day_label,
            meals: Object.values(day.meals).map((m: any) => ({
                name: m.main,
                ingredients: m.ingredients
            }))
        }));

        const userPrompt = `
【冷蔵庫の在庫】
${ingredients.map((i: any) => `- ${i.name}: ${i.quantity}`).join("\n")}

【献立リスト】
${JSON.stringify(simplifiedMenu, null, 2)}

上記から食材データを抽出してください。変換は不要です。
`;

        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content");

        const aiData: RawAIResponse = JSON.parse(content);

        // ============================================
        // Phase 2: TypeScript で変換＆計算（確実）
        // ============================================

        // Step 1: 生データを正規化（parseQuantity + normalizeToBaseUnit）
        const normalizedRequired: NormalizedItem[] = aiData.required_items.map((item: RawAIItem) => {
            const canonicalName = normalizeIngredientName(item.name);
            const parsed = parseQuantity(item.raw_quantity);
            const normalized = normalizeToBaseUnit(canonicalName, parsed.amount, parsed.unit);
            const category = getIngredientCategory(canonicalName);
            return {
                name: canonicalName,
                amount: normalized.amount,
                unit: normalized.unit,
                category: category
            };
        });

        const normalizedFridge: NormalizedItem[] = aiData.fridge_items.map((item: RawAIItem) => {
            const canonicalName = normalizeIngredientName(item.name);
            const parsed = parseQuantity(item.raw_quantity);
            const normalized = normalizeToBaseUnit(canonicalName, parsed.amount, parsed.unit);
            const category = getIngredientCategory(canonicalName);
            return {
                name: canonicalName,
                amount: normalized.amount,
                unit: normalized.unit,
                category: category
            };
        });

        // Step 2: 必要量の集計 (Total Required)
        const totalRequired = aggregateItems(normalizedRequired);

        // Step 3: 冷蔵庫の在庫整理
        const fridgeStock = aggregateItems(normalizedFridge);

        // Step 4: 差分計算 (Total - Stock)
        const { shoppingList, usageList } = calculateDiff(totalRequired, fridgeStock);

        // 5. カテゴリ別にグループ化して文字列化
        const categorizedShoppingList = formatListByCategory(shoppingList);
        const categorizedUsageList = formatListByCategory(usageList);

        return NextResponse.json({
            result: {
                total_shopping_list: categorizedShoppingList,
                total_fridge_usage: categorizedUsageList,
                updates: []
            }
        });

    } catch (error) {
        console.error("Recalculate Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// --- Helper Functions ---

// アイテムを集計する (名前と単位が一致するものを足し合わせる)
function aggregateItems(items: NormalizedItem[]): NormalizedItem[] {
    const map = new Map<string, NormalizedItem>();

    items.forEach(item => {
        const key = `${item.name}__${item.unit}`;
        if (!map.has(key)) {
            map.set(key, { ...item });
        } else {
            const existing = map.get(key)!;
            existing.amount += item.amount;
        }
    });

    return Array.from(map.values());
}

// 差分計算ロジック（改善版）
function calculateDiff(required: NormalizedItem[], fridge: NormalizedItem[]) {
    const shoppingList: NormalizedItem[] = [];
    const usageList: NormalizedItem[] = [];

    // 冷蔵庫在庫をコピーして使用可能量を管理
    const fridgeStock = new Map<string, { amount: number; unit: string; category: Category }>();
    fridge.forEach(item => {
        const key = `${item.name}__${item.unit}`;
        if (fridgeStock.has(key)) {
            const existing = fridgeStock.get(key)!;
            existing.amount += item.amount;
        } else {
            fridgeStock.set(key, { amount: item.amount, unit: item.unit, category: item.category });
        }
    });

    // 名前のみでも検索できるようにインデックスを作成
    const fridgeByName = new Map<string, string[]>(); // name -> [keys]
    fridge.forEach(item => {
        const key = `${item.name}__${item.unit}`;
        if (!fridgeByName.has(item.name)) {
            fridgeByName.set(item.name, []);
        }
        if (!fridgeByName.get(item.name)!.includes(key)) {
            fridgeByName.get(item.name)!.push(key);
        }
    });

    // 必要な食材ごとに処理
    required.forEach(reqItem => {
        const exactKey = `${reqItem.name}__${reqItem.unit}`;

        // 1. 完全一致（名前＋単位）を優先
        if (fridgeStock.has(exactKey)) {
            const stock = fridgeStock.get(exactKey)!;

            if (stock.amount >= reqItem.amount) {
                // 全量を冷蔵庫から使用
                usageList.push({ ...reqItem });
                stock.amount -= reqItem.amount;
            } else {
                // 一部を冷蔵庫から、残りを買い出し
                if (stock.amount > 0) {
                    usageList.push({
                        name: reqItem.name,
                        amount: stock.amount,
                        unit: reqItem.unit,
                        category: reqItem.category
                    });
                    const missing = reqItem.amount - stock.amount;
                    shoppingList.push({
                        name: reqItem.name,
                        amount: Math.round(missing * 100) / 100,
                        unit: reqItem.unit,
                        category: reqItem.category
                    });
                    stock.amount = 0;
                } else {
                    shoppingList.push({ ...reqItem });
                }
            }
        }
        // 2. 名前のみ一致を試みる（単位が違う場合のフォールバック）
        else if (fridgeByName.has(reqItem.name)) {
            const possibleKeys = fridgeByName.get(reqItem.name)!;
            let matched = false;

            for (const key of possibleKeys) {
                const stock = fridgeStock.get(key);
                if (stock && stock.amount > 0) {
                    // 単位が違うので使用量として表示（元の単位で）
                    usageList.push({
                        name: reqItem.name,
                        amount: Math.min(stock.amount, reqItem.amount),
                        unit: stock.unit,
                        category: stock.category
                    });
                    matched = true;
                    stock.amount = 0; // 使い切りとして扱う
                    break;
                }
            }

            // 単位が違うため正確な計算ができない場合、買い出しリストにも追加
            if (!matched) {
                shoppingList.push({ ...reqItem });
            }
        }
        // 3. 冷蔵庫にない場合
        else {
            if (reqItem.amount > 0) {
                shoppingList.push({ ...reqItem });
            }
        }
    });

    // 買い出しリストを集計（同じ name+unit のものを合算）
    const aggregatedShoppingList = aggregateItems(shoppingList);

    // 使用リストを集計（同じ name+unit のものを合算）
    const aggregatedUsageList = aggregateItems(usageList);

    return { shoppingList: aggregatedShoppingList, usageList: aggregatedUsageList };
}

// カテゴリ別にグループ化して文字列リストを生成
function formatListByCategory(items: NormalizedItem[]): string[] {
    const categoryMap = new Map<Category, NormalizedItem[]>();

    // カテゴリごとにグループ化
    items.forEach(item => {
        const cat = item.category || "その他";
        if (!categoryMap.has(cat)) {
            categoryMap.set(cat, []);
        }
        categoryMap.get(cat)!.push(item);
    });

    const result: string[] = [];

    // 定義された順序でカテゴリを出力
    CATEGORIES.forEach(category => {
        if (categoryMap.has(category)) {
            const categoryItems = categoryMap.get(category)!;
            // カテゴリヘッダーを追加
            result.push(`【${category}】`);
            categoryItems.forEach(item => {
                const amountStr = item.amount.toString();
                if (item.unit === "適量" || item.unit === "少々" || item.unit === "適宜") {
                    result.push(`  ${item.name}: ${item.unit}`);
                } else if (["大さじ", "小さじ"].includes(item.unit)) {
                    // 調味料などは単位が先 (例: 大さじ1)
                    result.push(`  ${item.name}: ${item.unit}${amountStr}`);
                } else {
                    // その他は数量が先 (例: 1個, 200g)
                    result.push(`  ${item.name}: ${amountStr}${item.unit}`);
                }
            });
        }
    });

    return result;
}

// リストを文字列形式に戻す (冷蔵庫使用分用、カテゴリなし)
function formatList(items: NormalizedItem[]): string[] {
    return items.map(item => {
        const amountStr = item.amount.toString();
        if (item.unit === "適量" || item.unit === "少々" || item.unit === "適宜") {
            return `${item.name}: ${item.unit}`;
        } else if (["大さじ", "小さじ"].includes(item.unit)) {
            return `${item.name}: ${item.unit}${amountStr}`;
        }
        return `${item.name}: ${amountStr}${item.unit}`;
    });
}
