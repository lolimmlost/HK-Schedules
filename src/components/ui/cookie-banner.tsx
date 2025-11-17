import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert' // Assuming alert.tsx exists; if not, use div with classes

interface CookieConsent {
  analytics: boolean
}

export function CookieBanner() {
  const [isVisible, setIsVisible] = React.useState(false)
  const [, setConsent] = React.useState<CookieConsent | null>(null)

  React.useEffect(() => {
    const savedConsent = localStorage.getItem('cookieConsent')
    if (savedConsent) {
      const parsed = JSON.parse(savedConsent) as CookieConsent
      setConsent(parsed)
      // Disable analytics cookies if rejected (future integration)
      if (!parsed.analytics) {
        // Placeholder for disabling third-party trackers
        console.log('Analytics disabled per user preference')
      }
    } else {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    const newConsent: CookieConsent = { analytics: true }
    localStorage.setItem('cookieConsent', JSON.stringify(newConsent))
    setConsent(newConsent)
    setIsVisible(false)
    // Enable analytics if integrated
    // gtag('consent', 'update', { 'analytics_storage': 'granted' });
  }

  const handleReject = () => {
    const newConsent: CookieConsent = { analytics: false }
    localStorage.setItem('cookieConsent', JSON.stringify(newConsent))
    setConsent(newConsent)
    setIsVisible(false)
    // Disable analytics (future integration)
    console.log('Analytics disabled per user preference')
  }

  const handleSettings = () => {
    // For advanced: Could open a modal with granular options, but keep simple for now
    alert(
      'Essential cookies are always enabled. Analytics: Optional. For more details, see our Privacy Policy.'
    )
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg md:max-w-2xl md:mx-auto md:rounded-t-lg md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:right-auto">
      <Alert className="border-0 p-4 mx-4 mb-0 md:mx-0">
        <AlertDescription className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-foreground">
            <p>
              We use cookies to enhance your experience and analyze usage. Essential cookies are
              always enabled. For details, see our{' '}
              <a
                href="/docs/privacy-disclaimer.md"
                className="underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSettings}
              className="px-3 py-1 text-xs"
            >
              Settings
            </Button>
            <Button size="sm" onClick={handleAccept} className="px-4 py-1">
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReject}
              className="px-4 py-1 text-xs border border-border"
            >
              Reject Non-Essential
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
