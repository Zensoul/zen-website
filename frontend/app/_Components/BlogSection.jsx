// app/_Components/BlogSection.jsx
'use client'

import Link from 'next/link'

const posts = [
  {
    title: "How to Talk to a Loved One About Addiction",
    excerpt: "A step-by-step guide to approaching sensitive conversations with compassion and effectiveness.",
    href: "/blog/talk-to-loved-one"
  },
  {
    title: "Alcohol vs. Social Drinking: Where’s the Line?",
    excerpt: "Understand the difference between casual drinking and signs of dependency.",
    href: "/blog/alcohol-vs-social"
  },
  {
    title: "Digital Detox: Managing Internet & Gaming Addiction",
    excerpt: "Practical strategies to reclaim your focus and balance your online habits.",
    href: "/blog/digital-detox"
  }
]

export default function BlogSection() {
  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-serif text-[#2c2c2c] mb-6 text-center">From Our Blog</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((p, i) => (
            <div key={i} className="bg-[#fdfaf5] rounded-xl p-6 shadow hover:shadow-lg transition">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{p.excerpt}</p>
              <Link href={p.href} className="text-sm font-semibold text-[#c9a96a] hover:underline">
                Read More →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
