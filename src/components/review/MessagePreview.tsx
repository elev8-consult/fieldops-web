import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import type { WhatsappMessage } from '@/types';

export interface MessagePreviewProps {
  bodyRaw: string | null;
  messageType?: string;
  receivedAt?: string;
}

export function MessagePreview({
  bodyRaw,
  messageType = 'text',
  receivedAt,
}: MessagePreviewProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge status={messageType} />
        {receivedAt && (
          <span className="text-xs text-slate-500">
            {formatDateTime(receivedAt)}
          </span>
        )}
      </div>
      <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-mono text-sm text-slate-700">
        {bodyRaw ?? '—'}
      </pre>
    </div>
  );
}

export function MessagePreviewFromEntity({ msg }: { msg: WhatsappMessage }) {
  return (
    <MessagePreview
      bodyRaw={msg.bodyRaw}
      messageType={String(msg.messageType)}
      receivedAt={msg.receivedAt}
    />
  );
}
