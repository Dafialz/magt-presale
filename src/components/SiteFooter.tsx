import { Card } from "./Card";

export function SiteFooter() {
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="text-xs text-zinc-500">
          © {new Date().getFullYear()} MAGIC TIME
          <div className="mt-2">
            Disclaimer: Crypto is risky. Do your own research.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <a className="text-zinc-300 hover:text-white" href="#" target="_blank" rel="noreferrer">
            Telegram
          </a>
          <a className="text-zinc-300 hover:text-white" href="#" target="_blank" rel="noreferrer">
            Twitter (X)
          </a>
          <a className="text-zinc-300 hover:text-white" href="#" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="text-zinc-300 hover:text-white" href="#" target="_blank" rel="noreferrer">
            Docs / Whitepaper
          </a>
          <a className="text-zinc-300 hover:text-white" href="#" target="_blank" rel="noreferrer">
            Terms
          </a>
          <a className="text-zinc-300 hover:text-white" href="#" target="_blank" rel="noreferrer">
            Disclaimer
          </a>
        </div>
      </div>
    </Card>
  );
}
