"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Nav from "@/components/layout/nav";

export default function PrivacyAndTermsPage() {
  const [activeTab, setActiveTab] = useState("privacy");

  return (
    <div className='min-h-screen flex flex-col bg-background text-foreground'>
      <Nav />

      <main className='flex-grow flex flex-col'>
        <div className='container mx-auto px-4 py-6 flex-grow flex flex-col'>
          <div className='flex space-x-4 mb-6'>
            <Button
              onClick={() => setActiveTab("privacy")}
              variant={activeTab === "privacy" ? "default" : "outline"}
            >
              Privacy Policy
            </Button>
            <Button
              onClick={() => setActiveTab("terms")}
              variant={activeTab === "terms" ? "default" : "outline"}
            >
              Terms of Service
            </Button>
          </div>

          <ScrollArea className='flex-grow rounded-md border'>
            <div className='p-6 space-y-6'>
              {activeTab === "privacy" ? (
                <div className='space-y-6'>
                  <h2 className='text-3xl font-bold'>
                    Privacy Policy for Proganize (by Gistabyte Inc.)
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Effective Date: [Insert Date]
                  </p>

                  <section>
                    <h3 className='text-2xl font-semibold'>Introduction</h3>
                    <p>
                      Gistabyte Inc. ("we," "us," "our") operates Proganize, a
                      platform for indie hackers to easily generate Product
                      Requirement Documents (PRD) and collaborate on them. We
                      are committed to protecting your privacy. This Privacy
                      Policy explains how we collect, use, disclose, and
                      safeguard your information when you use Proganize. By
                      using our services, you consent to the collection and use
                      of your information as outlined in this Privacy Policy.
                    </p>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>
                      Information We Collect
                    </h3>
                    <p>We collect the following types of information:</p>
                    <ul className='list-disc pl-6 space-y-2'>
                      <li>
                        <strong>Personal Information:</strong> When you register
                        for an account, we collect personal details such as your
                        name, email address, and any other information necessary
                        to provide our services.
                      </li>
                      <li>
                        <strong>Document Data:</strong> Any documents or content
                        you upload, create, or collaborate on within Proganize.
                      </li>
                      <li>
                        <strong>Usage Data:</strong> Information about how you
                        use Proganize, including login details, IP address, and
                        browser information.
                      </li>
                      <li>
                        <strong>Payment Information:</strong> For paid users, we
                        may collect and process payment details through
                        third-party providers like Stripe.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>
                      How We Use Your Information
                    </h3>
                    <p>
                      We may use the information we collect from you for the
                      following purposes:
                    </p>
                    <ul className='list-disc pl-6 space-y-2'>
                      <li>To provide and maintain our service.</li>
                      <li>
                        To personalize and improve your experience on the
                        platform.
                      </li>
                      <li>To process payments and manage subscriptions.</li>
                      <li>
                        To communicate with you about updates, changes, or
                        promotional offers.
                      </li>
                      <li>
                        To monitor and analyze usage trends to improve our
                        platform.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>
                      Sharing of Information
                    </h3>
                    <p>
                      We do not sell your personal information to third parties.
                      However, we may share your data with:
                    </p>
                    <ul className='list-disc pl-6 space-y-2'>
                      <li>
                        <strong>Service Providers:</strong> Trusted third
                        parties like Supabase, Stripe, and OpenAI for essential
                        services like authentication, payments, and AI-based
                        features.
                      </li>
                      <li>
                        <strong>Legal Authorities:</strong> If required by law
                        or in the case of legal processes, such as subpoenas or
                        court orders.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>Data Security</h3>
                    <p>
                      We implement measures to safeguard your data. However, no
                      method of transmission over the Internet or electronic
                      storage is 100% secure. While we strive to protect your
                      personal information, we cannot guarantee its absolute
                      security.
                    </p>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>Your Rights</h3>
                    <p>
                      You can access, modify, or delete your account information
                      at any time by logging into your account settings. If you
                      wish to delete your account entirely, please contact us.
                    </p>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>
                      Changes to This Policy
                    </h3>
                    <p>
                      We may update this policy periodically. We will notify you
                      of any changes by posting the new policy on our site, and
                      the effective date will be updated accordingly.
                    </p>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>Contact Us</h3>
                    <p>
                      For questions or concerns about this policy, please
                      contact us at [support email].
                    </p>
                  </section>
                </div>
              ) : (
                <div className='space-y-6'>
                  <h2 className='text-3xl font-bold'>
                    Terms of Service for Proganize (by Gistabyte Inc.)
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Effective Date: [Insert Date]
                  </p>

                  <section>
                    <h3 className='text-2xl font-semibold'>
                      Acceptance of Terms
                    </h3>
                    <p>
                      By using Proganize, you agree to these Terms of Service
                      ("Terms") and our Privacy Policy. If you do not agree,
                      please do not use our platform.
                    </p>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>Eligibility</h3>
                    <p>
                      You must be 18 years or older to use Proganize. By
                      registering an account, you confirm that you are of legal
                      age.
                    </p>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>
                      Account Registration
                    </h3>
                    <p>
                      To use Proganize, you must create an account. You are
                      responsible for maintaining the confidentiality of your
                      account credentials and for all activities that occur
                      under your account. Gistabyte Inc. reserves the right to
                      suspend or terminate accounts for any violation of these
                      Terms.
                    </p>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>Use of Service</h3>
                    <p>
                      Proganize allows users to create, upload, and collaborate
                      on documents. You are solely responsible for the content
                      you create or share. You agree not to:
                    </p>
                    <ul className='list-disc pl-6 space-y-2'>
                      <li>
                        Use the platform for any illegal or unauthorized
                        purposes.
                      </li>
                      <li>
                        Upload harmful, offensive, or inappropriate content.
                      </li>
                      <li>Attempt to hack or reverse-engineer the platform.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>
                      Payments and Subscriptions
                    </h3>
                    <p>Proganize offers free and paid plans:</p>
                    <ul className='list-disc pl-6 space-y-2'>
                      <li>
                        <strong>Free Plan:</strong> Users can create documents,
                        chat with the document (with a conversation limit), and
                        invite up to 3 collaborators.
                      </li>
                      <li>
                        <strong>Paid Plan:</strong> Includes all free plan
                        features, plus unlimited collaborators, conversations,
                        public sharing of documents, ability to download
                        documents in various formats, priority access, and
                        advanced features such as add-ons (user stories, product
                        roadmaps, etc.) and document uploads for AI enhancement.
                      </li>
                    </ul>
                    <p>
                      Payment is processed via Stripe, and all subscriptions are
                      governed by Stripe's terms of service.
                    </p>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>Termination</h3>
                    <p>
                      You may terminate your account at any time. We reserve the
                      right to terminate or suspend accounts at our discretion,
                      particularly for breaches of these Terms.
                    </p>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>
                      Limitation of Liability
                    </h3>
                    <p>
                      Gistabyte Inc. will not be liable for any indirect,
                      incidental, or consequential damages arising out of your
                      use of Proganize. Our total liability shall not exceed the
                      amount you paid to us in the last 12 months for the
                      service.
                    </p>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>Governing Law</h3>
                    <p>
                      These Terms are governed by the laws of the State of
                      Delaware, without regard to its conflict of law
                      provisions.
                    </p>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>Changes to Terms</h3>
                    <p>
                      We may update these Terms at any time. We will notify
                      users of any changes by updating this page, and the new
                      Terms will be effective from the updated date.
                    </p>
                  </section>

                  <section>
                    <h3 className='text-2xl font-semibold'>Contact Us</h3>
                    <p>
                      For questions or concerns about these Terms, please
                      contact us at [support email].
                    </p>
                  </section>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>

      <footer className='border-t'>
        <div className='container mx-auto px-4 py-4 text-center text-sm text-muted-foreground'>
          © {new Date().getFullYear()} Gistabyte Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
