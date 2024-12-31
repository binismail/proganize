import Stripe from "stripe";
import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { supabase } from "@/utils/supabase/instance";
import { addWordCredits } from "@/lib/wordCredit";

const Mixpanel = require("mixpanel");
const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);

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
      `Checkout completed. Subscription ID: ${subscriptionId}, Customer ID: ${customerId}`,
    );

    // Check if this is a credit top-up
    if (session.metadata?.creditAmount) {
      try {
        const creditAmount = parseInt(session.metadata.creditAmount);
        let totalCredits = creditAmount;

        // Add bonus credits for promotions
        if (session.metadata.isPromotion === "true") {
          // Add 50% bonus for holiday special
          const bonusCredits = Math.floor(creditAmount * 0.5);
          totalCredits += bonusCredits;

          // Track promotion usage in mixpanel
          mixpanel.track("Holiday Promotion Used", {
            distinct_id: session.metadata.userId,
            creditAmount: creditAmount,
            bonusCredits: bonusCredits,
            totalCredits: totalCredits,
            timestamp: new Date().toISOString(),
          });
        }

        const updatedCredits = await addWordCredits(
          session.metadata.userId,
          totalCredits,
        );

        // Record the transaction
        await supabase.from("credit_transactions").insert({
          user_id: session.metadata.userId,
          amount: creditAmount,
          bonus_amount: session.metadata.isPromotion === "true" ? Math.floor(creditAmount * 0.5) : 0,
          transaction_type: session.metadata.isPromotion === "true" ? "holiday_promotion" : "top_up",
          stripe_session_id: session.id,
        });

        console.log(
          `Credits added successfully. New balance: ${updatedCredits}`,
        );
        return new Response("Credits added successfully", { status: 200 });
      } catch (error) {
        console.error("Error processing credit top-up:", error);
        return new Response("Server error", { status: 500 });
      }
    }

    try {
      // Fetch additional details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const invoice = await stripe.invoices.retrieve(session.invoice as string);

      // Calculate credits based on subscription interval
      const subscriptionInterval = subscription.items.data[0].plan.interval;
      const monthlyCredits = 10000; // Base monthly credit amount
      const creditAmount = subscriptionInterval === "month"
        ? monthlyCredits
        : monthlyCredits * 12;

      // Add word credits
      if (!session.metadata?.userId) {
        throw new Error("User ID is required");
      }

      await addWordCredits(
        session.metadata.userId,
        creditAmount,
      );

      try {
        await supabase.from("subscriptions").insert({
          user_id: session.metadata?.userId,
          subscription_id: subscriptionId,
          customer_id: customerId,
          status: subscription.status,
          current_period_end: new Date(
            subscription.current_period_end * 1000,
          ).toISOString(),
          current_period_start: new Date(
            subscription.current_period_start * 1000,
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

      mixpanel.track("subscription", {
        distinct_id: session.metadata?.userId,
        amount: invoice.amount_paid,
        plan: subscription.items.data[0].plan.interval
          ? subscription.items.data[0].plan.interval === "month"
            ? "Monthly"
            : "Yearly"
          : "",
      });

      mixpanel.people.set(session.metadata?.userId, {
        plan: "Pro",
      });

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
  // Retrieve the subscription details
  const subscriptionId = invoice.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Calculate credits based on subscription interval
  const subscriptionInterval = subscription.items.data[0].plan.interval;
  const monthlyCredits = 10000; // Base monthly credit amount
  const creditAmount = subscriptionInterval === "month"
    ? monthlyCredits
    : monthlyCredits * 12;

  // Add word credits
  if (invoice.metadata?.userId) {
    await addWordCredits(invoice.metadata.userId, creditAmount);
  }

  // Update the subscription status and period in the database
  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      current_period_end: new Date(
        subscription.current_period_end * 1000,
      ).toISOString(),
      current_period_start: new Date(
        subscription.current_period_start * 1000,
      ).toISOString(),
    })
    .eq("subscription_id", subscriptionId);

  mixpanel.track("subscription", {
    distinct_id: invoice.metadata?.userId,
    amount: invoice.amount_paid,
    plan: subscription.items.data[0].plan.interval
      ? subscription.items.data[0].plan.interval === "month"
        ? "Monthly"
        : "Yearly"
      : "",
  });
}
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice: ${invoice.id}`);

  // Update the subscription status to inactive
  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status: "inactive",
    })
    .eq("subscription_id", invoice.subscription as string);

  if (error) {
    console.error("Error updating subscription status:", error);
  } else {
    console.log("Subscription status updated to inactive:", data);
  }

  // Optionally, notify the user about the failed payment
  if (invoice.metadata?.userId) {
    // Implement your notification logic here, e.g., send an email
    console.log(
      `Notify user ${invoice.metadata.userId} about payment failure.`,
    );
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Handle subscription changes (e.g., plan changes, cancellations)
  console.log(
    `Subscription updated. ID: ${subscription.id}, Status: ${subscription.status}`,
  );
}
