import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, TrendingUp, DollarSign, BookOpen } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  stats: {
    today: number
    thisWeek: number
    monthRevenue: number
    totalAllTime: number
  }
}

export function OverviewStats({ stats }: Props) {
  const cards = [
    {
      label: 'Today',
      value: stats.today.toString(),
      sub: 'appointments',
      icon: CalendarDays,
    },
    {
      label: 'This Week',
      value: stats.thisWeek.toString(),
      sub: 'appointments',
      icon: TrendingUp,
    },
    {
      label: 'Revenue MTD',
      value: formatCurrency(stats.monthRevenue),
      sub: 'this month',
      icon: DollarSign,
    },
    {
      label: 'All Time',
      value: stats.totalAllTime.toLocaleString(),
      sub: 'total bookings',
      icon: BookOpen,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <Card key={card.label} className="border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{card.label}</p>
                <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              </div>
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <card.icon className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
