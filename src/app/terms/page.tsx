export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-2">Terms of Service</h1>
      <p className="text-[14px] text-gray-400 mb-8">Last updated: April 2, 2026</p>

      <div className="space-y-6 text-[15px] text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Acceptance</h2>
          <p>By creating an account on SBUdate, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use SBUdate.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Eligibility</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You must be at least 18 years old to use SBUdate.</li>
            <li>You must be a current or recent Stony Brook University student.</li>
            <li>You may only create one account per person.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Community Guidelines</h2>
          <p>SBUdate has zero tolerance for objectionable content or abusive behavior. You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Post content that is sexually explicit, violent, hateful, or harassing</li>
            <li>Upload photos that you do not own or have rights to</li>
            <li>Impersonate another person or create fake profiles</li>
            <li>Harass, bully, stalk, or threaten other users</li>
            <li>Use SBUdate for commercial purposes or spam</li>
            <li>Attempt to circumvent any safety or moderation features</li>
          </ul>
          <p className="mt-3">Violations may result in immediate account termination without notice.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Content Moderation</h2>
          <p>We actively moderate content and respond to reports within 24 hours. We reserve the right to remove any content or account that violates these terms. Users can report and block other users at any time.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Your Content</h2>
          <p>You retain ownership of content you post. By posting content on SBUdate, you grant us a non-exclusive license to display it to other users as part of the service. You can delete your content and account at any time.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Safety</h2>
          <p>SBUdate is not responsible for the behavior of its users. Always exercise caution when meeting someone in person. Meet in public places and tell someone where you are going.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Termination</h2>
          <p>We may suspend or terminate your account at any time for any reason, including violation of these terms. You may delete your account at any time from the Settings page.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Disclaimer</h2>
          <p>SBUdate is provided &quot;as is&quot; without warranties. We are not liable for any damages arising from your use of the service.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Contact</h2>
          <p>Questions? Contact us at <a href="mailto:keugenelee11@gmail.com" className="text-gray-900 underline">keugenelee11@gmail.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
