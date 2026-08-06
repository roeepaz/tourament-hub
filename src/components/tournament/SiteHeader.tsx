import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Home, ListOrdered, Shield, Ticket, Trophy, UserRound, LogOut, Users, Goal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NameDialog } from "./NameDialog";
import { useUserName } from "@/hooks/use-user-name";

const NAV = [
  { to: "/", label: "בית", icon: Home },
  { to: "/schedule", label: "לוח משחקים", icon: CalendarDays },
  { to: "/standings", label: "טבלאות", icon: ListOrdered },
  { to: "/predictions", label: "הניחושים שלי", icon: Ticket },
  { to: "/leaderboard", label: "טבלת מנחשים", icon: Trophy },
  { to: "/supporters", label: "אלופי העידוד", icon: Users },
  { to: "/top-scorers", label: "מלך השערים", icon: Goal },
] as const;

export function SiteHeader() {
  const { name, clearName } = useUserName();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Trophy className="h-5 w-5" />
          </span>
          <span className="truncate text-lg font-black tracking-tight">אליפות היחידה</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          {name ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
                <UserRound className="h-4 w-4" />
                <span className="max-w-24 truncate">{name}</span>
              </Button>
              <Button variant="ghost" size="icon" aria-label="התנתק" onClick={clearName}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
              <UserRound className="h-4 w-4" />
              <span>התחברות</span>
            </Button>
          )}
          <Button asChild variant="ghost" size="icon" aria-label="פאנל ניהול">
            <Link to="/admin">
              <Shield className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
      <nav className="mx-auto max-w-5xl overflow-x-auto px-2 pb-2">
        <ul className="flex min-w-max items-center gap-1">
          {NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-primary/15 data-[status=active]:text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <NameDialog open={open} onOpenChange={setOpen} />
    </header>
  );
}
