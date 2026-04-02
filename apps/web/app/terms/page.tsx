import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-green-400 hover:text-green-300 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-400">Last updated: February 3, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 space-y-8 text-gray-300">
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to CaseWin AI ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the CaseWin AI platform, including our website, mobile applications, and all related services (collectively, the "Service").
            </p>
            <p className="mt-3">
              By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p>CaseWin AI is a Nigerian legal technology platform that provides:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong>AI-Powered Legal Tools:</strong> Document drafting, case analysis, legal research, and contract review powered by artificial intelligence.</li>
              <li><strong>Lawyer Marketplace:</strong> A platform connecting clients with verified legal professionals in Nigeria.</li>
              <li><strong>Legal Prediction Markets:</strong> A platform where users can participate in prediction markets related to Nigerian court case outcomes.</li>
              <li><strong>Document Management:</strong> Secure storage and management of legal documents.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
            <p>To access certain features of the Service, you must create an account. You agree to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. User Types</h2>
            <p>Our platform supports three types of users:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong>Clients:</strong> Individuals or businesses seeking legal services and information.</li>
              <li><strong>Lawyers:</strong> Licensed legal practitioners registered with the Nigerian Bar Association (NBA) who offer services through our platform.</li>
              <li><strong>Law Firms:</strong> Legal practices that provide services through multiple lawyers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Lawyer Verification</h2>
            <p>
              Lawyers on our platform must provide valid credentials, including their NBA enrollment number. We verify this information before lawyers can offer services. However, users should conduct their own due diligence when engaging legal services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Prediction Markets</h2>
            <p>Our prediction markets feature allows users to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>View and participate in markets related to Nigerian court case outcomes</li>
              <li>Place predictions using platform credits</li>
              <li>Earn rewards based on accurate predictions</li>
            </ul>
            <p className="mt-3">
              <strong>Important:</strong> Prediction markets are for informational and entertainment purposes only. They should not be considered gambling, legal advice, or a guarantee of any case outcome. Past performance does not guarantee future results.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Payment Terms</h2>
            <p>
              Payments on CaseWin AI are processed through ZendFi and other authorized payment providers. By making payments through our platform, you agree to:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Pay all fees and charges incurred through your account</li>
              <li>Provide valid payment information</li>
              <li>Accept that fees are in Nigerian Naira (₦) unless otherwise stated</li>
              <li>Understand that certain services may have non-refundable fees</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. AI-Generated Content Disclaimer</h2>
            <p>
              Our AI tools provide automated assistance for legal tasks. However:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>AI-generated content is not a substitute for professional legal advice</li>
              <li>Users should always consult with a qualified lawyer for specific legal matters</li>
              <li>We do not guarantee the accuracy or completeness of AI-generated content</li>
              <li>Users are responsible for reviewing and verifying all AI-generated documents</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Use the Service for any unlawful purpose</li>
              <li>Impersonate any person or entity</li>
              <li>Submit false or misleading information</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Violate any applicable Nigerian laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Intellectual Property</h2>
            <p>
              The Service and its contents, features, and functionality are owned by CaseWin AI and are protected by Nigerian and international copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by Nigerian law, CaseWin AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the Nigerian courts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on our platform. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 bg-gray-700/50 p-4 rounded-lg">
              <p><strong>CaseWin AI</strong></p>
              <p>Email: legal@casewin.ai</p>
              <p>Address: Lagos, Nigeria</p>
            </div>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/privacy" className="text-green-400 hover:text-green-300">
            Privacy Policy
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
