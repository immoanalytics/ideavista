import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { Lightbulb, Network, Brain, Share2 } from "lucide-react";
import { GuestButton } from "@/components/auth/guest-button";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const cookieStore = await cookies();
  const isGuest = cookieStore.get("guest_mode")?.value === "true";
  if (isGuest) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Lightbulb className="h-6 w-6 text-primary" />
            IdeaVista
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Capture Ideas.<br />
            <span className="text-primary">Discover Connections.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            IdeaVista uses AI to organize your thoughts, find hidden relationships,
            and create beautiful visualizations of how your ideas connect.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Start for Free
            </Link>
            <GuestButton />
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">AI-Powered Organization</h3>
              <p className="text-sm text-muted-foreground">
                Auto-categorize ideas, reminders, trips, and tasks. AI understands your content and tags it intelligently.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <Network className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Visual Connections</h3>
              <p className="text-sm text-muted-foreground">
                See how your ideas relate through interactive network graphs, mind maps, and cluster views.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <Share2 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Share & Collaborate</h3>
              <p className="text-sm text-muted-foreground">
                Group ideas into collections and share them with friends, teammates, or collaborators.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>IdeaVista - Your ideas, beautifully connected.</p>
      </footer>
    </div>
  );
}
