'use client';

import Layout from "@/components/layout/Layout";

const PrivacyPage = () => {
  return (
    <Layout>
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl border border-border shadow-lg">
            <h1 className="font-display text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="prose prose-lg max-w-none">
              <p>
                smartlabs ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
              </p>
              
              <h2 className="font-display text-2xl font-bold mt-8 mb-4">Information We Collect</h2>
              <p>
                We may collect personal information from you in a variety of ways, including when you register on the site, book a class, and in connection with other activities, services, features, or resources we make available. We may collect the following types of information:
              </p>
              <ul>
                <li><strong>Personal Identification Information:</strong> Name, email address, phone number.</li>
                <li><strong>Booking Information:</strong> Course selections, chosen dates and times, and payment information (though we do not store full credit card details).</li>
                <li><strong>Technical Data:</strong> IP address, browser type, operating system, and other usage details when you access our site.</li>
              </ul>

              <h2 className="font-display text-2xl font-bold mt-8 mb-4">How We Use Your Information</h2>
              <p>We use the information we collect for various purposes, including to:</p>
              <ul>
                <li>Provide, operate, and maintain our services.</li>
                <li>Process your bookings and manage your account.</li>
                <li>Improve, personalize, and expand our services.</li>
                <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes.</li>
                <li>Process your transactions and prevent fraudulent transactions.</li>
              </ul>
              
              <h2 className="font-display text-2xl font-bold mt-8 mb-4">Data Security</h2>
              <p>
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
              </p>
              
              <h2 className="font-display text-2xl font-bold mt-8 mb-4">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
              </p>

              <h2 className="font-display text-2xl font-bold mt-8 mb-4">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at <a href="mailto:info@smartlabs.lk">info@smartlabs.lk</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PrivacyPage;
