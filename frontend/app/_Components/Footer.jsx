'use client'

const LOGO = '/brand/Zen_soul_logo.png' // put your logo here, or remove the <img> entirely

export default function Footer() {
  const onLogoError = (e) => {
    // if your logo fails, simply hide it to avoid broken image icon
    e.currentTarget.style.display = 'none'
  }

  return (
    <footer className="bg-[#111827] text-white pt-14 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Brand row (optional) */}
        <div className="mb-8 flex items-center gap-3">
          <img
            src={LOGO}
            alt="ZenSoul Wellness"
            width={36}
            height={36}
            onError={onLogoError}
            className="h-9 w-9 rounded"
          />
          <span className="text-lg font-semibold">ZenSoul Wellness</span>
        </div>

        {/* Crisis box */}
        <div id="crisis" className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8">
          <h3 className="text-xl font-semibold">In Crisis? Get Help Now</h3>
          <p className="text-white/80 text-sm mt-1">
            If you or someone you know is in immediate danger, call your local emergency number.
            In India, dial <strong>112</strong>. For emotional distress, you can contact
            <a className="underline underline-offset-4 ml-1" href="https://www.rohii.org/" target="_blank" rel="noreferrer">
              Rohii Helpline
            </a>.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <a href="tel:112" className="rounded-full bg-white text-gray-900 px-6 py-2 text-sm font-semibold hover:bg-gray-100">
              Call 112
            </a>
            <a href="/resources" className="rounded-full border border-white/30 px-6 py-2 text-sm font-semibold hover:bg-white/10">
              View Resources
            </a>
          </div>
        </div>

        {/* Final CTA */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-10 text-center" id="book">
          <h3 className="text-xl font-semibold">Ready to begin?</h3>
          <p className="text-white/80 text-sm mt-1">
            Book a session with a licensed therapist or take the free self-test to get matched.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
            <a href="/book" className="rounded-full bg-white text-gray-900 px-6 py-2 text-sm font-semibold hover:bg-gray-100">
              Book Now
            </a>
            <a href="#self-test" className="rounded-full border border-white/30 px-6 py-2 text-sm font-semibold hover:bg-white/10">
              Take Self-Test
            </a>
          </div>
        </div>

        {/* Footer columns */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-semibold mb-3">ZenSoul Wellness</h4>
            <p className="text-white/70">
              Confidential, premium online addiction counselling with licensed therapists.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Services</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="/online-addiction-counseling" className="hover:underline">Online Counselling</a></li>
              <li><a href="/recovery-plans" className="hover:underline">Recovery Plans</a></li>
              <li><a href="/family-therapy-addiction" className="hover:underline">Family Support</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="/blog" className="hover:underline">Blog</a></li>
              <li><a href="/resources" className="hover:underline">Guides & Tools</a></li>
              <li><a href="/privacy" className="hover:underline">Privacy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="mailto:care@zensoulwellness.com" className="hover:underline">care@zensoulwellness.com</a></li>
              <li><a href="/contact" className="hover:underline">Contact Form</a></li>
              <li><a href="/terms" className="hover:underline">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} ZenSoul Wellness. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
