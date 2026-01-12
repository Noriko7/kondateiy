"use client";

import { useState, useEffect } from "react";

type PreviewImage = {
  file: File;
  preview: string;
};

type Ingredient = {
  name: string;
  quantity: string;
};

const QUANTITY_OPTIONS = [
  "1個", "2個", "3個", "4個", "5個", "6個", "7個", "8個", "9個", "10個",
  "1袋", "2袋",
  "1パック", "2パック",
  "1本", "2本", "3本",
  "1玉", "半分", "1/4", "1/8",
  "1束",
  "1枚", "2枚", "3枚", "4枚", "5枚",
  "100g", "150g", "200g", "250g", "300g", "350g", "400g", "450g", "500g",
  "少量", "多め", "残りわずか"
];

// 食品の数え方大百科に基づく単位辞書
const FOOD_UNIT_DICTIONARY: { [key: string]: string[] } = {
  // 葉物野菜
  "青じそ": ["枚", "束"], "大葉": ["枚", "束"],
  "かいわれ大根": ["パック", "本"], "かいわれ": ["パック", "本"],
  "キャベツ": ["玉", "個"], "小松菜": ["株", "束", "本"],
  "春菊": ["株", "束", "本"], "チンゲンサイ": ["株", "束", "把"],
  "豆苗": ["パック", "袋", "本"], "ニラ": ["束", "把", "本"], "にら": ["束", "把", "本"],
  "ねぎ": ["本", "束", "把"], "ネギ": ["本", "束", "把"], "長ネギ": ["本", "束"],
  "にんにく": ["個", "玉", "片"], "白菜": ["玉", "個"],
  "ほうれん草": ["株", "束", "本"], "水菜": ["株", "束", "把"],
  "レタス": ["玉", "個"],

  // 根菜野菜
  "かぶ": ["株", "玉", "束"], "蕪": ["株", "玉", "束"],
  "ごぼう": ["本", "束"], "さつまいも": ["本", "個"],
  "里芋": ["個", "袋"], "じゃがいも": ["個", "粒"],
  "しょうが": ["本", "かけ"], "生姜": ["本", "かけ"],
  "大根": ["本", "株"], "玉ねぎ": ["個", "玉"], "たまねぎ": ["個", "玉"],
  "長芋": ["本"], "山芋": ["本"], "にんじん": ["本", "個"], "人参": ["本", "個"],
  "れんこん": ["本", "節"],

  // 野菜・きのこ
  "アスパラガス": ["本", "束", "把"], "アスパラ": ["本", "束"],
  "えんどう豆": ["個", "粒", "莢"], "オクラ": ["本", "ネット"],
  "かぼちゃ": ["玉", "個"], "カリフラワー": ["個", "株", "房"],
  "きゅうり": ["本"], "さやいんげん": ["本", "莢"],
  "さやえんどう": ["本", "莢", "枚"], "ズッキーニ": ["本"],
  "そら豆": ["莢", "粒", "個"], "たけのこ": ["本", "枚", "個"],
  "とうがらし": ["本", "束", "袋"], "唐辛子": ["本", "束"],
  "とうもろこし": ["本", "粒"], "トマト": ["個", "玉"],
  "なす": ["本", "個"], "ナス": ["本", "個"],
  "ピーマン": ["個", "本"], "パプリカ": ["個", "本"],
  "ブロッコリー": ["株", "本", "房"], "みょうが": ["本", "個"],
  "もやし": ["袋", "パック"],
  "えのき": ["株", "パック"], "えのきたけ": ["株", "パック"],
  "しいたけ": ["パック"], "椎茸": ["パック"],
  "なめこ": ["パック"], "しめじ": ["パック", "株"],
  "まいたけ": ["パック", "株"], "舞茸": ["パック", "株"],
  "エリンギ": ["パック"],

  // 果物
  "アボカド": ["個", "玉"], "いちご": ["個", "粒", "パック"],
  "梅干し": ["個", "粒"], "オレンジ": ["個", "玉", "房"],
  "柿": ["個", "玉"], "干し柿": ["枚", "個", "玉"],
  "キウイ": ["個", "玉"], "金柑": ["個", "粒"], "きんかん": ["個", "粒"],
  "グレープフルーツ": ["個", "玉", "房"], "さくらんぼ": ["個", "粒", "房"],
  "スイカ": ["玉", "個", "切れ"], "梨": ["個", "玉"],
  "パイナップル": ["個", "本"], "バナナ": ["本", "房"],
  "ぶどう": ["房", "粒"], "みかん": ["個", "房"],
  "メロン": ["個", "玉"], "桃": ["個", "玉", "切れ"], "もも": ["個", "玉"],
  "りんご": ["個", "玉"], "レモン": ["個", "切れ"],

  // 種実類
  "アーモンド": ["個", "粒", "袋"], "銀杏": ["個", "粒", "本"],
  "栗": ["個", "粒"], "クルミ": ["個", "粒"], "くるみ": ["個", "粒"],
  "ごま": ["袋", "大さじ", "小さじ"], "落花生": ["個", "莢", "粒"],
  "ピーナッツ": ["個", "粒", "袋"],

  // その他食品
  "厚揚げ": ["枚", "丁", "袋"], "油揚げ": ["枚", "丁", "袋"],
  "豆腐": ["丁", "パック"], "絹ごし豆腐": ["丁", "パック"], "木綿豆腐": ["丁", "パック"],
  "納豆": ["パック", "個"], "あじ": ["匹", "尾", "枚", "切れ"],
  "あさり": ["パック", "個"], "いわし": ["匹", "尾", "枚"],
  "えび": ["匹", "尾", "本"], "海老": ["匹", "尾", "本"],
  "明太子": ["腹", "片", "本"], "ソーセージ": ["本", "袋", "パック"],
  "ウインナー": ["本", "袋", "パック"], "鶏ささみ": ["本", "枚"], "ささみ": ["本", "枚"],
  "鶏むね肉": ["枚"], "鶏もも肉": ["枚"], "鶏むね": ["枚"], "鶏もも": ["枚"],
  "ハム": ["枚", "本", "パック"], "ベーコン": ["枚", "パック"],
  "わかめ": ["本", "株", "g"], "卵": ["個", "玉", "粒"], "たまご": ["個", "玉"],
  "チーズ": ["個", "切れ", "枚", "本"], "スライスチーズ": ["枚", "パック"],
  "食パン": ["斤", "枚", "袋"], "フランスパン": ["本", "枚"],

  // 肉類（グラムで数える）
  "豚肉": ["g"], "牛肉": ["g"], "鶏肉": ["g"], "ひき肉": ["g"], "合い挽き肉": ["g"],
  "豚バラ": ["g"], "豚こま": ["g"], "切り落とし": ["g"], "豚ロース": ["g", "枚"],
  "牛こま": ["g"], "牛バラ": ["g"],

  // 魚介類
  "鮭": ["切れ", "匹"], "さば": ["切れ", "匹"], "鰯": ["匹", "尾"],
  "まぐろ": ["切れ", "柵"], "ぶり": ["切れ", "匹"], "たら": ["切れ", "匹"],
  "いか": ["杯", "本"], "たこ": ["杯", "本", "g"],
  "ちくわ": ["本", "袋"], "かまぼこ": ["本", "枚"],

  // 調味料
  "醤油": ["大さじ", "小さじ", "ml"], "しょうゆ": ["大さじ", "小さじ", "ml"],
  "味噌": ["大さじ", "小さじ", "g"], "みそ": ["大さじ", "小さじ", "g"],
  "砂糖": ["大さじ", "小さじ", "g"], "塩": ["小さじ", "g", "つまみ"],
  "みりん": ["大さじ", "小さじ", "ml"], "酒": ["大さじ", "小さじ", "ml"],
  "料理酒": ["大さじ", "小さじ", "ml"], "酢": ["大さじ", "小さじ", "ml"],
  "油": ["大さじ", "小さじ", "ml"], "サラダ油": ["大さじ", "小さじ"],
  "ごま油": ["大さじ", "小さじ"], "オリーブオイル": ["大さじ", "小さじ"],
  "マヨネーズ": ["大さじ", "小さじ"], "ケチャップ": ["大さじ", "小さじ"],
  "ソース": ["大さじ", "小さじ"], "コンソメ": ["個", "小さじ"],
  "顆粒だし": ["小さじ", "袋"], "鶏がらスープ": ["小さじ", "大さじ"],
  "片栗粉": ["大さじ", "小さじ", "g"], "小麦粉": ["大さじ", "小さじ", "g"],
  "バター": ["g", "大さじ"], "牛乳": ["ml", "パック"], "生クリーム": ["ml", "パック"],
  "ヨーグルト": ["パック", "g"],
};

