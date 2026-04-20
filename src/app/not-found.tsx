import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b0e14]">
      <div className="text-center slide-up">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-black text-zinc-500 font-[family-name:var(--font-geist-mono)]">
            ?
          </span>
        </div>
        <h1 className="text-5xl font-black text-white mb-2 font-[family-name:var(--font-geist-mono)]">
          404
        </h1>
        <p className="text-zinc-400 mb-8">Essa pagina nao existe.</p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
        >
          Voltar ao inicio
        </Link>
      </div>
    </div>
  );
}
