"use client"

import { useState } from "react"
import Link from "next/link"

export default function DemoPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [channel, setChannel] = useState("whatsapp")
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // $5 demo Stripe Payment Link (set in env or replace with your link)
  const STRIPE_DEMO_LINK = process.env.NEXT_PUBLIC_STRIPE_DEMO_LINK || "https://buy.stripe.com/YOUR_DEMO_LINK"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!consent) {
      alert("Please accept the consent checkbox")
      return
    }

    setIsSubmitting(true)

    try {
      // Save demo request to database
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, channel }),
      })

      if (!res.ok) {
        throw new Error("Failed to save")
      }

      // Redirect to Stripe Payment Link with prefilled email
      const stripeUrl = `${STRIPE_DEMO_LINK}?prefilled_email=${encodeURIComponent(email)}`
      window.location.href = stripeUrl

    } catch (error) {
      alert("Something went wrong. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Light Beams Background */}
      <div className="light-beams">
        <div className="beam beam-cyan"></div>
        <div className="beam beam-pink"></div>
        <div className="beam beam-blue"></div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold text-gray-900">Lead Agents Studio</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Try the <span className="gradient-text">Live Demo</span>
          </h1>
          <p className="text-gray-500">
            Experience the follow-up agent on your own phone
          </p>
          <p className="text-2xl font-bold gradient-text mt-2">$5 per demo</p>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anna"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@clinic.com"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
              />
              <p className="text-gray-400 text-xs mt-1">Include country code</p>
            </div>

            {/* Channel Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Demo Channel
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-cyan-400 transition-all">
                  <input
                    type="radio"
                    name="channel"
                    value="whatsapp"
                    checked={channel === "whatsapp"}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-4 h-4 text-cyan-500"
                  />
                  <span className="text-xl">💬</span>
                  <div>
                    <span className="font-medium text-gray-900">WhatsApp</span>
                    <span className="text-cyan-500 text-sm ml-2">(recommended)</span>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-cyan-400 transition-all">
                  <input
                    type="radio"
                    name="channel"
                    value="sms"
                    checked={channel === "sms"}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-4 h-4 text-cyan-500"
                  />
                  <span className="text-xl">📱</span>
                  <span className="font-medium text-gray-900">SMS</span>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-cyan-400 transition-all">
                  <input
                    type="radio"
                    name="channel"
                    value="call"
                    checked={channel === "call"}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-4 h-4 text-cyan-500"
                  />
                  <span className="text-xl">📞</span>
                  <div>
                    <span className="font-medium text-gray-900">Phone Call</span>
                    <span className="text-gray-400 text-sm ml-2">(60 seconds)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Consent */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-cyan-500 rounded"
                  required
                />
                <span className="text-sm text-gray-500">
                  I consent to receive demo messages and/or a demo call from Lead Agents Studio. 
                  Reply STOP to opt out. This is not medical advice.
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary btn-gradient w-full text-lg py-4 disabled:opacity-50"
            >
              {isSubmitting ? "Redirecting to payment..." : "Pay $5 & Start Demo →"}
            </button>
          </form>

          <p className="text-center text-gray-400 text-xs mt-4">
            Secure payment via Stripe. Demo starts after payment confirmation.
          </p>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <Link href="/" className="text-gray-400 text-sm hover:text-gray-600">
            ← Back to main site
          </Link>
        </div>
      </div>
    </div>
  )
}
