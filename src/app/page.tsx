const features = [
  {
    title: "No Equipment Needed",
    description: "Just phones and an internet connection. Works offline too.",
  },
  {
    title: "Instant Setup",
    description:
      "Create a race, share QR codes with volunteers, and start timing.",
  },
  {
    title: "Live Results",
    description: "Riders and spectators see results as they happen.",
  },
];

const steps = [
  "Create your race and add stages",
  "Share timer links with volunteers",
  "Volunteers tap to capture times",
  "Results appear automatically",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Race Timing{" "}
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            Made Simple
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">
          Two volunteers, two phones, zero special equipment. Time your
          grassroots mountain bike race in minutes.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
          <a
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-8 text-base font-semibold transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            Get Started
          </a>
          <a
            href="#features"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-700 px-8 text-base font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-800 bg-slate-900 p-8"
              >
                <h3 className="mb-3 text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-7">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            How It Works
          </h2>
          <ol className="space-y-8">
            {steps.map((step, index) => (
              <li key={step} className="flex items-start gap-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="pt-1.5 text-lg text-slate-300">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-10 text-center text-slate-500">
        <p>
          OpenRace &mdash; Open source race timing &middot;{" "}
          <a
            href="https://github.com/JeffBrines/OpenRace"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 transition-colors hover:text-slate-300"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
