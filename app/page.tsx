import Scene from "@/components/Scene";

const NAME = "Umer Rali";
const TITLE = "Cybersecurity & DevOps";

export default function Home() {
  return (
    <main className="relative min-h-screen font-mono text-green-400">
      <Scene />
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm tracking-widest text-green-600">$ whoami</p>
        <h1 className="text-5xl font-bold md:text-7xl">{NAME}</h1>
        <p className="mt-4 text-xl text-green-300 md:text-2xl">{TITLE}</p>
        <div className="mt-10 flex gap-4">
          <a
            href="https://github.com/ua4157489-code"
            className="rounded border border-green-400 px-6 py-2 transition hover:bg-green-400 hover:text-black"
          >
            GitHub
          </a>
          <a
            href="#projects"
            className="rounded border border-green-400 px-6 py-2 transition hover:bg-green-400 hover:text-black"
          >
            Projects
          </a>
        </div>
      </section>
    </main>
  );
}
