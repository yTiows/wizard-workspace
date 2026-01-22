import { FormEvent, useMemo, useState } from 'react';
import { useFilesystemStore } from '@/stores/filesystemStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/sonner';

type SecurityLevel = 'standard' | 'safer' | 'safest';

type WizPage = {
  url: string;
  title: string;
  html: string;
  downloads?: { name: string; content: string; targetPath: string }[];
};

const DEFAULT_URL = 'home.wiz';

// Tor-like, but fully simulated and mission-controlled.
// Pages are local content; no real network access.
const PAGES: WizPage[] = [
  {
    url: 'home.wiz',
    title: 'Wizard Browser — Start',
    html: `
      <div class="space-y-4">
        <div class="text-sm text-muted-foreground">This is a controlled browser simulator. Pages and resources are provided by Wizard missions.</div>
        <div class="rounded-lg border border-border bg-background/40 p-4">
          <div class="text-xs text-muted-foreground mb-2">Quick links</div>
          <ul class="list-disc pl-5 space-y-1 text-sm">
            <li><a class="wiz-link" href="docs.wiz">docs.wiz</a> — internal docs (simulated)</li>
            <li><a class="wiz-link" href="relay.wiz">relay.wiz</a> — circuit view & identity tools</li>
            <li><a class="wiz-link" href="sandbox.wiz">sandbox.wiz</a> — form + headers playground</li>
          </ul>
        </div>
        <div class="rounded-lg border border-border bg-background/40 p-4">
          <div class="text-xs text-muted-foreground mb-2">Downloads</div>
          <div class="text-sm">Some internal pages can offer mission files. Downloads are written to your filesystem.</div>
        </div>
      </div>
    `,
  },
  {
    url: 'docs.wiz',
    title: 'Wizard Browser — Docs',
    html: `
      <div class="space-y-4">
        <div class="text-lg font-semibold">Internal Browser Manual</div>
        <div class="text-sm text-muted-foreground">Wizard Browser is a simulator designed for controlled lessons (web basics, headers, forms, client-side artifacts). It does not access the real internet unless a mission explicitly enables it.</div>

        <div class="rounded-lg border border-border bg-background/40 p-4">
          <div class="text-sm font-medium mb-2">Supported features</div>
          <ul class="list-disc pl-5 space-y-1 text-sm">
            <li>Navigation between <span class="font-mono">*.wiz</span> pages</li>
            <li>View Source (simulated)</li>
            <li>Console logs (simulated)</li>
            <li>Downloads to <span class="font-mono">/home/user/downloads</span></li>
            <li>Security level toggle (affects scripts/media)</li>
          </ul>
        </div>

        <div class="rounded-lg border border-border bg-background/40 p-4">
          <div class="text-sm font-medium mb-2">Navigation</div>
          <div class="text-sm">Use the address bar to open internal sites like <span class="font-mono">home.wiz</span>. Links are constrained to internal content.</div>
        </div>
      </div>
    `,
  },
  {
    url: 'relay.wiz',
    title: 'Wizard Browser — Circuit',
    html: `
      <div class="space-y-4">
        <div class="text-lg font-semibold">Circuit & Identity</div>
        <div class="text-sm text-muted-foreground">Simulated relays. Changing identity resets local browser state (history + console). This is for lessons about anonymity models and browser isolation.</div>
        <div class="rounded-lg border border-border bg-background/40 p-4">
          <div class="text-sm font-medium mb-2">Simulated route</div>
          <div class="font-mono text-sm">ENTRY → MIDDLE → EXIT</div>
          <div class="mt-2 grid grid-cols-1 gap-2 text-sm">
            <div class="rounded border border-border p-2 bg-background/30">ENTRY: <span class="font-mono">raven-07</span> (lat 42ms)</div>
            <div class="rounded border border-border p-2 bg-background/30">MIDDLE: <span class="font-mono">obsidian-14</span> (lat 65ms)</div>
            <div class="rounded border border-border p-2 bg-background/30">EXIT: <span class="font-mono">veil-03</span> (lat 58ms)</div>
          </div>
        </div>
        <div class="rounded-lg border border-border bg-background/40 p-4">
          <div class="text-sm font-medium mb-2">Notes</div>
          <div class="text-sm">This is a mimic interface. Missions can override circuit values, inject page artifacts, and require specific observations.</div>
        </div>
      </div>
    `,
  },
  {
    url: 'sandbox.wiz',
    title: 'Wizard Browser — Sandbox',
    downloads: [
      {
        name: 'headers.txt',
        content: `# Simulated request headers
User-Agent: WizardBrowser/1.0
Accept: text/html
X-WIZ-Trace: 7f3a91c2
`,
        targetPath: '/home/user/downloads',
      },
    ],
    html: `
      <div class="space-y-4">
        <div class="text-lg font-semibold">Headers & Forms Playground</div>
        <div class="text-sm text-muted-foreground">This page exists for controlled web lessons. It can simulate request metadata, cookies, and form submissions.</div>

        <div class="rounded-lg border border-border bg-background/40 p-4">
          <div class="text-sm font-medium mb-2">Simulated request</div>
          <pre class="text-xs whitespace-pre-wrap font-mono">GET /sandbox HTTP/1.1
Host: sandbox.wiz
User-Agent: WizardBrowser/1.0
Accept: text/html
X-WIZ-Trace: 7f3a91c2</pre>
        </div>

        <div class="rounded-lg border border-border bg-background/40 p-4">
          <div class="text-sm font-medium mb-2">Try a form</div>
          <div class="text-sm">(Simulated) Submitting will write a file into your downloads folder.</div>
          <form class="wiz-form mt-3 space-y-2">
            <input class="wiz-input" name="q" placeholder="search" />
            <button class="wiz-button" type="submit">submit</button>
          </form>
        </div>
      </div>
    `,
  },
];

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_URL;
  // Only allow internal *.wiz for now.
  const lower = trimmed.toLowerCase();
  if (lower.endsWith('.wiz')) return lower;
  // Allow user to omit suffix.
  if (!lower.includes('.') && /^[a-z0-9-]+$/.test(lower)) return `${lower}.wiz`;
  return lower;
}

