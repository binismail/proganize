import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, userId, subscription, creditAmount, unitPrice, first50 } =
      body;

    if (!userId) {
      console.error("Missing userId");
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    let sessionOptions: Stripe.Checkout.SessionCreateParams;

    if (subscription) {
      // Handle subscription flow
      if (!type) {
        return new Response(
          JSON.stringify({ error: "Missing subscription type" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      let priceId: string = type === "monthly"
        ? process.env.MONHTLY_PRICE_ID ?? "price_1Q6amqEUCrVZiVZ6gbwGHmAO"
        : process.env.YEARLY_PRICE_ID ?? "price_1Q6auXEUCrVZiVZ6m9l5yeMR";

      sessionOptions = {
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url:
          `${process.env.NEXT_PUBLIC_BASE_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing`,
        metadata: { userId },
      };

      // Add discount for yearly subscriptions
      if (type === "yearly") {
        if (first50 && first50 > 0) {
          sessionOptions.discounts = [{
            coupon: process.env.FIRST50YEARLY_COUPON,
          }];
        } else {
          sessionOptions.discounts = [{ coupon: process.env.YEARLY_COUPON }];
        }
      } else {
        if (first50 && first50 > 0) {
          sessionOptions.discounts = [{
            coupon: process.env.FIRST50MONTHLY_COUPON,
          }];
        }
      }
    } else {
      // Handle top-up flow
      if (!creditAmount || creditAmount < 10 || creditAmount > 10000) {
        return new Response(
          JSON.stringify({
            error: "Credit amount must be between 10 and 10,000",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      sessionOptions = {
        payment_method_types: ["card", "link"],
        mode: "payment",
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "Proganize AI Credits",
              description:
                `Top-up for ${creditAmount.toLocaleString()} AI words`,
            },
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity: 1,
        }],
        success_url:
          `${process.env.NEXT_PUBLIC_BASE_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing`,
        metadata: { userId, creditAmount },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);
    console.log("Stripe session created:", session.id);

    return new Response(JSON.stringify({ sessionId: session.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/checkout-session:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
