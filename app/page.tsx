import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CalendarDays, Users, Clock, BarChart3, CheckCircle, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: CalendarDays,
    title: 'Smart Scheduling',
    description: "Intelligent availability engine prevents double-bookings and respects your team's working hours automatically.",
  },
  {
    icon: Users,
    title: 'Multi-Staff Support',
    description: 'Manage your entire team. Assign services, set individual availability, and track performance.',
  },
  {
    icon: Clock,
    title: 'Real-Time Availability',
    description: 'Customers see live available slots. No back-and-forth. Bookings are confirmed instantly.',
  },
  {
    icon: BarChart3,
    title: 'Business Analytics',
    description: 'Dashboard insights on bookings, revenue, popular services, and staff utilization.',
  },
]

const businessTypes = ['Hair Salons', 'Barbershops', 'Clinics', 'Doctors', 'Consultants', 'Spas', 'Trainers', 'Dentists']

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">BookFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#businesses" className="hover:text-foreground transition-colors">Who it&apos;s for</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="max-w-3xl w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted text-xs text-muted-foreground mb-6 sm:mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Production-ready SaaS booking platform
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground mb-5 sm:mb-6 leading-tight">
            Appointment booking
            <br />
            <span className="text-muted-foreground">built for your business</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
            A professional scheduling platform for service businesses. Let customers book online, manage your team&apos;s availability, and never miss an appointment.
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <Button size="lg" asChild>
              <Link href="/register">
                Start for free <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/book/demo">See live demo</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6">No credit card required · Free to start</p>
        </div>
      </section>

      {/* Business types */}
      <section id="businesses" className="border-y border-border py-6 overflow-hidden bg-muted/30">
        <div className="flex gap-8 items-center justify-center flex-wrap px-6">
          {businessTypes.map(type => (
            <div key={type} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-foreground/40" />
              {type}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">Everything you need to run appointments</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From your first booking to managing a team of 50 — BookFlow scales with your business.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {features.map(feature => (
              <div key={feature.title} className="p-6 rounded-xl border border-border hover:border-foreground/20 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border bg-muted/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-semibold tracking-tight mb-4">Ready to streamline your bookings?</h2>
          <p className="text-muted-foreground mb-8">Join thousands of businesses using BookFlow to manage appointments.</p>
          <Button size="lg" asChild>
            <Link href="/register">Create your account <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center">
              <CalendarDays className="w-3 h-3 text-background" />
            </div>
            <span className="font-medium text-foreground">BookFlow</span>
          </div>
          <p>© 2026 BookFlow. Professional appointment scheduling.</p>
        </div>
      </footer>
    </div>
  )
}
