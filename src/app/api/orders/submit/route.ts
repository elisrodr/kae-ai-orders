import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SubmitItem = {
  item_name: string;
  quantity: number;
  unit: string;
  vendor_id: string | null;
  needs_clarification: boolean;
  clarification_answer: string | null;
  no_vendor_match: boolean;
  estimated_category: string | null;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      delivery_date?: string;
      raw_input?: string;
      items?: SubmitItem[];
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { delivery_date, raw_input, items } = body;

    if (!delivery_date || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Delivery date and at least one item are required." },
        { status: 400 }
      );
    }

    const { data: restaurantProfile } = await supabase
      .from("restaurant_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!restaurantProfile) {
      return NextResponse.json(
        { error: "Restaurant profile not found." },
        { status: 400 }
      );
    }

    const itemsByVendor = new Map<
      string,
      { vendor_id: string; items: SubmitItem[] }
    >();
    for (const item of items) {
      if (!item.vendor_id) continue;
      if (!itemsByVendor.has(item.vendor_id)) {
        itemsByVendor.set(item.vendor_id, { vendor_id: item.vendor_id, items: [] });
      }
      itemsByVendor.get(item.vendor_id)!.items.push(item);
    }

    let vendorCount = 0;
    const createdOrderIds: string[] = [];

    for (const [vendorId, group] of Array.from(itemsByVendor.entries())) {
      console.log(
        "[api/orders/submit] creating order for vendor",
        vendorId,
        "with",
        group.items.length,
        "items"
      );

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurantProfile.id,
          vendor_id: vendorId,
          requested_delivery_date: delivery_date,
          status: "draft",
          raw_input: raw_input ?? null,
        })
        .select("id")
        .single();

      if (orderError || !order) {
        console.error("[api/orders/submit] order insert failed", orderError);
        continue;
      }

      console.log("[api/orders/submit] created order", order.id);

      vendorCount += 1;
      createdOrderIds.push(order.id);

      const lineItems = group.items.map((item) => ({
        order_id: order.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
      }));

      console.log(
        "[api/orders/submit] inserting line items for order",
        order.id,
        lineItems
      );

      const { data: insertedItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(lineItems)
        .select("id");

      if (itemsError) {
        console.error("[api/orders/submit] order_items insert failed", itemsError);
      } else {
        console.log(
          "[api/orders/submit] order_items insert succeeded",
          insertedItems
        );
      }
    }

    if (vendorCount === 0) {
      return NextResponse.json(
        { error: "No items had an assigned vendor. Please review and try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, vendorCount, orderIds: createdOrderIds });
  } catch (err) {
    console.error("[api/orders/submit]", err);
    return NextResponse.json(
      {
        error:
          "Something went wrong while sending your orders. Please try again.",
      },
      { status: 500 }
    );
  }
}

