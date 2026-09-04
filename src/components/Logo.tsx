type LogoProps = {
  variant?: 'light' | 'dark'
  className?: string
}

/** Logo oficial da Pulsari: símbolo em gradiente + wordmark tipográfico. */
export function Logo({ variant = 'dark', className = '' }: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-ink'
  const dotColor = variant === 'light' ? 'text-white' : 'text-brand-violet'

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src="/images/logo-mark.png" alt="" className="h-6 sm:h-7 w-auto shrink-0" />
      <span className={`inline-flex items-baseline font-display font-bold tracking-tight text-xl sm:text-2xl ${textColor}`}>
        pulsari
        <span className={`ml-0.5 ${dotColor}`} aria-hidden="true">
          .
        </span>
      </span>
    </span>
  )
}
