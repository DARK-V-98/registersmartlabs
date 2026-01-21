'use client';

import Layout from "@/components/layout/Layout";

const TermsPage = () => {
  return (
    <Layout>
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl border border-border shadow-lg">
            <h1 className="font-display text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="prose prose-lg max-w-none">
              <p>
                Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the smartlabs website (the "Service") operated by smartlabs ("us", "we", or "our").
              </p>

              <h2 className="font-display text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using our Service, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>

              <h2 className="font-display text-2xl font-bold mt-8 mb-4">2. User Accounts</h2>
              <p>
                When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
              </p>

              <h2 className="font-display text-2xl font-bold mt-8 mb-4">3. Bookings and Payments</h2>
              <p>
                By booking a class, you agree to pay the fees for the course you select. All payments must be made through the approved payment methods. Confirmed bookings are subject to our cancellation policy. We reserve the right to refuse or cancel your booking at any time for reasons including but not limited to: course availability, errors in the description or price of the course, or error in your booking.
              </p>

              <h2 className="font-display text-2xl font-bold mt-8 mb-4">4. User Conduct</h2>
              <p>
                You agree not to use the Service for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the Service in any way that could damage the Service, the services, or the general business of smartlabs.
              </p>

              <h2 className="font-display text-2xl font-bold mt-8 mb-4">5. Limitation of Liability</h2>
              <p>
                In no event shall smartlabs, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>

              <h2 className="font-display text-2xl font-bold mt-8 mb-4">6. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of Sri Lanka, without regard to its conflict of law provisions.
              </p>

              <h2 className="font-display text-2xl font-bold mt-8 mb-4">7. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>

              <h2 className="font-display text-2xl font-bold mt-8 mb-4">Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at <a href="mailto:info@smartlabs.lk">info@smartlabs.lk</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TermsPage;
