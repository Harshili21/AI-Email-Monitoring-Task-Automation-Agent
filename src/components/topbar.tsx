import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Search, Moon, Sun, LogOut, User as UserIcon } from "lucide-react";
import { useTheme } from "@/contexts/theme";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "@tanstack/react-router";
import { mockNotifications } from "@/services/mockData";
import { useQuery } from "@tanstack/react-query";
import { listEmails } from "@/services/emailService";
import { StatusBadge, DepartmentBadge } from "@/components/badges";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from "@/components/ui/command";

export function Topbar() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const unread = mockNotifications.filter(n => !n.read).length;

  const [open, setOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: emailData } = useQuery({
    queryKey: ["all-emails-search"],
    queryFn: () => listEmails({ data: { pageSize: 100 } }),
  });

  const emails = emailData?.items ?? [];
  const top10Emails = emails.slice(0, 10);

  const filteredEmails = searchVal.trim() === ""
    ? top10Emails
    : emails.filter(e =>
        e.subject.toLowerCase().includes(searchVal.toLowerCase()) ||
        e.sender.toLowerCase().includes(searchVal.toLowerCase()) ||
        e.senderEmail.toLowerCase().includes(searchVal.toLowerCase()) ||
        e.department.toLowerCase().includes(searchVal.toLowerCase())
      );

  return (
    <header role="banner" className="topbar sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      
      <div className="flex-1 md:max-w-md">
        <button
          onClick={() => setOpen(true)}
          className="relative flex h-9 w-full items-center justify-between rounded-lg border border-input bg-muted/40 px-3 text-sm text-muted-foreground transition-all hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Search emails and tasks"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4 shrink-0 opacity-70" />
            <span>Search emails...</span>
          </span>
          <kbd className="pointer-events-none hidden items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-flex">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type sender, subject, or department to search..."
          value={searchVal}
          onValueChange={setSearchVal}
        />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading={searchVal.trim() === "" ? "Recent Emails" : "Search Results"}>
            {filteredEmails.map((email) => (
              <CommandItem
                key={email.id}
                value={`${email.sender} ${email.subject} ${email.department}`}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: "/emails/$id", params: { id: email.id } });
                }}
                className="flex items-center justify-between gap-4 p-2 cursor-pointer transition-colors duration-150 hover:bg-accent rounded-md"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{email.sender}</span>
                    <span className="text-xs text-muted-foreground truncate">{email.senderEmail}</span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate mt-0.5">{email.subject}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <DepartmentBadge department={email.department} />
                  <StatusBadge status={email.status} />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {unread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b p-3">
              <p className="text-sm font-semibold">Notifications</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {mockNotifications.map(n => (
                <div key={n.id} className="border-b p-3 text-sm last:border-0 hover:bg-muted/50">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.description}</p>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm">{user?.name ?? "User"}</span>
                <span className="text-xs text-muted-foreground">{user?.email ?? ""}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              <UserIcon className="mr-2 h-4 w-4" /> Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/login" }); }}>
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
