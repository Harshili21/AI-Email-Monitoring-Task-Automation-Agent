import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/common";
import { getIntegrations, getMailboxes } from "@/services/settingsService";
import { CheckCircle2, XCircle, Mail as MailIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — MailPilot" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const integrations = useQuery({ queryKey: ["integrations"], queryFn: getIntegrations });
  const mailboxes = useQuery({ queryKey: ["mailboxes"], queryFn: getMailboxes });

  if (!integrations.data || !mailboxes.data) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage integrations, mailboxes, and system status"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Settings" }]}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.data.map(i => (
          <Card key={i.name} className="border-border/60 shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{i.name}</CardTitle>
                <div className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                  i.connected ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", i.connected ? "bg-success" : "bg-destructive")} />
                  {i.connected ? "Connected" : "Disconnected"}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{i.detail}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm">Configure</Button>
                <Button variant="ghost" size="sm">{i.connected ? "Test" : "Connect"}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-border/60 shadow-[var(--shadow-soft)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Monitored Mailboxes</CardTitle>
          <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" />Add mailbox</Button>
        </CardHeader>
        <CardContent className="divide-y">
          {mailboxes.data.map(m => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><MailIcon className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-medium">{m.email}</p>
                  <p className="text-xs text-muted-foreground">{m.active ? "Actively monitored" : "Paused"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {m.active ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                <Switch defaultChecked={m.active} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
