import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-09-30.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, userId } = body;

    console.log("Received request:", { type, userId });

    if (!type || !userId) {
      console.error("Missing required fields:", { type, userId });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let priceId: string;

    if (type === "monthly") {
      priceId = "price_1Q6amqEUCrVZiVZ6gbwGHmAO";
    } else if (type === "yearly") {
      priceId = "price_1Q6auXEUCrVZiVZ6m9l5yeMR";
    } else {
      console.error("Invalid subscription type:", type);
      return new Response(
        JSON.stringify({ error: "Invalid subscription type" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Creating Stripe session with:", { priceId, type, userId });

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing`,
      metadata: { userId },
    };

    // Only add the discount for yearly subscriptions
    if (type === "yearly") {
      sessionOptions.discounts = [
        {
          coupon: "c87BTybf",
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    console.log("Stripe session created:", session.id);

    return new Response(JSON.stringify({ sessionId: session.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/checkout-session:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
