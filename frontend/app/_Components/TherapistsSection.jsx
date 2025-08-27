'use client'

// NOTE: Using plain <img> tags so it's compatible with `output: 'export'`
// If you prefer to keep next/image, also set `images.unoptimized: true` in next.config.js (shown below)

const therapists = [
  {
    name: "Dr. Aditi Sharma",
    title: "Clinical Psychologist (PhD)",
    exp: "12+ yrs in Addiction & CBT",
    img: "/therapists/aditi.webp",
    desc: "Specialist in alcohol dependence and relapse prevention using CBT & mindfulness.",
  },
  {
    name: "Rahul Menon",
    title: "Addiction Counsellor (MSc)",
    exp: "8+ yrs in Recovery Therapy",
    img: "/therapists/rahul.webp",
    desc: "Focuses on family therapy and structured recovery plans for young adults.",
  },
  {
    name: "Priya Kapoor",
    title: "Counsellor (MSW)",
    exp: "10+ yrs in Behavioural Addictions",
    img: "/therapists/priya.webp",
    desc: "Expert in internet/gaming addiction, teen therapy, and anxiety management.",
  },
]

export default function TherapistsSection() {
  return (
    <section className="bg-[#fdfaf5] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-serif text-[#2c2c2c] mb-6">
          Meet Our Therapists
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-12">
          Licensed, experienced, and compassionate professionals dedicated to your healing.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {therapists.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-left hover:shadow-2xl transition"
            >
              <div className="relative mx-auto mb-4 h-24 w-24">
                <img
                  src={t.img}
                  alt={t.name}
                  loading="lazy"
                  decoding="async"
                  className="h-24 w-24 rounded-full object-cover shadow-md mx-auto"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">{t.name}</h3>
              <p className="text-sm text-emerald-700 font-medium text-center">{t.title}</p>
              <p className="text-sm text-gray-500 text-center">{t.exp}</p>
              <p className="mt-3 text-sm text-gray-600">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
