import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_ORDER_TEXT_LENGTH = 5000;
const ANTHROPIC_TIMEOUT_MS = 30_000;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: { orderText?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const orderText =
      typeof body.orderText === "string" ? body.orderText.trim() : "";

    if (!orderText) {
      return NextResponse.json(
        { error: "orderText is required and cannot be empty." },
        { status: 400 }
      );
    }

    if (orderText.length > MAX_ORDER_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `orderText must be at most ${MAX_ORDER_TEXT_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    const { data: restaurantProfile } = await supabase
      .from("restaurant_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const restaurantId = restaurantProfile?.id ?? null;

    const { data: vendors = [] } = restaurantId
      ? await supabase
          .from("vendors")
          .select("id, name")
          .eq("restaurant_id", restaurantId)
          .order("name")
      : { data: [] };

    const safeVendors = vendors ?? [];
    const vendorIds = safeVendors.map((v) => v.id);

    const { data: regularItems = [] } =
      vendorIds.length > 0
        ? await supabase
            .from("regular_items")
            .select("vendor_id, name, quantity, frequency")
            .in("vendor_id", vendorIds)
        : { data: [] };

    const safeRegularItems = regularItems ?? [];

    const vendorData = safeVendors.map((v) => ({
      id: v.id,
      name: v.name,
      categories: [] as string[],
      products: safeRegularItems
        .filter((ri) => ri.vendor_id === v.id)
        .map((ri) => ({
          name: ri.name,
          quantity: ri.quantity,
          frequency: ri.frequency,
        })),
    }));

    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log("API KEY EXISTS:", !!apiKey);

    const anthropic = new Anthropic({
      ...(apiKey ? { apiKey } : {}),
      timeout: ANTHROPIC_TIMEOUT_MS,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an AI assistant for KAE, a restaurant ordering platform.

A restaurant user has typed this order in plain English:
"${orderText}"

Here are this restaurant's vendors and their product categories:
${JSON.stringify(vendorData, null, 2)}

Your job:
1. Parse the order into individual line items
2. For each item, determine: item name, quantity, unit (cases, lbs, each, etc.), and which vendor it should go to based on the vendor's categories and products
3. If an item is ambiguous (could go to multiple vendors, or quantity is unclear), set "needs_clarification": true and include a "clarification_question"
4. If an item doesn't match any vendor, set "no_vendor_match": true

Respond ONLY with valid JSON in this exact format, no markdown, no backticks, no explanation:
{
  "parsed_items": [
    {
      "item_name": "Chicken Thighs",
      "quantity": 3,
      "unit": "cases",
      "vendor_id": "uuid-of-matching-vendor",
      "vendor_name": "Name of matching vendor",
      "needs_clarification": false,
      "no_vendor_match": false,
      "clarification_question": null,
      "estimated_category": "Protein"
    }
  ],
  "summary": "Parsed X items across Y vendors.",
  "warnings": []
}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => {
      return typeof (block as any)?.type === "string" && (block as any).type === "text";
    }) as any;

    const rawText =
      textBlock && typeof textBlock.text === "string"
        ? textBlock.text.trim()
        : "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Could not parse order. Try rewording your request." },
        { status: 500 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Could not parse order. Try rewording your request." },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[api/orders/parse]", err);

    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    const isTimeout =
      message.includes("timeout") ||
      message.includes("abort") ||
      (err as { code?: string }).code === "ETIMEDOUT";

    return NextResponse.json(
      {
        error: isTimeout
          ? "The request took too long. Please try again with a shorter order."
          : "Something went wrong while parsing your order. Please try again.",
      },
      { status: 500 }
    );
  }
}
