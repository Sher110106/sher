// app/privacy/page.tsx
import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <p className="text-sm text-gray-600 mb-8">Last updated: January 09, 2025</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="mb-4">
          This Privacy Policy describes how we collect, use, process, and share information about you 
          when you use our application and its related services, particularly in connection with 
          Google Sign-In functionality.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
        
        <h3 className="text-xl font-semibold mb-3">Information you provide directly:</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Account information (name, email address)</li>
          <li className="mb-2">Profile information</li>
          <li className="mb-2">Any other information you choose to provide</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Information we collect automatically:</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Device information (device type, operating system)</li>
          <li className="mb-2">Log data (IP address, access times, app features used)</li>
          <li className="mb-2">Usage data (how you interact with our application)</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Information from third parties:</h3>
        <p className="mb-2">When you sign in using Google, we may receive:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Your Google account email address</li>
          <li className="mb-2">Your Google account profile information</li>
          <li className="mb-2">Your Google ID</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
        <p className="mb-2">We use the collected information to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Provide, maintain, and improve our services</li>
          <li className="mb-2">Create and manage your account</li>
          <li className="mb-2">Communicate with you about our services</li>
          <li className="mb-2">Ensure security and prevent fraud</li>
          <li className="mb-2">Comply with legal obligations</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Sharing and Disclosure</h2>
        <p className="mb-4">
          We do not sell your personal information. We may share your information in the following circumstances:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">With your consent</li>
          <li className="mb-2">To comply with legal obligations</li>
          <li className="mb-2">To protect our rights, privacy, safety, or property</li>
          <li className="mb-2">In connection with a business transfer or merger</li>
          <li className="mb-2">With service providers who assist in our operations</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
        <p className="mb-4">
          We implement appropriate technical and organizational measures to protect your personal 
          information against unauthorized access, alteration, disclosure, or destruction.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
        <p className="mb-2">You have the right to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Access your personal information</li>
          <li className="mb-2">Correct inaccurate data</li>
          <li className="mb-2">Request deletion of your data</li>
          <li className="mb-2">Object to or restrict processing of your data</li>
          <li className="mb-2">Request a copy of your data</li>
          <li className="mb-2">Withdraw consent at any time</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
        <p className="mb-4">
          Our service is not directed to children under 13. We do not knowingly collect personal 
          information from children under 13. If you become aware that a child has provided us with 
          personal information, please contact us.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. We will notify you of any changes by 
          posting the new Privacy Policy on this page and updating the "Last updated" date.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <p className="mb-4">
          If you have any questions about this Privacy Policy, please contact us at:
          {/* Replace with your contact information */}
          <span className="block mt-2 font-medium">[Your Contact Information]</span>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Specific Information for Google Sign-In</h2>
        <p className="mb-4">When you use Google Sign-In, we adhere to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Google OAuth 2.0 specifications</li>
          <li className="mb-2">Google's API Services User Data Policy</li>
          <li className="mb-2">Limited use requirements for Google user data</li>
        </ul>
        <p className="mb-4">
          We only request and use the minimum necessary Google account information required to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Authenticate your identity</li>
          <li className="mb-2">Create and maintain your account</li>
          <li className="mb-2">Provide our core service functionality</li>
        </ul>
      </section>
    </div>
  );
}