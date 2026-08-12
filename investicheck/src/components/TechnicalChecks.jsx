import { AlertCircle, CalendarClock, Check, Globe, Loader2, Lock, Server } from 'lucide-react'
import './TechnicalChecks.css'

// Live view of the automated checks that run against the platform's website.
//
// Each check reports independently. A check that could not complete is shown
// as "couldn't check" rather than being hidden or, worse, shown as a pass —
// an unreachable registry says nothing about the platform, and pretending
// otherwise would put a false signal in front of the user.

const CHECKS = [
  {
    key: 'availability',
    icon: Globe,
    title: 'Website reachable',
    summarise: (data) =>
      data.reachable
        ? `Responded with status ${data.statusCode}`
        : 'The website did not respond',
    isConcerning: (data) => !data.reachable,
  },
  {
    key: 'domain_registration',
    icon: CalendarClock,
    title: 'Domain age',
    summarise: (data) => {
      if (data.ageDays === null || data.ageDays === undefined) return 'Registration date unavailable'
      const years = Math.floor(data.ageDays / 365)
      const months = Math.floor((data.ageDays % 365) / 30)
      const age = years > 0 ? `${years} year${years === 1 ? '' : 's'}` : `${months} month${months === 1 ? '' : 's'}`
      return `Registered ${age} ago${data.registrar ? ` via ${data.registrar}` : ''}`
    },
    isConcerning: (data) => data.ageDays !== null && data.ageDays < 180,
  },
  {
    key: 'tls',
    icon: Lock,
    title: 'Secure connection',
    summarise: (data) => {
      if (!data.httpsAvailable) return 'No HTTPS certificate found'
      if (!data.certValid) return 'Certificate present but not valid'
      return `Valid certificate${data.issuer ? ` from ${data.issuer}` : ''}`
    },
    isConcerning: (data) => !data.httpsAvailable || !data.certValid,
  },
  {
    key: 'dns',
    icon: Server,
    title: 'Domain records',
    summarise: (data) => {
      if (!data.resolves) return 'The domain does not resolve'
      const parts = [`${data.nameserverCount} nameserver${data.nameserverCount === 1 ? '' : 's'}`]
      parts.push(data.hasMx ? 'email configured' : 'no email configured')
      return parts.join(', ')
    },
    isConcerning: (data) => !data.resolves || !data.hasMx,
  },
]

function CheckRow({ check, result, isRunning }) {
  const Icon = check.icon

  if (isRunning) {
    return (
      <li className="technical-check technical-check--running">
        <span className="technical-check__icon">
          <Loader2 size={16} className="technical-check__spinner" />
        </span>
        <div>
          <p className="technical-check__title">{check.title}</p>
          <p className="technical-check__detail">Checking…</p>
        </div>
      </li>
    )
  }

  const completed = result?.status === 'ok' && result.data
  const concerning = completed && check.isConcerning(result.data)
  const state = !completed ? 'unavailable' : concerning ? 'concerning' : 'clear'

  return (
    <li className={`technical-check technical-check--${state}`}>
      <span className="technical-check__icon">
        {state === 'clear' && <Check size={16} strokeWidth={3} />}
        {state === 'concerning' && <Icon size={16} />}
        {state === 'unavailable' && <AlertCircle size={16} />}
      </span>
      <div>
        <p className="technical-check__title">{check.title}</p>
        <p className="technical-check__detail">
          {completed ? check.summarise(result.data) : "Could not be checked. This lowers confidence, not the score"}
        </p>
      </div>
    </li>
  )
}

function TechnicalChecks({ osint, isRunning, error }) {
  return (
    <section className="technical-checks">
      <h2 className="technical-checks__heading">Automated checks</h2>

      {error ? (
        <p className="technical-checks__error">{error}</p>
      ) : (
        <ul className="technical-checks__list">
          {CHECKS.map((check) => (
            <CheckRow
              key={check.key}
              check={check}
              result={osint?.[check.key]}
              isRunning={isRunning}
            />
          ))}
        </ul>
      )}

      {osint?.tls?.data?.certValid && (
        <p className="technical-checks__caveat">
          A valid certificate only means traffic to the site is encrypted. It does not verify who
          runs the site, and it is not a sign the platform is legitimate.
        </p>
      )}
    </section>
  )
}

export default TechnicalChecks
