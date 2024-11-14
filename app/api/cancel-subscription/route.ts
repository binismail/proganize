import { NextRequest } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-10-28.acacia",
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { subId } = body;

        const response = await stripe.subscriptions.cancel(subId);

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : "An unknown error occurred";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
