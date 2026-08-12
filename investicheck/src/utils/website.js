// Client-side website address handling.
//
// The server performs the authoritative check — it has to, since anything the
// browser decides can be bypassed. This exists purely to give immediate
// feedback while typing, and to accept the address in the form people
// actually write it.

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i
const HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i

/**
 * Most people type "example.com", not "https://example.com". Rejecting that
 * would fail the very users this product exists for, so a missing scheme is
 * filled in rather than treated as an error.
 *
 * A scheme that is already present is left alone — prepending blindly would
 * turn "javascript:alert(1)" into something that looks like a valid address.
 */
export const withScheme = (input) => {
  const trimmed = String(input ?? '').trim()
  if (!trimmed) return ''
  return SCHEME_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`
}

/**
 * @returns {string | null} an error message, or null when the address looks usable
 */
export const validateWebsite = (input) => {
  const trimmed = String(input ?? '').trim()
  if (!trimmed) return 'Enter the platform website address.'

  let url
  try {
    url = new URL(withScheme(trimmed))
  } catch {
    return 'That does not look like a website address. Try something like example.com'
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'Only web addresses starting with http:// or https:// can be checked.'
  }

  // A single label such as "localhost" or a bare word is almost always a typo
  // in this context, and the server would refuse it anyway.
  if (!HOSTNAME_PATTERN.test(url.hostname)) {
    return 'Enter a full website address, for example example.com'
  }

  return null
}

/** Display form of a website: no scheme, no trailing slash. */
export const displayWebsite = (value) =>
  String(value ?? '')
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
