import { Heart, LucideIcon } from "lucide-react";

type Story = {
  icon: LucideIcon;
  iconClassName: string;
  iconBackgroundClassName: string;
  title: string;
  description: string;
};

type TeamMember = {
  initial: string;
  avatarClassName: string;
  name: string;
  role: string;
  quote: string;
  previous: string;
};

type AboutSectionProps = {
  stories: Story[];
  team: TeamMember[];
};

export function AboutSection({ stories, team }: AboutSectionProps) {
  return (
    <section id="about" className="px-1 py-24 text-amber-50">
      <div className="container mx-auto px-4">
        <div className="mb-16 flex flex-col items-center gap-4">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20">
            <Heart className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="mb-4 text-center text-4xl font-bold">The Weird Humans Behind This</h2>
          <p className="mb-4 max-w-2xl text-center text-slate-500">
            We&apos;re not a faceless corporation. We&apos;re not a corporation at all.
          </p>
        </div>
      </div>

      <div className="mx-auto mb-16 max-w-4xl rounded-xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
        <div className="space-y-8">
          {stories.map(({ icon: Icon, iconClassName, iconBackgroundClassName, title, description }) => (
            <div key={title} className="flex items-start gap-4">
              <div
                className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBackgroundClassName}`}
              >
                <Icon className={`h-6 w-6 ${iconClassName}`} />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
                <p className="text-justify text-slate-400">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 backdrop-blur-sm md:grid-cols-3">
        {team.map(({ initial, avatarClassName, name, role, quote, previous }) => (
          <article
            key={name}
            className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition-colors hover:border-blue-500/50"
          >
            <div className="mb-4 flex flex-col">
              <div className="mb-4 flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${avatarClassName}`}>
                  {initial}
                </div>
                <div>
                  <h4 className="font-bold text-white">{name}</h4>
                  <p className="text-xs text-slate-400">{role}</p>
                </div>
              </div>
              <p className="italic text-slate-300">&quot;{quote}&quot;</p>
            </div>
            <div className="mt-auto border-t border-slate-400 pt-4">
              <p className="text-xs text-slate-400">Previously: {previous}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
