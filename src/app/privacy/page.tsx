export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-[14px] text-gray-400 mb-8">Last updated: April 2, 2026</p>

      <div className="space-y-6 text-[15px] text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Overview</h2>
          <p>SBUdate is a dating app for Stony Brook University students. We take your privacy seriously. This policy explains what data we collect, how we use it, and your rights.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Account info:</strong> Name, age, gender, email (via Google Sign-In)</li>
            <li><strong>Profile info:</strong> Photos, prompts, major, graduation year, hometown, residence hall, height, drinking/smoking preferences</li>
            <li><strong>Usage data:</strong> Likes, matches, messages, and skips</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To show your profile to other SBU students</li>
            <li>To match you with compatible people</li>
            <li>To enable messaging between matches</li>
            <li>To enforce community guidelines and safety</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Data Storage</h2>
          <p>Your data is stored securely using Supabase (hosted on AWS). Photos are stored in Supabase Storage. We do not sell your data to third parties.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Data Sharing</h2>
          <p>We do not share your personal data with third parties except:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Other SBUdate users (your public profile)</li>
            <li>When required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You can delete your account and all data at any time from Settings</li>
            <li>You can edit or remove any profile information</li>
            <li>You can request a copy of your data by contacting us</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Contact</h2>
          <p>For questions about this privacy policy or your data, contact us at <a href="mailto:keugenelee11@gmail.com" className="text-gray-900 underline">keugenelee11@gmail.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
