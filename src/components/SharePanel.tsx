import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { shareUrl, type Routine } from '@/lib/supabase';
import { logEvent } from '@/lib/events';

type SharePanelProps = {
  routine: Routine;
  onToggleSharing: (enabled: boolean) => Promise<void>;
  onResetLink: () => Promise<void>;
};

export const SharePanel = ({ routine, onToggleSharing, onResetLink }: SharePanelProps) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const url = shareUrl(routine.share_id);

  const copy = async () => {
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share({ title: routine.title, text: `Practice track: ${routine.title}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Link copied — send it to your team.');
      }
      logEvent('share_link_copied', routine.id);
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Share with your team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Anyone with the link can practice. Your edits show up for them automatically.
          </p>
        </div>
        <Switch checked={routine.sharing_enabled} onCheckedChange={onToggleSharing} aria-label="Sharing enabled" />
      </div>

      {routine.sharing_enabled ? (
        <>
          <div className="mt-4 flex gap-2">
            <Input readOnly value={url} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button onClick={copy} className="shrink-0">
              {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Share'}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowQr((v) => !v)}>
              {showQr ? 'Hide QR code' : 'Show QR code'}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={url} target="_blank" rel="noreferrer"><ExternalLink /> Preview as dancer</a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Create a new link? The old link will stop working.')) onResetLink();
              }}
            >
              <RefreshCw /> New link
            </Button>
          </div>
          {showQr && (
            <div className="mt-4 flex justify-center rounded-xl bg-white p-4">
              <QRCodeSVG value={url} size={220} />
            </div>
          )}
        </>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Sharing is off. The link won't work until you turn it back on.</p>
      )}
    </section>
  );
};