// 食材名に応じた適切な数量候補を返す
const getFilteredQuantityOptions = (ingredientName: string): string[] => {
  const name = ingredientName;

  // 辞書から単位を検索
  for (const [food, units] of Object.entries(FOOD_UNIT_DICTIONARY)) {
    if (name.includes(food)) {
      // 単位に応じた数量オプションを生成
      const options: string[] = [];

      // パックや袋が含まれているかチェック
      const hasPackOrBag = units.some(u => u === "パック" || u === "袋");

      units.forEach(unit => {
        if (unit === "g") {
          options.push("100g", "150g", "200g", "250g", "300g", "400g", "500g");
        } else if (unit === "ml") {
          options.push("50ml", "100ml", "150ml", "200ml");
        } else if (unit === "大さじ") {
          options.push("大さじ1", "大さじ2", "大さじ3");
        } else if (unit === "小さじ") {
          options.push("小さじ1", "小さじ2", "小さじ1/2");
        } else {
          options.push(`1${unit}`, `2${unit}`, `3${unit}`);
        }
      });

      // パックや袋がない場合は分数を追加 (1/2, 1/4, 1/6, 1/8)
      if (!hasPackOrBag) {
        options.push("1/2", "1/4", "1/6", "1/8");
      }

      // 重複を除去して返す
      return [...new Set(options)].slice(0, 15);
    }
  }

  // デフォルト: よく使う単位を優先表示（曖昧な表現は削除）
  return ["1個", "2個", "1パック", "1本", "100g", "200g"];
};

const aggregateIngredients = (allLists: Ingredient[][]): Ingredient[] => {
  const map = new Map<string, string[]>();

  allLists.flat().forEach((item) => {
    const normalizedName = item.name.trim();
    if (!normalizedName) return;

    if (!map.has(normalizedName)) {
      map.set(normalizedName, []);
    }
    map.get(normalizedName)?.push(item.quantity);
  });

  const result: Ingredient[] = [];
  map.forEach((quantities, name) => {
    const validQuantities = quantities.filter((q) => q !== "数量不明");
    let finalQuantity = "数量不明";

    if (validQuantities.length > 0) {
      let maxVal = 0;
      let suffix = "";
      let hasNumber = false;

      for (const q of validQuantities) {
        const match = q.match(/(\d+)(.*)/);
        if (match) {
          const val = parseInt(match[1], 10);
          if (val > maxVal) {
            maxVal = val;
            suffix = match[2];
          }
          hasNumber = true;
        }
      }

      if (hasNumber) {
        finalQuantity = `${maxVal}${suffix || "個"}`;
      } else {
        finalQuantity = validQuantities[0];
      }
    }

    result.push({ name, quantity: finalQuantity });
  });

  return result;
};

// --- 型定義 ---
type MealSet = {
  main: string;
  side: string;
  soup: string;
  ingredients: string[];
};

type DayMenu = {
  day_label: string;
  meals: Record<string, MealSet>;
};

// --- レシピ型定義 ---
type RecipeData = {
  mainRecipe: {
    name: string;
    steps: string[];
    tips: string;
    cookingTime: string;
  };
  sideRecipe: {
    name: string;
    steps: string[];
    cookingTime?: string;
  };
  soupRecipe: {
    name: string;
    steps: string[];
    cookingTime?: string;
  };
};

type SavedRecipe = {
  id: string;
  mealName: string;
  side: string;
  soup: string;
  ingredients: string[];
  recipe: RecipeData;
  savedAt: string;
  menuId?: string;    // 関連する献立のID
  menuName?: string;  // 関連する献立の名前
};

