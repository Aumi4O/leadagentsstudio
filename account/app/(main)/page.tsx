import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function HomePage() {
  const session = await auth()
  
  // If logged in, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  // Otherwise show a simple landing
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Light Beams Background */}
      <div className="light-beams">
        <div className="beam beam-cyan"></div>
        <div className="beam beam-pink"></div>
        <div className="beam beam-blue"></div>
      </div>

      <div className="relative z-10 text-center px-4">
        <div className="mb-8">
          <span className="text-6xl">⚡</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          <span className="gradient-text">Lead Agents Studio</span>
        </h1>
        
        <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
          Your AI-powered follow-up agent for clinics
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary btn-gradient">
            Create Account
          </Link>
        </div>

        <p className="text-gray-400 text-sm mt-8">
          <Link href="/" className="hover:text-gray-600 underline">
            ← Back to main site
          </Link>
        </p>
      </div>
    </div>
  )
}
