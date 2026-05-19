import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, QrCode, TrendingUp, Users, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Pexifly</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="mb-6 text-balance text-5xl font-bold tracking-tight text-gray-900 lg:text-6xl">
          QR-Powered Engagement<br />Platform for Modern Business
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-gray-600">
          Transform product demos, events, and customer interactions with intelligent QR codes, 
          real-time analytics, and automated engagement workflows.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/signin">
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-white p-6 ">
            <QrCode className="mb-4 h-10 w-10 text-blue-600" />
            <h3 className="mb-2 text-lg font-semibold">Smart QR Codes</h3>
            <p className="text-sm text-gray-600">Generate dynamic QR codes with tracking and analytics</p>
          </div>
          <div className="rounded-lg border bg-white p-6 ">
            <TrendingUp className="mb-4 h-10 w-10 text-purple-600" />
            <h3 className="mb-2 text-lg font-semibold">Real-Time Analytics</h3>
            <p className="text-sm text-gray-600">Track engagement and customer behavior instantly</p>
          </div>
          <div className="rounded-lg border bg-white p-6 ">
            <Users className="mb-4 h-10 w-10 text-blue-600" />
            <h3 className="mb-2 text-lg font-semibold">Lead Management</h3>
            <p className="text-sm text-gray-600">Capture and nurture leads automatically</p>
          </div>
          <div className="rounded-lg border bg-white p-6 ">
            <Zap className="mb-4 h-10 w-10 text-purple-600" />
            <h3 className="mb-2 text-lg font-semibold">Automation</h3>
            <p className="text-sm text-gray-600">Build workflows for engagement campaigns</p>
          </div>
        </div>
      </section>
    </div>
  )
}
