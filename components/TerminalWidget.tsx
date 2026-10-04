
export default function TerminalWidget() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(() =>
    WELCOME.map((text) => ({ kind: "out" as const, text }))
  );
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl + / toggles the terminal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines, open]);

  const submit = () => {
    const raw = input;
    const result = execute(raw);
    if (raw.trim()) setHistory((h) => [...h, raw]);
    setHIdx(-1);
    setInput("");
    if (result === "clear") {
      setLines([]);
      return;
    }
    setLines((l) => [
      ...l,
      { kind: "in" as const, text: raw },
      ...result.map((text) => ({ kind: "out" as const, text })),
    ]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = hIdx === -1 ? history.length - 1 : Math.max(hIdx - 1, 0);
      setHIdx(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx === -1) return;
      const i = hIdx + 1;
      if (i >= history.length) {
        setHIdx(-1);
        setInput("");
      } else {
        setHIdx(i);
        setInput(history[i]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = COMMANDS.find((c) => input && c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle terminal"
        className="fixed bottom-6 right-6 z-[65] flex h-12 w-12 items-center justify-center rounded-full border border-green-400/50 bg-black/80 font-mono text-green-300 shadow-[0_0_20px_rgba(0,255,156,0.3)] backdrop-blur transition hover:scale-110 hover:bg-green-400 hover:text-black"
      >
        {open ? "×" : ">_"}
      </button>

      {open && (
        <div
          onClick={() => inputRef.current?.focus()}
          className="fixed bottom-24 right-6 z-[65] flex h-[380px] w-[min(92vw,540px)] flex-col overflow-hidden rounded-xl border border-green-400/30 bg-black/90 font-mono text-sm shadow-[0_0_60px_rgba(0,255,156,0.15)] backdrop-blur-md"
        >
          <div className="flex items-center gap-2 border-b border-green-400/20 px-4 py-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
            <span className="ml-2 text-cyan-300/80">
              {NAME.toLowerCase().replace(/\s+/g, "")}@sec: ~
            </span>
            <span className="ml-auto text-slate-500">Ctrl + / to toggle</span>
          </div>

          <div ref={bodyRef} className="flex-1 space-y-1 overflow-y-auto p-4">
            {lines.map((l, i) => (
              <div key={i} className={l.kind === "in" ? "text-white" : "text-green-300"}>
                {l.kind === "in" && <span className="text-green-500">$ </span>}
                <span className="whitespace-pre-wrap break-words">{l.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-green-400/20 px-4 py-3">
            <span className="text-green-500">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoComplete="off"
              placeholder="type a command..."
              className="w-full bg-transparent text-white placeholder:text-slate-600 focus:outline-none"
            />
          </div>
        </div>
      )}
    </>
  );
}
