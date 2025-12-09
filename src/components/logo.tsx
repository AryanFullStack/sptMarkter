import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group ${className}`}>
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="font-display text-3xl font-bold tracking-tight text-charcoal transition-colors group-hover:text-gold">
            S
          </span>
          <span className="font-display text-3xl font-bold tracking-tight text-gold transition-colors group-hover:text-charcoal">
            M
          </span>
        </div>
        <div className="hidden md:block">
          <span className="font-display text-sm font-semibold tracking-wider text-charcoal-light">
            SPECTRUM MARKETERS
          </span>
        </div>
      </div>
    </Link>
  );
}
