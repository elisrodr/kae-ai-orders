import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

function formatFullDate(value: string | null): string {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { orderId?: string };
    try {
      body = await request.json();
    } catch {
      // eslint-disable-next-line no-console
      console.log("[send-order] FAIL: invalid JSON body");
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    if (!orderId) {
      // eslint-disable-next-line no-console
      console.log("[send-order] FAIL: orderId is required", body);
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Fetch restaurant profile for this user
    const { data: restaurantProfile, error: restaurantError } = await supabase
      .from("restaurant_profiles")
      .select("id, onboarding_basics")
      .eq("user_id", user.id)
      .single();

    if (restaurantError || !restaurantProfile) {
      // eslint-disable-next-line no-console
      console.log(
        "[send-order] FAIL: restaurant profile not found",
        restaurantError
      );
      return NextResponse.json(
        { error: "Restaurant profile not found." },
        { status: 400 }
      );
    }

    const restaurantId = restaurantProfile.id;

    // Fetch order with related items and vendor
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
          id,
          status,
          requested_delivery_date,
          created_at,
          raw_input,
          restaurant_id,
          vendors ( name, email ),
          order_items ( item_name, quantity, unit )
        `
      )
      .eq("id", orderId)
      .single();

    // eslint-disable-next-line no-console
    console.log(
      "[send-order] fetched order:",
      JSON.stringify(order, null, 2),
      "error:",
      orderError
    );

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // Ensure order belongs to this restaurant
    if (order.restaurant_id !== restaurantId) {
      return NextResponse.json(
        { error: "You do not have access to this order." },
        { status: 403 }
      );
    }

    // Idempotency: do not resend already-sent orders
    if (order.status === "sent") {
      return NextResponse.json(
        { success: true, message: "Order already sent" },
        { status: 200 }
      );
    }

    const items =
      (order.order_items as
        | { item_name: string; quantity: number; unit: string }[]
        | null) ?? [];

    if (items.length === 0) {
      // eslint-disable-next-line no-console
      console.log("[send-order] FAIL: no line items", orderId);
      return NextResponse.json(
        { error: "Order has no line items to send." },
        { status: 400 }
      );
    }

    const vendorName = (order.vendors as { name?: string } | null)?.name;
    const vendorEmail = (
      order.vendors as { email?: string | null } | null
    )?.email;

    if (!vendorEmail) {
      // eslint-disable-next-line no-console
      console.log("[send-order] FAIL: vendor email missing", order.vendors);
      return NextResponse.json(
        { error: "Vendor does not have a contact email configured." },
        { status: 400 }
      );
    }

    // Extract restaurant name and contact email
    const basics = (restaurantProfile.onboarding_basics ??
      {}) as Record<string, unknown>;
    const restaurantName =
      (basics["restaurant_name"] as string | undefined) ??
      (basics["name"] as string | undefined) ??
      "Your restaurant";
    const restaurantContactEmail = user.email ?? "";

    const formattedDate = formatFullDate(order.requested_delivery_date);

    const subject = `New Order from ${restaurantName} — ${formattedDate}`;

    const itemRowsHtml = items
      .map((item, idx) => {
        const bgColor = idx % 2 === 0 ? "#ffffff" : "#f1f3f5";
        return `
          <tr style="background-color: ${bgColor};">
            <td style="padding: 8px 12px; border: 1px solid #dee2e6; font-size: 14px;">
              ${item.item_name}
            </td>
            <td style="padding: 8px 12px; border: 1px solid #dee2e6; font-size: 14px; text-align: right;">
              ${item.quantity}
            </td>
            <td style="padding: 8px 12px; border: 1px solid #dee2e6; font-size: 14px;">
              ${item.unit}
            </td>
          </tr>
        `;
      })
      .join("");

    const emailHtml = `
      <div style="margin:0;padding:0;background-color:#f8f9fa;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding:24px 16px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,0.08);">
                <tr>
                  <td style="background-color:#1a1a2e;padding:20px 24px;color:#ffffff;text-align:left;">
                    <div style="font-size:20px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">KAE</div>
                    <div style="margin-top:4px;font-size:16px;font-weight:500;">New Purchase Order</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;color:#212529;">
                    <p style="margin:0 0 8px 0;font-size:16px;font-weight:600;">
                      ${restaurantName}
                    </p>
                    ${
                      restaurantContactEmail
                        ? `<p style="margin:0 0 4px 0;font-size:14px;color:#495057;">Contact: ${restaurantContactEmail}</p>`
                        : ""
                    }
                    ${
                      vendorName
                        ? `<p style="margin:8px 0 0 0;font-size:14px;color:#495057;">Vendor: ${vendorName}</p>`
                        : ""
                    }
                    <p style="margin:12px 0 0 0;font-size:14px;color:#495057;">
                      Requested delivery date:
                      <span style="font-weight:500;">${formattedDate}</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 24px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #dee2e6;">
                      <thead>
                        <tr style="background-color:#e9ecef;">
                          <th style="padding:8px 12px;border:1px solid #dee2e6;font-size:13px;font-weight:600;text-align:left;">Item Name</th>
                          <th style="padding:8px 12px;border:1px solid #dee2e6;font-size:13px;font-weight:600;text-align:right;">Quantity</th>
                          <th style="padding:8px 12px;border:1px solid #dee2e6;font-size:13px;font-weight:600;text-align:left;">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemRowsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px 20px 24px;border-top:1px solid #e9ecef;color:#6c757d;font-size:12px;line-height:1.5;">
                    <p style="margin:0 0 6px 0;">
                      This order was placed through <strong>KAE</strong>. Please reply directly to this email or contact the restaurant to confirm.
                    </p>
                    <p style="margin:0;">
                      If you believe you received this email in error, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

    const fromAddress =
      process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.trim().length > 0
        ? process.env.RESEND_FROM_EMAIL
        : "KAE Orders <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [vendorEmail],
      subject,
      html: emailHtml,
      replyTo: restaurantContactEmail || undefined,
    });

    // eslint-disable-next-line no-console
    console.log(
      "[send-order] RESEND RAW RESPONSE:",
      JSON.stringify({ data, error })
    );

    if (error) {
      // Do not update order status if email failed
      // eslint-disable-next-line no-console
      console.error("[api/emails/send-order] resend error", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send email. Please try again.",
        },
        { status: 500 }
      );
    }

    // Update order status to "sent" and bump updated_at
    const { data: updateData, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, status");

    // eslint-disable-next-line no-console
    console.log(
      "[send-order] status update result:",
      JSON.stringify({ updateData, updateError })
    );

    return NextResponse.json(
      {
        success: true,
        messageId: (data as { id?: string } | null)?.id ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/emails/send-order]", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send email. Please try again.",
      },
      { status: 500 }
    );
  }
}

