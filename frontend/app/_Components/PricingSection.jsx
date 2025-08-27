'use client'

const plans = [
  {
    name: 'Single Session',
    price: '₹1,499',
    desc: 'One 45–50 min session. Ideal to get started.',
    perks: ['Licensed therapist', 'Video/Audio/Chat', 'Confidential & secure'],
    cta: 'Book Now',
  },
  {
    name: 'Recovery Pack (4)',
    price: '₹5,499',
    desc: 'Four sessions with a structured plan & check-ins.',
    perks: ['Personalised plan', 'Between-session support', 'Save vs single sessions'],
    cta: 'Choose Plan',
    featured: true,
  },
  {
    name: 'Family Support',
    price: '₹1,999',
    desc: 'One family session focused on boundaries & communication.',
    perks: ['Licensed therapist', 'Guided framework', 'Practical strategies'],
    cta: 'Book Now',
  },
]

export default function PricingSection() {
  return (
    <section className="bg-[#fdfaf5] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-serif text-[#2c2c2c] mb-4">Pricing & Plans</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Transparent, accessible pricing — premium care without hidden fees.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border p-6 text-left shadow-sm ${
                p.featured ? 'bg-white shadow-xl border-gray-200' : 'bg-white/90'
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
              <p className="mt-1 text-3xl font-bold text-gray-900">{p.price}</p>
              <p className="mt-1 text-sm text-gray-600">{p.desc}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-800 inline-block" />
                    {perk}
                  </li>
                ))}
              </ul>
              <button className={`mt-5 rounded-full px-5 py-2 text-sm ${
                  p.featured
                    ? 'bg-gray-900 text-white hover:bg-black'
                    : 'border hover:bg-gray-50'
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Need invoice/insurance letters? We can provide treatment summaries upon request.
        </p>
      </div>
    </section>
  )
}
