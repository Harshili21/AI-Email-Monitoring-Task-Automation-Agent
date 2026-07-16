import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/common";
import { getIntegrations, getMailboxes, toggleMailbox, toggleIntegration } from "@/services/settingsService";
import { CheckCircle2, XCircle, Mail as MailIcon, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — MailPilot" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const integrations = useQuery({ queryKey: ["integrations"], queryFn: getIntegrations });
  const mailboxes = useQuery({ queryKey: ["mailboxes"], queryFn: getMailboxes });

  const mailboxMutation = useMutation({
    mutationFn: toggleMailbox,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailboxes"] });
      toast.success("Mailbox settings saved");
    },
  });

  const integrationMutation = useMutation({
    mutationFn: toggleIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration settings updated");
    },
  });

  if (!integrations.data || !mailboxes.data) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <PageHeader
        title="Settings & Integrations"
        description="Manage connected mailboxes and external system integrations."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.data.map(i => (
          <Card key={i.name} className="border-border/40 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-tight">{i.name}</CardTitle>
                <div className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
                  i.connected ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200")}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", i.connected ? "bg-emerald-500" : "bg-slate-400")} />
                  {i.connected ? "Connected" : "Disconnected"}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{i.detail}</p>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs font-medium border-border/60">Configure</Button>
                <Button 
                  variant={i.connected ? "ghost" : "default"} 
                  size="sm" 
                  className={cn("h-8 text-xs font-medium", !i.connected && "bg-slate-900 text-white")}
                  disabled={integrationMutation.isPending}
                  onClick={() => integrationMutation.mutate(i.name)}
                >
                  {i.connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 border-border/40 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/20 pb-4">
          <div>
            <CardTitle className="text-sm font-semibold tracking-tight">Monitored Mailboxes</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Mailboxes actively processed by MailPilot.</p>
          </div>
          <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 h-8 text-xs font-medium">
            <Plus className="mr-2 h-3.5 w-3.5" />Add Mailbox
          </Button>
        </CardHeader>
        <CardContent className="divide-y divide-border/40 p-0">
          {mailboxes.data.map(m => (
            <div key={m.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-700 shadow-sm border border-slate-200">
                  <MailIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{m.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.active ? "Actively monitored" : "Monitoring paused"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {m.active ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-slate-400" />}
                <Switch 
                  checked={m.active} 
                  onCheckedChange={() => mailboxMutation.mutate(m.id)}
                  disabled={mailboxMutation.isPending}
                  className="data-[state=checked]:bg-slate-900"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
