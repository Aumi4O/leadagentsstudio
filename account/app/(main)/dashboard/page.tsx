import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

// Credit packages with Stripe Payment Links
const creditPackages = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: '$50',
    perDemo: '$5.00',
    stripeLink: process.env.STRIPE_LINK_10 || '#',
  },
  {
    id: 'growth',
    name: 'Growth',
    credits: 50,
    price: '$200',
    perDemo: '$4.00',
    popular: true,
    stripeLink: process.env.STRIPE_LINK_50 || '#',
  },
  {
    id: 'scale',
    name: 'Scale',
    credits: 200,
    price: '$600',
    perDemo: '$3.00',
    stripeLink: process.env.STRIPE_LINK_200 || '#',
  },
]

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const credits = session.user.credits || 0

  return (
    <div className="relative min-h-screen">
      {/* Light Beams Background */}
      <div className="light-beams">
        <div className="beam beam-cyan"></div>
        <div className="beam beam-pink"></div>
        <div className="beam beam-blue"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, <span className="gradient-text">{session.user.name || 'there'}</span>
            </h1>
            <p className="text-gray-500 mt-1">{session.user.email}</p>
          </div>
        </div>

        {/* Credit Display Card */}
        <div className="credit-display mb-8">
          <div className="credit-glow"></div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">
                Available Credits
              </p>
              <div className="credit-number">{credits}</div>
              <p className="text-gray-400 text-sm mt-2">
                {credits === 0 ? 'Purchase credits to run demos' : `${credits} demo${credits !== 1 ? 's' : ''} remaining`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href="/#demo" 
                className={`btn-primary ${credits === 0 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <span>▶</span> Run Demo
              </Link>
              <a href="#packages" className="btn-primary btn-outline">
                Buy Credits
              </a>
            </div>
          </div>
        </div>

        {/* Credit Packages */}
        <section id="packages" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Credit Packages
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {creditPackages.map((pkg) => (
              <div 
                key={pkg.id} 
                className={`package-card ${pkg.popular ? 'popular' : ''}`}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                  <p className="text-gray-500 text-sm">{pkg.credits} demo credits</p>
                </div>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold gradient-text">{pkg.price}</span>
                  <span className="text-gray-400 text-sm ml-2">one-time</span>
                </div>
                
                <p className="text-gray-500 text-sm mb-6">
                  {pkg.perDemo} per demo
                </p>
                
                <a 
                  href={pkg.stripeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn-primary w-full ${pkg.popular ? 'btn-gradient' : ''}`}
                >
                  Purchase {pkg.credits} Credits →
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-4">
            Secure payment via Stripe. Credits added after payment confirmation.
          </p>
        </section>

        {/* Recent Activity */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Activity
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {credits === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No activity yet. Purchase credits to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Placeholder activity items - will be populated from database */}
                <div className="activity-item">
                  <div className="activity-icon purchase">💳</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Credits purchased</p>
                    <p className="text-gray-500 text-sm">Starter package (10 credits)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-cyan-500">+10</p>
                    <p className="text-gray-400 text-xs">Just now</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Links
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/"
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-cyan-400 hover:shadow-lg transition-all"
            >
              <span className="text-2xl mb-2 block">🏠</span>
              <h3 className="font-semibold text-gray-900">Home</h3>
              <p className="text-gray-500 text-sm">Back to main site</p>
            </Link>
            <Link 
              href="/#demo"
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-cyan-400 hover:shadow-lg transition-all"
            >
              <span className="text-2xl mb-2 block">▶️</span>
              <h3 className="font-semibold text-gray-900">Try Demo</h3>
              <p className="text-gray-500 text-sm">Run a live demo</p>
            </Link>
            <Link 
              href="/account"
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-cyan-400 hover:shadow-lg transition-all"
            >
              <span className="text-2xl mb-2 block">⚙️</span>
              <h3 className="font-semibold text-gray-900">Settings</h3>
              <p className="text-gray-500 text-sm">Manage your account</p>
            </Link>
            <a 
              href="mailto:support@smartlineagents.com"
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-cyan-400 hover:shadow-lg transition-all"
            >
              <span className="text-2xl mb-2 block">💬</span>
              <h3 className="font-semibold text-gray-900">Support</h3>
              <p className="text-gray-500 text-sm">Get help</p>
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