export default function Home() {
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [rawResults, setRawResults] = useState<(Ingredient[] | null)[]>([]);
  const [aggregatedList, setAggregatedList] = useState<Ingredient[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [duration, setDuration] = useState<number>(3);
  const [peopleCount, setPeopleCount] = useState<number>(2);
  const [mealTypes, setMealTypes] = useState<Set<string>>(new Set(["dinner"]));
  const [optionStyle, setOptionStyle] = useState<string>("");

  const [menuResult, setMenuResult] = useState<DayMenu[] | null>(null);
  const [isGeneratingMenu, setIsGeneratingMenu] = useState(false);
  const [regeneratingTarget, setRegeneratingTarget] = useState<string | null>(null);
  const [bannedItems, setBannedItems] = useState<Set<string>>(new Set());   // 苦手リスト (永続)
  const [ignoredItems, setIgnoredItems] = useState<Set<string>>(new Set()); // 気分じゃないリスト (今回のみ)

  // 集計結果State
  const [summaryResult, setSummaryResult] = useState<{
    total_shopping_list: string[];
    total_fridge_usage: string[];
  } | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // レシピState
  const [currentRecipe, setCurrentRecipe] = useState<RecipeData | null>(null);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
  const [recipeModalMeal, setRecipeModalMeal] = useState<{ main: string; side: string; soup: string; ingredients: string[] } | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [showSavedRecipes, setShowSavedRecipes] = useState(false);

  // 献立保存State
  type SavedMenu = {
    id: string;
    name: string;
    days: DayMenu[];
    savedAt: string;
  };
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  const [showSavedMenus, setShowSavedMenus] = useState(false);
  const [currentMenuId, setCurrentMenuId] = useState<string | null>(null);
  const [currentMenuName, setCurrentMenuName] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const ALL_MEAL_TYPES = [
    { id: "breakfast", label: "朝食", color: "bg-[#FF9999]" }, // サーモンピンク
    { id: "lunch", label: "昼食", color: "bg-[#FFCC00] text-[#594A4E]" }, // イエロー（文字は茶色）
    { id: "dinner", label: "夕食", color: "bg-[#FF8000]" }, // ブランドオレンジ
    { id: "snack", label: "間食", color: "bg-[#FF99CC]" }, // ピンク
    { id: "night_snack", label: "夜食", color: "bg-[#9999CC]" }, // ラベンダー
  ];

  const handleSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    setRawResults((prev) => [...prev, ...newImages.map(() => null)]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setRawResults((prev) => prev.filter((_, i) => i !== index));
    if (aggregatedList.length > 0) {
      if (confirm("画像が変更されました。統合リストをクリアしますか？")) {
        setAggregatedList([]);
      }
    }
  };

  const handleAnalyzeAll = async () => {
    if (images.length === 0) return;

    setIsAnalyzing(true);
    setStatusMessage("解析を開始します...");
    setAggregatedList([]);

    const newRawResults = [...rawResults];
    const successes: Ingredient[][] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        setStatusMessage(`画像 ${i + 1} / ${images.length} を解析中...`);

        const formData = new FormData();
        formData.append("file", images[i].file);

        const res = await fetch("/api/vision", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) continue;

        const data = await res.json();
        if (Array.isArray(data.result)) {
          newRawResults[i] = data.result;
          successes.push(data.result);
        } else {
          newRawResults[i] = [];
        }
      }

      setRawResults(newRawResults);

      setStatusMessage("解析完了！データを統合中...");
      const integrated = aggregateIngredients(successes);
      setAggregatedList(integrated);
      setStatusMessage("");

    } catch (e) {
      console.error(e);
      setStatusMessage("エラーが発生しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteIngredient = (index: number) => {
    setAggregatedList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddIngredient = () => {
    setAggregatedList((prev) => [...prev, { name: "", quantity: "数量不明" }]);
  };

  const handleUpdateIngredient = (index: number, key: keyof Ingredient, value: string) => {
    setAggregatedList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const handleReset = () => {
    if (images.length === 0 && aggregatedList.length === 0) return;
    if (!confirm("すべての画像とデータを削除してリセットしますか？")) return;

    setImages([]);
    setRawResults([]);
    setAggregatedList([]);
    setStatusMessage("");
    setMenuResult(null);
    setSummaryResult(null);
    setBannedItems(new Set()); // 完全リセットなので禁止リストも消す
    setIgnoredItems(new Set());
  };

  const toggleMealType = (typeId: string) => {
    const newSet = new Set(mealTypes);
    if (newSet.has(typeId)) {
      newSet.delete(typeId);
    } else {
      newSet.add(typeId);
    }
    setMealTypes(newSet);
  };

  const handleGenerateMenu = async () => {
    if (aggregatedList.length === 0) return;
    if (mealTypes.size === 0) {
      alert("食事タイプを少なくとも1つ選択してください");
      return;
    }

    // 食材名チェック: 食材名が空で数量だけ入っている場合はブロック（先にチェック）
    const emptyNameItems = aggregatedList.filter(
      (item) => !item.name || item.name.trim() === "" || item.name === "食材名を入力"
    );

    if (emptyNameItems.length > 0) {
      setAlertMessage(`【重要】食材名が入力されていない行があります。\n食材名を入力するか、不要な行は削除してください。`);
      return;
    }

    // 数量チェック: 空欄または「数量不明」がある場合はブロック
    const invalidItems = aggregatedList.filter(
      (item) => !item.quantity || item.quantity.trim() === "" || item.quantity === "数量不明"
    );

    if (invalidItems.length > 0) {
      const names = invalidItems.map((i) => i.name).join("、");
      setAlertMessage(`以下の食材の数量が入力されていません。\n正確なリストを作るために、数量を入力してください。\n\n対象:\n${names}`);
      return;
    }

    setIsGeneratingMenu(true);
    setMenuResult(null);

    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

    try {
      const res = await fetch("/api/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: aggregatedList,
          days: duration,
          people: peopleCount,
          mealTypes: Array.from(mealTypes),
          option: optionStyle,
          banned: Array.from(bannedItems)
        }),
      });

      if (!res.ok) throw new Error("API Error");

      const data = await res.json();
      if (data.result) {
        setMenuResult(data.result);
      }
    } catch (e) {
      console.error(e);
      setAlertMessage("献立の生成に失敗しました。もう一度お試しください。");
    } finally {
      setIsGeneratingMenu(false);
    }
  };

  const handleRegenerateSingle = async (dayIndex: number, mealType: string, currentMenu: MealSet) => {
    const targetKey = `${dayIndex}-${mealType}`;
    setRegeneratingTarget(targetKey);

    // ----------------------------------------------------------------
    // 在庫整合性ロジック (Dynamic Budgeting)
    // ----------------------------------------------------------------
    // 1. 他のすべての食事で使用されている食材を集計
    const usedByOthers: Record<string, number> = {};
    const existingMainDishes: string[] = [];

    if (menuResult) {
      menuResult.forEach((day, dIdx) => {
        if (!day || !day.meals) return;
        Object.keys(day.meals).forEach(mType => {
          // 自分自身(targetKey)は除外する
          if (dIdx === dayIndex && mType === mealType) return;

          const meal = day.meals[mType];
          if (meal) {
            // 既存料理名の収集
            if (meal.main) existingMainDishes.push(meal.main);

            // 食材使用量の集計 (AIが返す ingredients_used は "人参 (1本)" のような文字列形式なので、簡易パースが必要)
            // ※ ここでは厳密なパースが難しいため、「文字列として使用済み」とAIに伝えるアプローチをとるか、
            //    あるいはシンプルに「API側で一括管理」させるかが本来は望ましい。
            //    今回はユーザー要望の「つじつま合わせ」のため、
            //    「現在使っている食材リスト」をAPIに送り、API側で引き算させるのが最も確実。
          }
        });
      });
    }

    // しかし、フロントエンドで文字列 "Carrot (2)" から数値 2 を引くのは困難。
    // そのため、戦略を変更:
    // APIに対して「Activeな他の食事のリスト」を送り、
    // 「これらの食事で使った分を差し引いた残りの在庫で」作れ、と指示する。

    // (補足: プランではフロントで計算と書いたが、自然言語の数量パースはサーバーサイド(AI)の方が得意なため、
    //  APIに "otherMealsIngredients" を渡す形にする)

    // ...いや、プラン通りフロントでやるにはパースロジックが必要。
    // 今回は「確実に整合性を合わせる」ため、プランを微修正して、
    // 「在庫リスト」はそのまま、「すでに他の食事で確保された食材リスト」を追加パラメータとして送る。
    // そしてAPIのプロンプトで「引き算」をさせる。これが最も安全。
    // ----------------------------------------------------------------

    // 他の食事で使われている食材リストを収集
    const otherMealsUsage: string[] = [];
    if (menuResult) {
      menuResult.forEach((day, dIdx) => {
        if (!day || !day.meals) return;
        Object.keys(day.meals).forEach(mType => {
          if (dIdx === dayIndex && mType === mealType) return;
          const meal = day.meals[mType];
          if (meal && meal.ingredients) {
            otherMealsUsage.push(...meal.ingredients);
          }
        });
      });
    }

    // 今回見送る料理を履歴に追加 (ignoredItems)
    const newIgnored = new Set(ignoredItems);
    if (currentMenu.main) {
      newIgnored.add(currentMenu.main);
      setIgnoredItems(newIgnored);
    }

    try {
      const res = await fetch("/api/regenerate-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: aggregatedList,
          currentMenu: currentMenu,
          mealType: mealType,
          existingMenus: existingMainDishes,
          history: Array.from(newIgnored),   // Transient
          banned: Array.from(bannedItems),   // Persistent
          otherUsage: otherMealsUsage,       // In-use by others
          option: optionStyle                 // Current style preference
        }),
      });

      if (!res.ok) throw new Error("API Error");

      const data = await res.json();
      if (data.result && data.result.menu) {
        setMenuResult((prev) => {
          if (!prev) return null;
          const newResult = [...prev];
          const targetDay = newResult[dayIndex];
          if (targetDay && targetDay.meals) {
            // 献立名だけでなく、材料リストも更新する
            // APIのレスポンス形式に合わせて調整 (APIは { menu: {...}, ingredients_used: [], ... } を返す)
            targetDay.meals[mealType] = {
              main: data.result.menu.main,
              side: data.result.menu.side,
              soup: data.result.menu.soup,

              ingredients: data.result.ingredients || [...(data.result.ingredients_used || []), ...(data.result.ingredients_missing || [])]
            };
          }
          return newResult;
        });
      }
    } catch (e) {
      console.error(e);
      setAlertMessage("再生成に失敗しました。");
    } finally {
      setRegeneratingTarget(null);
    }
  };

  const handleBanSingle = async (dayIndex: number, mealType: string, currentMenu: MealSet) => {
    if (!confirm(`「${currentMenu.main}」を苦手リストに登録して、作り直しますか？\n（今後、リセットしても提案されなくなります）`)) return;

    const targetKey = `${dayIndex}-${mealType}`;
    setRegeneratingTarget(targetKey);

    // 既存メニュー収集
    const existingMainDishes: string[] = [];
    if (menuResult) {
      menuResult.forEach(day => {
        if (day && day.meals) {
          Object.values(day.meals).forEach(meal => {
            if (meal && meal.main) existingMainDishes.push(meal.main);
          });
        }
      });
    }

    // 他の食事で使われている食材リストを収集
    const otherMealsUsage: string[] = [];
    if (menuResult) {
      menuResult.forEach((day, dIdx) => {
        if (!day || !day.meals) return;
        Object.keys(day.meals).forEach(mType => {
          if (dIdx === dayIndex && mType === mealType) return;
          const meal = day.meals[mType];
          if (meal && meal.ingredients) {
            otherMealsUsage.push(...meal.ingredients);
          }
        });
      });
    }

    // 禁止リストに追加 (Banned)
    const newBanned = new Set(bannedItems);
    if (currentMenu.main) {
      newBanned.add(currentMenu.main);
      setBannedItems(newBanned);
    }

    try {
      const res = await fetch("/api/regenerate-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: aggregatedList,
          currentMenu: currentMenu,
          mealType: mealType,
          existingMenus: existingMainDishes,
          history: Array.from(ignoredItems), // Transientも送る
          banned: Array.from(newBanned),     // UpdateしたBannedを送る
          otherUsage: otherMealsUsage        // In-use by others
        }),
      });

      if (!res.ok) throw new Error("API Error");

      const data = await res.json();
      if (data.result && data.result.menu) {
        setMenuResult((prev) => {
          if (!prev) return null;
          const newResult = [...prev];
          const targetDay = newResult[dayIndex];
          if (targetDay && targetDay.meals) {
            targetDay.meals[mealType] = {
              main: data.result.menu.main,
              side: data.result.menu.side,
              soup: data.result.menu.soup,

              ingredients: data.result.ingredients || [...(data.result.ingredients_used || []), ...(data.result.ingredients_missing || [])]
            };
          }
          return newResult;
        });
      }
    } catch (e) {
      console.error(e);
      alert("再生成に失敗しました。");
    } finally {
      setRegeneratingTarget(null);
    }
  };

  // --- 献立確定・集計機能 ---
  const handleFinalizeMenu = async () => {
    if (!menuResult) return;
    setIsSummarizing(true);
    setSummaryResult(null);

    // スクロールダウン
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);

    try {
      // 単なる集計ではなく、全体の整合性を再計算する
      const res = await fetch("/api/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: aggregatedList,
          menuDays: menuResult,
          people: peopleCount
        }),
      });

      if (!res.ok) throw new Error("API Error");
      const data = await res.json();

      if (data.result) {
        // パフォーマンス最適化対応: 
        // サーバーからは全データではなく「更新差分(updates)」だけが返ってくる場合がある
        if (data.result.updates && Array.isArray(data.result.updates)) {
          // 現在のメニューをコピーして更新
          const newMenuResult = JSON.parse(JSON.stringify(menuResult));

          data.result.updates.forEach((update: any) => {
            const { day_index, meal_type, ingredients, ingredients_used, ingredients_missing } = update;
            if (newMenuResult[day_index] && newMenuResult[day_index].meals[meal_type]) {
              // API v2: ingredients only
              if (ingredients) {
                newMenuResult[day_index].meals[meal_type].ingredients = ingredients;
              }
              // API v1 compat: merge
              else if (ingredients_used || ingredients_missing) {
                newMenuResult[day_index].meals[meal_type].ingredients = [...(ingredients_used || []), ...(ingredients_missing || [])];
              }
            }
          });

          setMenuResult(newMenuResult);

        } else if (data.result.updated_days) {
          // 後方互換性: 全データが返ってきた場合
          setMenuResult(data.result.updated_days);
        }

        // 2. 合計リストを表示
        setSummaryResult({
          total_shopping_list: data.result.total_shopping_list,
          total_fridge_usage: data.result.total_fridge_usage
        });
      }
    } catch (e: any) {
      console.error(e);
      // フォールバック: 詳細計算失敗時は、現在の手元データで単純集計する
      const errorMsg = e instanceof Error ? e.message : "Unknown Error";
      alert(`詳細な在庫計算に失敗しました（${errorMsg}）。\n表示中の献立データを元に、簡易的な買い出しリストを作成します。`);

      const simpleShoppingList: string[] = [];
      const simpleFridgeUsage: string[] = [];

      menuResult.forEach(day => {
        if (!day || !day.meals) return;
        Object.values(day.meals).forEach(meal => {
          if (meal.ingredients) {
            // 計算失敗時は「全て買い出し」としてリストアップする（安全策）
            simpleShoppingList.push(...meal.ingredients);
          }
        });
      });

      setSummaryResult({
        total_shopping_list: Array.from(new Set(simpleShoppingList)),
        total_fridge_usage: Array.from(new Set(simpleFridgeUsage))
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleResetMenu = () => {
    if (!confirm("献立をリセットして、条件設定に戻りますか？\n（冷蔵庫の中身は残ります）")) return;
    setMenuResult(null);
    setSummaryResult(null);
    setIgnoredItems(new Set()); // 気分じゃないリストはクリア (禁止リストは残る)
    setTimeout(() => {
      const element = document.getElementById("settings-area");
      if (element) element.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleResetSummary = () => {
    setSummaryResult(null);
  };

  // --- レシピ関連ハンドラー ---

  // レシピを取得
  const handleFetchRecipe = async (meal: MealSet) => {
    setRecipeModalMeal({ main: meal.main, side: meal.side, soup: meal.soup, ingredients: meal.ingredients });
    setIsLoadingRecipe(true);
    setCurrentRecipe(null);

    try {
      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: meal.main,
          side: meal.side,
          soup: meal.soup,
          ingredients: meal.ingredients,
          people: peopleCount,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch recipe");

      const data = await response.json();
      setCurrentRecipe(data.result);
    } catch (error) {
      console.error("Recipe fetch error:", error);
      setAlertMessage("レシピの取得に失敗しました。もう一度お試しください。");
      setRecipeModalMeal(null);
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  // レシピを保存
  const handleSaveRecipe = () => {
    if (!currentRecipe || !recipeModalMeal) return;

    const newRecipe: SavedRecipe = {
      id: `recipe-${Date.now()}`,
      mealName: recipeModalMeal.main,
      side: recipeModalMeal.side,
      soup: recipeModalMeal.soup,
      ingredients: recipeModalMeal.ingredients,
      recipe: currentRecipe,
      savedAt: new Date().toISOString(),
      menuId: currentMenuId || undefined,
      menuName: currentMenuName || undefined,
    };

    const updatedRecipes = [...savedRecipes, newRecipe];
    setSavedRecipes(updatedRecipes);
    localStorage.setItem("savedRecipes", JSON.stringify(updatedRecipes));
    setAlertMessage("レシピを保存しました！❤️");
  };

  // 保存済みレシピを削除
  const handleDeleteSavedRecipe = (id: string) => {
    if (!confirm("このレシピを削除しますか？")) return;
    const updatedRecipes = savedRecipes.filter(r => r.id !== id);
    setSavedRecipes(updatedRecipes);
    localStorage.setItem("savedRecipes", JSON.stringify(updatedRecipes));
  };

  // 保存済みレシピを表示
  const handleViewSavedRecipe = (recipe: SavedRecipe) => {
    setRecipeModalMeal({ main: recipe.mealName, side: recipe.side, soup: recipe.soup, ingredients: recipe.ingredients });
    setCurrentRecipe(recipe.recipe);
  };

  // レシピモーダルを閉じる
  const handleCloseRecipeModal = () => {
    setRecipeModalMeal(null);
    setCurrentRecipe(null);
  };

  // 初回ロード時に保存済みレシピ・献立を読み込む
  useEffect(() => {
    const storedRecipes = localStorage.getItem("savedRecipes");
    if (storedRecipes) {
      try {
        setSavedRecipes(JSON.parse(storedRecipes));
      } catch (e) {
        console.error("Failed to load saved recipes:", e);
      }
    }
    const storedMenus = localStorage.getItem("savedMenus");
    if (storedMenus) {
      try {
        setSavedMenus(JSON.parse(storedMenus));
      } catch (e) {
        console.error("Failed to load saved menus:", e);
      }
    }
  }, []);

  // --- 献立保存関連ハンドラー ---

  // 献立を保存
  const handleSaveMenu = () => {
    if (!menuResult || menuResult.length === 0) return;

    const menuName = prompt("この献立に名前をつけてください（例：今週の献立、キャンプ用など）");
    if (!menuName) return;

    const menuId = `menu-${Date.now()}`;
    const newMenu = {
      id: menuId,
      name: menuName,
      days: menuResult,
      savedAt: new Date().toISOString(),
    };

    const updatedMenus = [...savedMenus, newMenu];
    setSavedMenus(updatedMenus);
    localStorage.setItem("savedMenus", JSON.stringify(updatedMenus));

    // 保存した献立をカレントに設定（以降のレシピ保存と連動）
    setCurrentMenuId(menuId);
    setCurrentMenuName(menuName);
    setAlertMessage(`献立「${menuName}」を保存しました！📋\nこの献立のレシピを保存すると、自動的に紐づけられます。`);
  };

  // 保存済み献立を読み込む
  const handleLoadSavedMenu = (menu: { id: string; name: string; days: DayMenu[]; savedAt: string }) => {
    if (!confirm(`「${menu.name}」を読み込みますか？\n現在の献立は上書きされます。`)) return;
    setMenuResult(menu.days);
    setSummaryResult(null);
    setShowSavedMenus(false);

    // 読み込んだ献立をカレントに設定
    setCurrentMenuId(menu.id);
    setCurrentMenuName(menu.name);
    alert(`献立「${menu.name}」を読み込みました！`);
  };

  // 保存済み献立を削除
  const handleDeleteSavedMenu = (id: string) => {
    if (!confirm("この献立を削除しますか？")) return;
    const updatedMenus = savedMenus.filter(m => m.id !== id);
    setSavedMenus(updatedMenus);
    localStorage.setItem("savedMenus", JSON.stringify(updatedMenus));
  };

  return (
    <div className="min-h-screen bg-[#FBF8F5] pb-32 font-sans text-[#594A4E]">
      <datalist id="quantity-options">
        {QUANTITY_OPTIONS.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>

      {/* --- Global Header (Nadia Style) --- */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <h1 className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <img src="/logo_kondateiy.jpg" alt="Kondateiy" className="h-14 w-auto object-contain" />
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSavedMenus(true)}
              className="hidden md:flex items-center gap-1 text-xs md:text-sm font-bold text-[#594A4E] border border-[#d4cdc5] bg-white px-3 py-2 hover:bg-[#fcfaf8] transition rounded-sm"
            >
              <span>📋 保存済み献立</span>
              <span className="bg-gray-100 text-[10px] px-1 rounded-full">{savedMenus.length}</span>
            </button>
            <button
              onClick={() => setShowSavedRecipes(true)}
              className="flex items-center gap-1 text-xs md:text-sm font-bold text-white bg-[#FF8000] px-3 py-2 hover:bg-[#e67300] transition rounded-sm shadow-sm"
            >
              <span>🧑‍🍳 マイレシピ</span>
              <span className="bg-white/20 text-[10px] px-1 rounded-full">{savedRecipes.length}</span>
            </button>
            <button
              onClick={handleReset}
              disabled={images.length === 0 && aggregatedList.length === 0}
              className="bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 shadow-sm p-2 rounded-full h-10 w-10 flex items-center justify-center transition disabled:opacity-20 text-xl"
              title="リセット"
            >
              🗑️
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8 print:w-full print:max-w-none">

        {/* Introduction / Title Area */}
        <div className="bg-[#fffcf0] rounded-lg p-6 shadow-sm border border-orange-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-200 to-transparent -mr-8 -mt-8 rounded-full"></div>
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#594A4E] leading-relaxed" style={{ fontFamily: '"M PLUS Rounded 1c", "Hiragino Maru Gothic Pro", "Yu Gothic Medium", sans-serif' }}>
            食材の可能性を広げる。<br />AIと作る新しい食卓。<br />
            <span className="text-[#FF8000]">Kondateiy</span>で始めるスマートキッチン。
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
            冷蔵庫の食材画像やリストから、人気レシピを組み合わせた献立を提案します。<br />
            定番レシピからアレンジレシピまで、テーマに合わせてAIが厳選します。
          </p>
        </div>

        <section className="bg-white rounded-lg p-6 shadow-sm border border-orange-50">
          <h3 className="text-lg font-bold text-[#594A4E] mb-4 border-l-4 border-[#FF8000] pl-3">
            画像から食材を読み込む
          </h3>
          <label className="block p-12 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:bg-orange-50/30 transition group">
            <span className="text-4xl block mb-2 group-hover:scale-110 transition">📸</span>
            <span className="text-gray-600 font-medium">
              冷蔵庫や食材の画像をアップロード<br />
              <span className="text-xs text-gray-400">（複数枚選択できます）</span>
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSelectImages}
              className="hidden"
            />
          </label>
        </section>

        {images.length > 0 && (
          <section className="bg-white rounded-lg p-6 shadow-sm border border-orange-50 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold border-l-4 border-[#FFAB73] pl-2 text-[#594A4E]">
                読み込んだ画像 ({images.length}枚)
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={handleAnalyzeAll}
                  disabled={isAnalyzing}
                  className="bg-[#FFAB73] hover:bg-[#ff9f5e] text-white font-bold py-2 px-6 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
                >
                  {isAnalyzing ? "解析中..." : "まとめて解析する"}
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className="bg-[#FFE4D0] text-[#594A4E] px-4 py-2 rounded-full border border-[#FF9900]/30 animate-pulse">
                {statusMessage}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div key={index} className="border rounded-lg p-2 bg-white shadow-sm relative">
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs z-10"
                  >
                    ×
                  </button>
                  <img
                    src={img.preview}
                    className="w-full h-auto object-contain rounded bg-gray-100"
                    alt={`preview ${index}`}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {aggregatedList.length > 0 && (
          <section className="bg-white rounded-lg p-6 shadow-sm border border-orange-50 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#594A4E] flex items-center gap-2 border-b pb-2">
                <span className="text-[#FF8000]">🥕</span> 今ある食材リスト
              </h2>
              <button
                onClick={() => {
                  setAggregatedList([]);
                  setImages([]);
                }}
                className="text-sm text-gray-400 hover:text-red-500 underline"
              >
                全て削除
              </button>
            </div>
            <p className="text-base font-medium text-[#594A4E]">
              解析結果を確認・修正できます。数量は直接入力または候補から選択してください。
            </p>

            <div className="border rounded-xl overflow-hidden">
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#fff3e0]">
                    <tr>
                      <th className="px-4 py-3 text-left text-base font-bold text-[#594A4E] w-1/2">
                        食材名
                      </th>
                      <th className="px-4 py-3 text-left text-base font-bold text-[#594A4E] w-1/3">
                        数量
                      </th>
                      <th className="px-4 py-3 text-center text-base font-bold text-[#594A4E]">
                        削除
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {aggregatedList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/50">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateIngredient(idx, "name", e.target.value)}
                            className="w-full border-gray-300 rounded-md border p-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="食材名を入力"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => handleUpdateIngredient(idx, "quantity", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full border-gray-300 rounded-md border p-2 pr-8 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="数量"
                            />
                            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2 pointer-events-none">
                              <span className="text-gray-500 text-xs">▼</span>
                            </div>
                            <select
                              className="absolute right-0 top-0 bottom-0 w-8 opacity-0 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleUpdateIngredient(idx, "quantity", e.target.value);
                                  e.target.blur();
                                }
                              }}
                              value=""
                            >
                              <option value="" disabled>選択...</option>
                              {getFilteredQuantityOptions(item.name).map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleDeleteIngredient(idx)}
                            className="p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-50"
                            title="削除"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {aggregatedList.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center gap-3">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateIngredient(idx, "name", e.target.value)}
                        className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-orange-500 focus:border-orange-500 font-bold"
                        placeholder="食材名"
                      />
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => handleUpdateIngredient(idx, "quantity", e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-full border-gray-300 rounded-md border p-2 pr-8 text-sm focus:ring-orange-500 focus:border-orange-500 text-gray-600"
                          placeholder="数量"
                        />
                        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2 pointer-events-none">
                          <span className="text-gray-500 text-xs">▼</span>
                        </div>
                        <select
                          className="absolute right-0 top-0 bottom-0 w-8 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleUpdateIngredient(idx, "quantity", e.target.value);
                              e.target.blur();
                            }
                          }}
                          value=""
                        >
                          <option value="" disabled>選択...</option>
                          {getFilteredQuantityOptions(item.name).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteIngredient(idx)}
                      className="text-gray-300 hover:text-red-500 p-2"
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-[#f9f5f0] border-t border-gray-100 text-center">
                <button
                  onClick={handleAddIngredient}
                  className="bg-[#FF8000] hover:bg-[#e67300] text-white font-bold rounded-full px-8 py-3 shadow-md transition transform hover:scale-105"
                >
                  ＋ 食材を追加
                </button>
              </div>
            </div>



            <div id="settings-area" className="bg-white rounded-xl p-6 border-2 border-[#FF8000]/20 mt-8 scroll-mt-24 shadow-sm relative section-card">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3 bg-[#FF8000] text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest shadow-sm">
                CONDITIONS
              </div>
              <h3 className="font-bold text-[#594A4E] mb-4 flex items-center gap-2 text-lg">
                <span className="text-2xl">🍳</span> 献立の設定
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                  <label className="block text-sm font-bold text-[#594A4E] mb-2">期間</label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 5, 7].map(d => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`px-4 py-2 rounded-full text-sm font-bold border transition ${duration === d
                          ? "bg-[#FF8000] text-white border-[#FF8000] shadow-md"
                          : "bg-white text-[#594A4E] border-[#FF8000]/30 hover:bg-[#fff9f2]"
                          }`}
                      >
                        {d}日間
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#594A4E] mb-2">人数</label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map(p => (
                      <button
                        key={p}
                        onClick={() => setPeopleCount(p)}
                        className={`w-10 h-10 rounded-full text-sm font-bold border flex items-center justify-center transition ${peopleCount === p
                          ? "bg-[#FF8000] text-white border-[#FF8000] shadow-md"
                          : "bg-white text-[#594A4E] border-gray-200 hover:border-[#FF8000]/50 hover:bg-[#fff9f2]"
                          }`}
                      >
                        {p}人
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[#594A4E] mb-2">食事の種類 (複数選択可)</label>
                  <div className="flex flex-wrap gap-3">
                    {ALL_MEAL_TYPES.map(type => (
                      <label key={type.id} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-gray-300 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={mealTypes.has(type.id)}
                          onChange={() => toggleMealType(type.id)}
                          className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <span className="text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[#594A4E] mb-2">おすすめパターン</label>
                  <select
                    value={optionStyle}
                    onChange={(e) => setOptionStyle(e.target.value)}
                    className="w-full p-3 border border-[#FFAB73]/30 rounded-lg bg-white focus:ring-[#FFAB73] focus:border-[#FFAB73] text-[#594A4E]"
                  >
                    <option value="">🥗 バランス重視（迷ったらこれ！）</option>
                    <option value="時短・簡単">⏰ 時短・手軽（忙しい時に）</option>
                    <option value="ヘルシー">🥦 ヘルシー (低カロリー)</option>
                    <option value="ガッツリ">🍖 ガッツリ (ボリューム重視)</option>
                    <option value="節約">💰 節約・カサ増し</option>
                    <option value="和食中心">🍱 和食中心</option>
                    <option value="洋食中心">🍝 洋食中心</option>
                    <option value="中華中心">🥟 中華中心</option>
                    <option value="おつまみ">🍻 おつまみ・晩酌</option>
                    <option value="キャンプ飯">🔥 キャンプ飯 (アウトドア向け)</option>
                  </select>
                </div>

              </div>
            </div>

            <div className="text-right pt-4">
              <button
                onClick={handleGenerateMenu}
                disabled={isGeneratingMenu}
                className="bg-[#FF8000] hover:bg-[#e67300] text-white font-bold py-4 px-12 rounded-full shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait w-full md:w-auto text-lg"
              >
                {isGeneratingMenu ? "献立を考え中..." : "この条件で献立を作る →"}
              </button>
            </div>
          </section>
        )}

        {isGeneratingMenu && (
          <div className="text-center py-12 animate-pulse">
            <div className="text-4xl mb-4">👨‍🍳</div>
            <p className="text-xl font-bold text-gray-600">プロの料理人が献立を考えています...</p>
            <p className="text-sm text-gray-400 mt-2">（30秒ほどお待ちください）</p>
          </div>
        )}

        {menuResult && (
          <section className="space-y-6 pt-8 border-t-2 border-dashed border-gray-300">
            {/* 献立リセット・保存ボタン */}
            <div className="flex justify-end gap-3 mb-4 items-center">
              <button
                onClick={handleSaveMenu}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#FF8000] text-[#FF8000] rounded-lg text-sm font-bold hover:bg-[#FFF0E6] transition shadow-sm"
              >
                📂 この献立を保存
              </button>
              {savedMenus.length > 0 && (
                <button
                  onClick={() => setShowSavedMenus(true)}
                  className="text-sm text-gray-400 hover:text-[#594A4E] underline ml-2"
                >
                  保存済み一覧 ({savedMenus.length})
                </button>
              )}
              <button
                onClick={handleResetMenu}
                className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1 ml-4"
              >
                ↩ 条件を変えてリセット
              </button>
            </div>

            <h2 className="text-2xl font-bold text-[#594A4E] mb-6 flex items-center gap-2 border-l-4 border-[#FF8000] pl-4">
              🍽️ 提案された献立 <span className="text-sm font-normal text-gray-500 ml-2">({menuResult.length}日分)</span>
            </h2>
            <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {menuResult.map((day, dayIndex) => {
                if (!day || !day.meals) return null; // 安全対策
                return (
                  <div key={dayIndex} className="bg-white rounded-xl shadow-lg border overflow-hidden flex flex-col">
                    <div className="bg-[#594A4E] p-4 border-b border-[#FF9900]/20">
                      <h3 className="font-bold text-xl text-white text-center">{day.day_label}</h3>
                    </div>

                    <div className="p-6 flex-grow space-y-6">
                      {/* Meals Loop */}
                      {ALL_MEAL_TYPES.map((type) => {
                        const meal = day.meals[type.id];
                        if (!meal) return null;

                        return (
                          <div key={type.id} className="border-b pb-4 last:border-0 last:pb-0 relative group">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-widest ${type.color || "bg-[#FF8000] text-white"}`}>
                                {type.label}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleBanSingle(dayIndex, type.id, meal)}
                                  disabled={!!regeneratingTarget}
                                  className="text-gray-400 hover:text-red-500 transition"
                                  title="苦手・除外（二度と出さない）"
                                >
                                  🚫
                                </button>
                                <button
                                  onClick={() => handleRegenerateSingle(dayIndex, type.id, meal)}
                                  disabled={!!regeneratingTarget}
                                  className="text-gray-400 hover:text-blue-500 transition"
                                  title="気分じゃない（今回は見送り）"
                                >
                                  <span className={regeneratingTarget === `${dayIndex}-${type.id}` ? "animate-spin inline-block" : ""}>
                                    🔄
                                  </span>
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1 pl-2 border-l-2 border-orange-200">
                              <div>
                                <span className="text-[10px] text-gray-400 block">Main</span>
                                <p className="font-bold text-gray-800">{meal.main}</p>
                              </div>
                              {/* Side/Soup は snack/night_snack 以外のみ表示 */}
                              {type.id !== "snack" && type.id !== "night_snack" && (
                                <>
                                  <div>
                                    <span className="text-[10px] text-gray-400 block">Side</span>
                                    <p className="text-sm text-gray-700">{meal.side}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 block">Soup</span>
                                    <p className="text-sm text-gray-700">{meal.soup}</p>
                                  </div>
                                </>
                              )}

                              {/* 必要な食材リスト (シンプル表示) */}
                              <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                                <div className="text-[10px] text-gray-500 mb-1 font-bold">必要な食材:</div>
                                <div className="text-xs text-gray-700 leading-relaxed">
                                  {meal.ingredients.join("、")}
                                </div>
                              </div>

                              {/* レシピボタン */}
                              <button
                                onClick={() => handleFetchRecipe(meal)}
                                disabled={isLoadingRecipe}
                                className="mt-3 w-full text-center text-sm py-2 px-4 bg-[#FFF0E6] text-[#FF8000] border border-[#FFAB73] rounded-lg hover:bg-[#ffe4d0] transition font-bold flex items-center justify-center gap-2"
                              >
                                📝 レシピを見る
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* --- 確定ボタンエリア --- */}
        {
          menuResult && !summaryResult && !isSummarizing && (
            <div className="text-center pt-8 pb-16">
              <button
                onClick={handleFinalizeMenu}
                className="bg-[#FF8000] hover:bg-[#e67300] text-white text-xl font-bold py-4 px-12 rounded-full shadow-2xl transition transform hover:scale-105"
              >
                🛒 この献立で確定して買い出しリストを作る
              </button>
            </div>
          )
        }

        {/* --- 集計中表示 --- */}
        {
          isSummarizing && (
            <div className="text-center py-12 animate-pulse pb-32">
              <div className="text-4xl mb-4">🧮</div>
              <p className="text-xl font-bold text-gray-600">全日程の食材を集計中...</p>
            </div>
          )
        }

        {/* --- 集計結果表示エリア --- */}

        {
          summaryResult && (
            <section className="bg-white rounded-xl shadow-xl border-4 border-orange-200 overflow-hidden mb-32 print:block print:w-full print:border-none print:shadow-none print:mb-0">
              <div className="bg-[#FF8000] p-6 text-white text-center relative print:py-4 print:px-6">
                <button
                  onClick={handleResetSummary}
                  className="absolute left-6 top-1/2 -translate-y-1/2 bg-white text-orange-600 px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-orange-50 transition print:hidden"
                >
                  🔙 献立に戻る
                </button>
                <h2 className="text-3xl font-bold print:text-2xl">📋 決定版リスト ({menuResult?.length}日分)</h2>
                <p className="opacity-90 mt-2 print:hidden">これさえあれば、買い出しも調理もバッチリです！</p>
              </div>

              <div className="p-8 grid md:grid-cols-2 gap-8 print:p-2 print:flex print:flex-col print:gap-2">
                {/* 買い出しリスト */}
                <div className="print:order-2">
                  <h3 className="text-xl font-bold text-[#FF8000] mb-4 flex items-center gap-2 print:text-base print:mb-2">
                    🛒 買い出しリスト (合計)
                  </h3>
                  <div className="bg-[#FFE4D0] rounded-lg p-6 border border-[#FF9900]/30 print:p-2">
                    <p className="text-sm text-[#594A4E] mb-3 print:text-[9px] print:mb-1">※ 本当にないものには☑️を入れてください</p>
                    {summaryResult.total_shopping_list.length > 0 ? (
                      <ul className="space-y-2 print:space-y-0 print:columns-2 print:text-xs">
                        {summaryResult.total_shopping_list.map((item, i) => {
                          const isCategory = item.startsWith("【");
                          return (
                            <li key={i} className={`flex items-center gap-2 pb-2 last:border-0 print:pb-0 print:break-inside-avoid ${isCategory ? "border-none mt-3 first:mt-0" : "border-b border-dashed border-orange-200 print:border-none"}`}>
                              {isCategory ? (
                                <span className="text-orange-700 font-bold print:text-[10px]">{item}</span>
                              ) : (
                                <>
                                  <input type="checkbox" className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 print:w-3 print:h-3 flex-shrink-0" />
                                  <span className="text-gray-800 font-medium print:text-[10px]">{item}</span>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-center py-4 print:py-1 print:text-xs">買い足すものはありません！🎉</p>
                    )}
                  </div>
                </div>

                {/* 今ある食材消費リスト */}
                <div className="print:order-1">
                  <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2 print:text-base print:mb-2">
                    🧊 今ある食材から使うもの (合計)
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 print:p-2">
                    {summaryResult.total_fridge_usage.length > 0 ? (
                      <ul className="space-y-2 print:space-y-0 print:columns-2 print:text-xs">
                        {summaryResult.total_fridge_usage.map((item, i) => {
                          const isCategory = item.startsWith("【");
                          return (
                            <li key={i} className={`flex items-center gap-2 pb-2 last:border-0 print:pb-0 print:break-inside-avoid ${isCategory ? "border-none mt-3 first:mt-0" : "border-b border-dashed border-gray-200 print:border-none"}`}>
                              {isCategory ? (
                                <span className="text-gray-700 font-bold print:text-[10px]">{item}</span>
                              ) : (
                                <>
                                  <span className="text-orange-500 print:text-[10px]">●</span>
                                  <span className="text-gray-800 font-medium print:text-[10px]">{item}</span>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-center py-4 print:py-1 print:text-xs">冷蔵庫からは何も使いません</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 text-center border-t print:hidden">
                <button
                  onClick={() => window.print()}
                  className="text-gray-600 hover:text-gray-900 underline"
                >
                  🖨️ このリストを印刷する
                </button>
              </div>
            </section>
          )
        }

      </main>

      {/* レシピモーダル */}
      {
        recipeModalMeal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* ヘッダー */}
              <div className="bg-[#FF8000] text-white p-6 sticky top-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">📝 {recipeModalMeal.main}</h2>
                    <p className="text-white/90 text-sm">副菜: {recipeModalMeal.side} / 汁物: {recipeModalMeal.soup}</p>
                  </div>
                  <button
                    onClick={handleCloseRecipeModal}
                    className="text-white/80 hover:text-white text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* コンテンツ */}
              <div className="p-6">
                {isLoadingRecipe ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4 animate-bounce">🍳</div>
                    <p className="text-gray-600 font-medium">レシピを生成中...</p>
                    <p className="text-sm text-gray-400 mt-2">（20秒ほどお待ちください）</p>
                    <div className="mt-4 flex justify-center gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                ) : currentRecipe ? (
                  <div className="space-y-6">
                    {/* 主菜レシピ */}
                    <div>
                      <h3 className="text-lg font-bold text-orange-600 mb-3 flex items-center gap-2">
                        🍖 {currentRecipe.mainRecipe.name}
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          {currentRecipe.mainRecipe.cookingTime}
                        </span>
                      </h3>
                      <ol className="space-y-2 pl-1">
                        {currentRecipe.mainRecipe.steps.map((step, i) => (
                          <li key={i} className="text-gray-700 leading-relaxed">{step}</li>
                        ))}
                      </ol>
                      {currentRecipe.mainRecipe.tips && (
                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                          💡 <span className="font-medium">コツ:</span> {currentRecipe.mainRecipe.tips}
                        </div>
                      )}
                    </div>

                    {/* 副菜レシピ */}
                    {currentRecipe.sideRecipe.name !== "なし" && currentRecipe.sideRecipe.steps.length > 0 && (
                      <div className="pt-4 border-t">
                        <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                          🥗 {currentRecipe.sideRecipe.name}
                          {currentRecipe.sideRecipe.cookingTime && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border">
                              {currentRecipe.sideRecipe.cookingTime}
                            </span>
                          )}
                        </h3>
                        <ol className="space-y-2 pl-1">
                          {currentRecipe.sideRecipe.steps.map((step, i) => (
                            <li key={i} className="text-gray-700 text-sm leading-relaxed">{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* 汁物レシピ */}
                    {currentRecipe.soupRecipe.name !== "なし" && currentRecipe.soupRecipe.steps.length > 0 && (
                      <div className="pt-4 border-t">
                        <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                          🍲 {currentRecipe.soupRecipe.name}
                          {currentRecipe.soupRecipe.cookingTime && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border">
                              {currentRecipe.soupRecipe.cookingTime}
                            </span>
                          )}
                        </h3>
                        <ol className="space-y-2 pl-1">
                          {currentRecipe.soupRecipe.steps.map((step, i) => (
                            <li key={i} className="text-gray-700 text-sm leading-relaxed">{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* 保存ボタン */}
                    <div className="pt-4 border-t flex gap-3">
                      <button
                        onClick={handleSaveRecipe}
                        className="flex-1 py-3 bg-[#FFAB73] text-white rounded-lg font-bold hover:bg-[#ff9f5e] transition"
                      >
                        ❤️ お気に入りに保存
                      </button>
                      <button
                        onClick={handleCloseRecipeModal}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
                      >
                        閉じる
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )
      }



      {/* 保存済みレシピ一覧モーダル */}
      {
        showSavedRecipes && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
              <div className="bg-[#FF8000] text-white p-6 sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      📖 マイレシピ
                    </h2>
                    <p className="text-white/90 text-sm mt-1">保存したレシピをいつでも確認できます</p>
                  </div>
                  <button onClick={() => setShowSavedRecipes(false)} className="text-white/80 hover:text-white text-2xl bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
                </div>
              </div>
              <div className="p-4">
                {savedRecipes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📭</div>
                    <p className="text-gray-500">保存済みのレシピはありません</p>
                    <p className="text-gray-400 text-sm mt-2">献立からレシピを見て「お気に入りに保存」を押すと<br />ここに追加されます</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 献立ごとにグループ化 */}
                    {(() => {
                      const grouped = new Map<string, SavedRecipe[]>();
                      savedRecipes.forEach(recipe => {
                        const key = recipe.menuName || "個別レシピ";
                        if (!grouped.has(key)) grouped.set(key, []);
                        grouped.get(key)!.push(recipe);
                      });

                      return Array.from(grouped.entries()).map(([menuName, recipes]) => (
                        <div key={menuName} className="border rounded-xl overflow-hidden">
                          <div className="bg-gray-100 px-4 py-2 font-medium text-gray-700 flex items-center gap-2">
                            {menuName === "個別レシピ" ? "📝" : "📋"}
                            <span>{menuName}</span>
                            <span className="text-xs text-gray-500">({recipes.length}品)</span>
                          </div>
                          <div className="divide-y">
                            {recipes.map(recipe => (
                              <div key={recipe.id} className="p-4 hover:bg-gray-50 transition">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-orange-500">🍖</span>
                                      <p className="font-bold text-gray-800">{recipe.mealName}</p>
                                    </div>
                                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                      {recipe.side && <span className="flex items-center gap-1"><span className="text-[#FFAB73]">🥗</span> {recipe.side}</span>}
                                      {recipe.soup && <span className="flex items-center gap-1"><span className="text-[#FFAB73]">🍲</span> {recipe.soup}</span>}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2">{new Date(recipe.savedAt).toLocaleDateString("ja-JP")} 保存</p>
                                  </div>
                                  <div className="flex gap-2 ml-3">
                                    <button
                                      onClick={() => { handleViewSavedRecipe(recipe); setShowSavedRecipes(false); }}
                                      className="text-sm bg-[#FF8000] text-white px-4 py-2 rounded-lg hover:bg-[#e67300] transition font-medium"
                                    >
                                      作り方を見る
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSavedRecipe(recipe.id)}
                                      className="text-sm text-gray-400 hover:text-red-500 px-2 py-2 transition"
                                      title="削除"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* 保存済み献立一覧モーダル */}
      {
        showSavedMenus && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="bg-[#594A4E] text-white p-6 sticky top-0 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">📂 保存済み献立</h2>
                  <p className="text-white/90 text-sm mt-1">保存した献立をいつでも確認できます</p>
                </div>
                <button onClick={() => setShowSavedMenus(false)} className="text-white/80 hover:text-white text-2xl bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
              </div>
              <div className="p-4 space-y-3">
                {savedMenus.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">保存済みの献立はありません</p>
                ) : (
                  savedMenus.map((menu) => (
                    <div key={menu.id} className="bg-white rounded-lg p-4 border border-orange-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-800 text-lg">{menu.name}</p>
                          <p className="text-xs text-gray-500">{menu.days.length}日分 | {new Date(menu.savedAt).toLocaleDateString("ja-JP")}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => handleLoadSavedMenu(menu)}
                            className="text-sm bg-[#FF8000] text-white px-4 py-2 rounded-lg hover:bg-[#e67300] font-medium shadow-sm"
                          >
                            読み込む
                          </button>
                          <button
                            onClick={() => handleDeleteSavedMenu(menu.id)}
                            className="text-sm text-gray-400 hover:text-red-500 px-2 py-2 transition"
                            title="削除"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      {/* 献立プレビュー */}
                      <div className="text-xs text-gray-600 bg-white rounded p-2 border border-gray-200">
                        {menu.days.slice(0, 2).map((day, i) => (
                          <div key={i} className="mb-1">
                            <span className="font-medium">{day.day_label}:</span>{' '}
                            {Object.values(day.meals).map((m: MealSet) => m.main).join('、')}
                          </div>
                        ))}
                        {menu.days.length > 2 && <span className="text-gray-400">...他{menu.days.length - 2}日</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      }
      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-[#594A4E] mb-4 flex items-center gap-2">
              <span className="text-[#FF8000]">⚠️</span> お知らせ
            </h3>
            <p className="text-gray-600 mb-6 whitespace-pre-wrap leading-relaxed text-sm">
              {alertMessage}
            </p>
            <div className="text-right">
              <button
                onClick={() => setAlertMessage(null)}
                className="bg-[#FF8000] text-white px-6 py-2 rounded-full font-bold hover:bg-[#e67300] transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
