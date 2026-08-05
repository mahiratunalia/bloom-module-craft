import { Link } from "@tanstack/react-router";

const nav = [
  { to: "/", label: "Search" },
  { to: "/landlord", label: "Landlord desk" },
  { to: "/roommates", label: "Roommates" },
  { to: "/agreement", label: "Agreement" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl leading-none">BasaKhuji</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            Module 1
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "border-foreground text-foreground" }}
              inactiveProps={{ className: "border-transparent text-muted-foreground hover:text-foreground" }}
              className="border-b-2 px-2 py-1 text-[13px] transition-colors sm:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>BasaKhuji — evidence-first rental ecosystem. Module 1: before &amp; during application.</p>
        <p className="font-mono">CSE471 · Group 03</p>
      </div>
    </footer>
  );
}