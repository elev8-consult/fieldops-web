import { Link } from 'react-router-dom';

const LAST_UPDATED = 'October 4, 2026';

export function Privacy() {
  return (
    <div className="min-h-screen bg-white text-slate-700">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-lg font-bold text-[#141b2b]">
            I Prom
          </Link>
          <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-12 leading-relaxed">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
        </div>

        <p>
          This policy explains how I.Prom Agency (&quot;I Prom&quot;, &quot;we&quot;) handles
          information in the I Prom mobile app and the I Prom web dashboard. The app is an
          internal work tool for I Prom field staff (merchandisers and promoters). Accounts are
          created by I Prom administrators; the public cannot sign up.
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Information we collect</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Account details</strong> provided by your employer when your account is
              created: your name, work phone number, role, assigned brand and stores, and
              optionally an email address.
            </li>
            <li>
              <strong>Work reports</strong> you submit in the app: the store, products, stock
              quantities, sales, samples, and any notes or customer feedback you enter.
            </li>
            <li>
              <strong>Sign-in records</strong>: when you last signed in, and failed sign-in
              attempts, used to protect your account.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Camera</h2>
          <p>
            The app uses the camera only to scan product barcodes while you fill in a report.
            Images are processed on your device to read the barcode and are not saved or
            uploaded.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">What we don&apos;t collect</h2>
          <p>
            We do not track your location, show ads, use advertising identifiers, or track you
            across other apps or websites. We do not sell your information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">How we use information</h2>
          <p>
            Information is used only to run I Prom&apos;s field operations: signing you in,
            recording store visits and reports, and producing stock and sales dashboards for I
            Prom and the brands it works for. Report data may be shared with the brand whose
            products the report covers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Storage and security</h2>
          <p>
            Data is sent over encrypted connections (HTTPS) and stored on secured servers. Your
            sign-in session is stored in your device&apos;s secure storage. Login codes are
            stored only in encrypted (hashed) form.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Retention and deletion</h2>
          <p>
            We keep account and report data for as long as you work with I Prom and as needed
            for business records. To have your account deactivated or your personal information
            deleted, contact us using the details below or ask your I Prom administrator.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p>
            I.Prom Agency
            <br />
            Email:{' '}
            <a href="mailto:i.prom@live.com" className="text-blue-600 hover:underline">
              i.prom@live.com
            </a>
            <br />
            Phone:{' '}
            <a href="tel:+96192225035" className="text-blue-600 hover:underline">
              +961 9 225 035
            </a>
          </p>
        </section>

        <p className="text-sm text-slate-500">
          We may update this policy from time to time. The date at the top shows when it last
          changed.
        </p>
      </main>
    </div>
  );
}
