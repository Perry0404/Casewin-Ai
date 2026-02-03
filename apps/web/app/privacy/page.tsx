import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-green-400 hover:text-green-300 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: February 3, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 space-y-8 text-gray-300">
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              CaseWin AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
            </p>
            <p className="mt-3">
              We comply with the Nigeria Data Protection Regulation (NDPR) 2019 and other applicable data protection laws. By using our Service, you consent to the data practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-white mt-4 mb-2">2.1 Personal Information</h3>
            <p>We collect information you provide directly, including:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
              <li><strong>Profile Information:</strong> User type (client, lawyer, law firm), profile photo</li>
              <li><strong>Lawyer Credentials:</strong> NBA enrollment number, specializations, years of experience, law firm affiliation</li>
              <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely by Korapay)</li>
              <li><strong>Communication Data:</strong> Messages, consultations, and correspondence through our platform</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-4 mb-2">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
              <li><strong>Cookies:</strong> Session cookies, authentication tokens, preference cookies</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-4 mb-2">2.3 Legal Documents</h3>
            <p>
              When you use our AI tools, we may process legal documents you upload for drafting, analysis, or review purposes. This content is processed securely and used solely to provide the requested services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Verify lawyer credentials and maintain marketplace integrity</li>
              <li>Send administrative notifications and updates</li>
              <li>Respond to inquiries and provide customer support</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Detect, prevent, and address technical issues or fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>
            
            <h3 className="text-xl font-medium text-white mt-4 mb-2">4.1 Service Providers</h3>
            <p>We share data with trusted third-party service providers who assist us in operating our platform:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Korapay:</strong> Payment processing</li>
              <li><strong>xAI:</strong> AI-powered document analysis and generation</li>
              <li><strong>Vercel:</strong> Hosting and infrastructure</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-4 mb-2">4.2 Lawyer-Client Connections</h3>
            <p>
              When you book a consultation with a lawyer, relevant information is shared to facilitate the service. This includes contact details and case-related information you choose to share.
            </p>

            <h3 className="text-xl font-medium text-white mt-4 mb-2">4.3 Legal Requirements</h3>
            <p>
              We may disclose your information if required by law, court order, or government request, or to protect our rights, privacy, safety, or property.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your data, including:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure data centers with physical security measures</li>
            </ul>
            <p className="mt-3">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide services. We may retain certain information for longer periods as required by law or for legitimate business purposes, such as:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Financial transaction records (7 years for tax purposes)</li>
              <li>Legal documents (as long as legally required)</li>
              <li>Account information (until deletion is requested)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights Under NDPR</h2>
            <p>Under the Nigeria Data Protection Regulation, you have the right to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data (subject to legal obligations)</li>
              <li><strong>Restriction:</strong> Request limitation of data processing</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to certain types of data processing</li>
              <li><strong>Withdraw Consent:</strong> Withdraw previously given consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us at privacy@casewin.ai
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Cookies Policy</h2>
            <p>We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Keep you signed in to your account</li>
              <li>Remember your preferences and settings</li>
              <li>Understand how you use our platform</li>
              <li>Improve our services based on usage patterns</li>
            </ul>
            <p className="mt-3">
              You can control cookies through your browser settings. Disabling certain cookies may affect the functionality of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Children's Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than Nigeria where our service providers operate. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Material changes will be communicated via email or platform notification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-3 bg-gray-700/50 p-4 rounded-lg">
              <p><strong>CaseWin AI - Data Protection Officer</strong></p>
              <p>Email: privacy@casewin.ai</p>
              <p>Address: Lagos, Nigeria</p>
            </div>
            <p className="mt-4">
              You also have the right to lodge a complaint with the National Information Technology Development Agency (NITDA), the supervisory authority for data protection in Nigeria.
            </p>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/terms" className="text-green-400 hover:text-green-300">
            Terms of Service
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/" className="text-green-400 hover:text-green-300">
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
