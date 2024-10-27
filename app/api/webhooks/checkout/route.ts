import Stripe from "stripe";
import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { supabase } from "@/utils/supabase/instance";
type METADATA = {
  userId: string;
  priceId: string;
};
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();

  const endpointSecret = process.env.STRIPE_SECRET_WEBHOOK_KEY!;
  const sig = (await headers()).get("stripe-signature") as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    // console.log(event);
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, {
      status: 400,
    });
  }

  const eventType = event.type;
  if (eventType === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    console.log(
      `Checkout completed. Subscription ID: ${subscriptionId}, Customer ID: ${customerId}`
    );

    try {
      // Fetch additional details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const invoice = await stripe.invoices.retrieve(session.invoice as string);

      try {
        await supabase.from("subscriptions").insert({
          user_id: session.metadata?.userId,
          subscription_id: subscriptionId,
          customer_id: customerId,
          status: subscription.status,
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          plan_id: subscription.items.data[0].id,
          plan: `Progranize Pro(${
            subscription.items.data[0].plan.interval
              ? subscription.items.data[0].plan.interval === "month"
                ? "Monthly"
                : "Yearly"
              : ""
          })`,
        });

        await supabase.from("invoices").insert({
          stripe_invoice_id: invoice.id,
          user_id: session.metadata?.userId,
          amount_paid: invoice.amount_paid,
          subscription_id: subscriptionId,
          status: invoice.status,
          invoice_pdf: invoice.invoice_pdf,
        });
      } catch (err) {
        console.log("Error fetching subscription details:", err);
      }

      // const paymentIntent = await stripe.paymentIntents.retrieve(
      //   invoice.payment_intent as string
      // );

      // // Retrieve the payment method
      // const paymentMethod = await stripe.paymentMethods.retrieve(
      //   paymentIntent.payment_method as string
      // );

      // const transactionDetails = {
      //   userId: session.metadata?.userId,
      //   priceId: session.metadata?.priceId,
      //   created: session.created,
      //   currency: session.currency,
      //   customerDetails: session.customer_details,
      //   amount: session.amount_total,
      //   subscriptionId,
      //   customerId,
      //   subscriptionStatus: subscription.status,
      //   customerEmail: customer.email,
      //   invoiceId: invoice.id,
      //   invoiceStatus: invoice.status,
      //   paymentIntentId: paymentIntent.id,
      //   paymentIntentStatus: paymentIntent.status,
      //   paymentMethodId: paymentMethod.id,
      //   paymentMethodType: paymentMethod.type,
      //   paymentMethodLast4: paymentMethod.card?.last4,
      // };

      // database update here with transactionDetails
      // console.log("Subscription added to database:", transactionDetails);
      return new Response("Subscription added", { status: 200 });
    } catch (error) {
      console.error("Error processing checkout session:", error);
      return new Response("Server error", { status: 500 });
    }
  } else if (eventType === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    await handleInvoicePaid(invoice);
  } else if (eventType === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    await handleInvoicePaymentFailed(invoice);
  } else if (eventType === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    await handleSubscriptionUpdated(subscription);
  } else {
    console.log(`Unhandled event type: ${eventType}`);
    return new Response(`Unhandled event type: ${eventType}`, { status: 200 });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // if this is a new subscription ignore, if not update the subscription status to active
  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
    })
    .eq("subscription_id", invoice.subscription as string);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment (e.g., notify user, update subscription status)
  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status: "inactive",
    })
    .eq("subscription_id", invoice.subscription as string);

  // Update the subscription status in the database
  if (error) {
    console.error("Error updating subscription status:", error);
  } else {
    console.log("Subscription status updated successfully:", data);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Handle subscription changes (e.g., plan changes, cancellations)
  console.log(
    `Subscription updated. ID: ${subscription.id}, Status: ${subscription.status}`
  );
}