export const BrowserApp = () => {
  const { createFile } = useFilesystemStore();

  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>('standard');
  const [address, setAddress] = useState(DEFAULT_URL);
  const [history, setHistory] = useState<string[]>([DEFAULT_URL]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showSource, setShowSource] = useState(false);
  const [consoleLines, setConsoleLines] = useState<string[]>([
    '[wizard] browser initialized',
    '[wizard] network disabled (simulated)',
  ]);

  const pagesByUrl = useMemo(() => {
    const map = new Map<string, WizPage>();
    PAGES.forEach(p => map.set(p.url, p));
    return map;
  }, []);

  const currentUrl = history[historyIndex] ?? DEFAULT_URL;
  const currentPage = pagesByUrl.get(currentUrl);

  const writeDownload = (name: string, content: string, folderPath: string) => {
    const file = createFile(name, folderPath, content);
    if (!file) {
      // If file exists, append a suffix.
      const base = name.replace(/(\.[^.]*)?$/, '');
      const extMatch = name.match(/\.[^.]+$/);
      const ext = extMatch ? extMatch[0] : '';
      const fallback = `${base}-${Date.now()}${ext}`;
      const file2 = createFile(fallback, folderPath, content);
      if (!file2) {
        toast.error('Download failed', { description: 'Could not write to downloads folder.' });
        return;
      }
      toast.success('Downloaded', { description: `Saved as ${fallback}` });
      return;
    }
    toast.success('Downloaded', { description: `Saved as ${name}` });
  };

  const navigate = (raw: string) => {
    const url = normalizeUrl(raw);
    if (!pagesByUrl.has(url)) {
      setConsoleLines(lines => [...lines, `[console] 404 for ${url}`]);
      toast('Not found', { description: 'This address does not exist in the controlled browser.' });
      return;
    }

    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(url);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setAddress(url);
    setShowSource(false);

    setConsoleLines(lines => [...lines, `[nav] ${url}`]);
  };

  const goBack = () => {
    if (historyIndex <= 0) return;
    setHistoryIndex(i => i - 1);
    const next = history[historyIndex - 1];
    setAddress(next);
    setShowSource(false);
  };

  const goForward = () => {
    if (historyIndex >= history.length - 1) return;
    setHistoryIndex(i => i + 1);
    const next = history[historyIndex + 1];
    setAddress(next);
    setShowSource(false);
  };

  const reload = () => {
    setConsoleLines(lines => [...lines, `[nav] reload ${currentUrl}`]);
  };

  const newIdentity = () => {
    setHistory([DEFAULT_URL]);
    setHistoryIndex(0);
    setAddress(DEFAULT_URL);
    setShowSource(false);
    setConsoleLines([
      '[wizard] identity rotated',
      '[wizard] local state cleared',
      '[wizard] network disabled (simulated)',
    ]);
    toast('New Identity', { description: 'Local browser state reset.' });
  };

  // Minimal simulated form submit: write a file into downloads.
  const handleFormSubmit = (e: FormEvent) => {
    const form = e.target as HTMLFormElement;
    if (!form.classList.contains('wiz-form')) return;
    e.preventDefault();
    const fd = new FormData(form);
    const q = String(fd.get('q') ?? '').trim();
    const payload = `# Simulated form submission
page: ${currentUrl}
q: ${q}
trace: 7f3a91c2
`;
    writeDownload('form-submit.txt', payload, '/home/user/downloads');
    setConsoleLines(lines => [...lines, `[form] submit q=${q || '(empty)'}`]);
  };

  const injectLinkHandlingScript = (html: string) => {
    // We don't execute scripts; we intercept link clicks and form submit via container handlers.
    // Links are rendered as buttons for controlled navigation.
    return html;
  };

  const renderPage = () => {
    if (!currentPage) {
      return (
        <div className="p-4 text-sm text-foreground-muted">This address is unavailable.</div>
      );
    }

    if (showSource) {
      const src = currentPage.html
        .replace(/\s+/g, ' ')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return (
        <ScrollArea className="h-full">
          <pre className="p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground">
            {`<!-- ${currentPage.title} -->\n${src}`}
          </pre>
        </ScrollArea>
      );
    }

    // Render controlled HTML-ish content using dangerouslySetInnerHTML.
    // We keep it constrained with styling and event interception.
    return (
      <ScrollArea className="h-full">
        <div
          className="p-4 space-y-3 text-foreground"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target?.classList?.contains('wiz-link')) {
              e.preventDefault();
              const href = (target as HTMLAnchorElement).getAttribute('href') || '';
              navigate(href);
            }
          }}
          onSubmit={handleFormSubmit as any}
          dangerouslySetInnerHTML={{ __html: injectLinkHandlingScript(currentPage.html) }}
        />
      </ScrollArea>
    );
  };

  const securityBadge = (level: SecurityLevel) => {
    if (level === 'standard') return <Badge variant="secondary">Standard</Badge>;
    if (level === 'safer') return <Badge variant="outline">Safer</Badge>;
    return <Badge>Safest</Badge>;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="px-3 py-2 flex items-center gap-2 bg-background/60">
        <Button size="sm" variant="ghost" onClick={goBack} disabled={historyIndex <= 0}>
          ←
        </Button>
        <Button size="sm" variant="ghost" onClick={goForward} disabled={historyIndex >= history.length - 1}>
          →
        </Button>
        <Button size="sm" variant="ghost" onClick={reload}>
          ↻
        </Button>
        <Separator orientation="vertical" className="h-6" />

        <div className="flex-1 flex items-center gap-2">
          <div className="text-xs text-foreground-subtle">⟠</div>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(address);
            }}
            className="h-8 font-mono text-sm"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <Button size="sm" onClick={() => navigate(address)}>
            Go
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          {securityBadge(securityLevel)}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSecurityLevel((lvl) => {
                const next = lvl === 'standard' ? 'safer' : lvl === 'safer' ? 'safest' : 'standard';
                setConsoleLines(lines => [...lines, `[sec] ${lvl} → ${next}`]);
                return next;
              });
            }}
          >
            Security
          </Button>
          <Button size="sm" variant="ghost" onClick={newIdentity}>
            New Identity
          </Button>
        </div>
      </div>

      <Separator />

      {/* Content */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_320px] min-h-0">
        <div className="min-h-0">{renderPage()}</div>

        {/* Side panel (Tor-ish) */}
        <div className="border-l border-border bg-background/40 min-h-0">
          <div className="p-3 flex items-center justify-between">
            <div className="text-sm font-medium">Circuit</div>
            <Button size="sm" variant="outline" onClick={() => navigate('relay.wiz')}>View</Button>
          </div>
          <Separator />
          <div className="p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-foreground-subtle">Mode</span>
              <span className="font-mono">SIM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-subtle">DNS</span>
              <span className="font-mono">isolated</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-subtle">JS</span>
              <span className="font-mono">{securityLevel === 'standard' ? 'on' : 'off'}</span>
            </div>
          </div>
          <Separator />
          <div className="p-3">
            <div className="text-sm font-medium mb-2">Console</div>
            <ScrollArea className="h-[220px] rounded border border-border bg-background/30">
              <div className="p-2 space-y-1 text-xs font-mono">
                {consoleLines.slice(-80).map((l, idx) => (
                  <div key={idx} className="text-foreground">{l}</div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowSource(s => !s)}>
                {showSource ? 'Hide Source' : 'View Source'}
              </Button>
              {currentPage?.downloads?.length ? (
                <Button
                  size="sm"
                  onClick={() => {
                    currentPage.downloads!.forEach(d => writeDownload(d.name, d.content, d.targetPath));
                    setConsoleLines(lines => [...lines, `[dl] ${currentPage.downloads!.map(d => d.name).join(', ')}`]);
                  }}
                >
                  Download
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
