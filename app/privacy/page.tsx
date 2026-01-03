"use client";

import { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = "Privacy Policy - Lynqit";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-zinc-400 mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="space-y-8 text-zinc-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to Lynqit. We are committed to protecting your personal data and respecting your privacy. 
              This Privacy Policy explains how we collect, use, and protect your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Data Controller</h2>
            <p>
              Lynqit is the data controller for your personal data. If you have any questions about this Privacy Policy, 
              please contact us at: <a href="mailto:info@lynqit.com" className="text-[#2E47FF] hover:underline">info@lynqit.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">3.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Email address (for account creation and authentication)</li>
              <li>Password (encrypted and stored securely)</li>
              <li>Page content (links, images, text you add to your pages)</li>
              <li>Payment information (processed securely through Mollie, we do not store credit card details)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">3.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Usage data (pages visited, clicks, time spent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Cookies and Local Storage</h2>
            <p className="mb-4">
              We use cookies and local storage to provide and improve our services. Below is a detailed list of all cookies and local storage items we use:
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.1 Essential Cookies</h3>
            <p className="mb-2">These cookies are necessary for the website to function and cannot be disabled:</p>
            <div className="bg-zinc-800 rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Purpose</th>
                    <th className="text-left py-2 px-2">Duration</th>
                    <th className="text-left py-2 px-2">Type</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">sb-*-auth-token</td>
                    <td className="py-2 px-2">Supabase authentication session token</td>
                    <td className="py-2 px-2">Session / 1 year</td>
                    <td className="py-2 px-2">HTTP Cookie</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">sb-*-auth-token-code-verifier</td>
                    <td className="py-2 px-2">OAuth code verifier for secure authentication</td>
                    <td className="py-2 px-2">Session</td>
                    <td className="py-2 px-2">HTTP Cookie</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.2 Functional Cookies / Local Storage</h3>
            <p className="mb-2">These are used to enhance functionality and user experience:</p>
            <div className="bg-zinc-800 rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Purpose</th>
                    <th className="text-left py-2 px-2">Duration</th>
                    <th className="text-left py-2 px-2">Type</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">lynqit_user</td>
                    <td className="py-2 px-2">Stores user information for faster page loads (email, role)</td>
                    <td className="py-2 px-2">Until logout</td>
                    <td className="py-2 px-2">Local Storage</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">lynqit_pages</td>
                    <td className="py-2 px-2">Caches user's pages list for improved performance</td>
                    <td className="py-2 px-2">Until cache expires or logout</td>
                    <td className="py-2 px-2">Local Storage</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">lynqit_pages_timestamp</td>
                    <td className="py-2 px-2">Timestamp for cache expiration</td>
                    <td className="py-2 px-2">Until cache expires</td>
                    <td className="py-2 px-2">Local Storage</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">lynqit_dashboard_theme</td>
                    <td className="py-2 px-2">Stores user's theme preference (light/dark/auto)</td>
                    <td className="py-2 px-2">Persistent</td>
                    <td className="py-2 px-2">Local Storage</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">pending_slug</td>
                    <td className="py-2 px-2">Temporarily stores page slug during payment flow</td>
                    <td className="py-2 px-2">Session</td>
                    <td className="py-2 px-2">Session Storage</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">cookie_consent</td>
                    <td className="py-2 px-2">Stores your cookie consent preference</td>
                    <td className="py-2 px-2">1 year</td>
                    <td className="py-2 px-2">Local Storage</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-mono text-xs">cookie_consent_timestamp</td>
                    <td className="py-2 px-2">Timestamp of when consent was given</td>
                    <td className="py-2 px-2">1 year</td>
                    <td className="py-2 px-2">Local Storage</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.3 Remember Me Functionality</h3>
            <p>
              When you check "Remember me" during login, we extend your authentication session duration. 
              This uses Supabase's session management cookies to maintain your login state across browser sessions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide and maintain our service</li>
              <li>To authenticate and manage your account</li>
              <li>To process payments and manage subscriptions</li>
              <li>To improve and optimize our service</li>
              <li>To communicate with you about your account</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Storage and Security</h2>
            <p>
              Your data is stored securely using Supabase, which provides enterprise-grade security. 
              We use encryption in transit (HTTPS) and at rest. Passwords are hashed using bcrypt and never stored in plain text.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights (GDPR)</h2>
            <p className="mb-4">Under the General Data Protection Regulation (GDPR), you have the following rights:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Right to access:</strong> You can request a copy of your personal data</li>
              <li><strong>Right to rectification:</strong> You can correct inaccurate data</li>
              <li><strong>Right to erasure:</strong> You can request deletion of your data</li>
              <li><strong>Right to restrict processing:</strong> You can limit how we use your data</li>
              <li><strong>Right to data portability:</strong> You can receive your data in a structured format</li>
              <li><strong>Right to object:</strong> You can object to certain processing activities</li>
              <li><strong>Right to withdraw consent:</strong> You can withdraw consent at any time</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at: <a href="mailto:info@lynqit.com" className="text-[#2E47FF] hover:underline">info@lynqit.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Third-Party Services</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Supabase:</strong> Authentication and database services</li>
              <li><strong>Mollie:</strong> Payment processing (we do not store credit card information)</li>
              <li><strong>Vercel:</strong> Hosting and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide services. 
              If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page 
              and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:{" "}
              <a href="mailto:info@lynqit.com" className="text-[#2E47FF] hover:underline">info@lynqit.com</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <Link
            href="/"
            className="text-[#2E47FF] hover:underline font-medium"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

