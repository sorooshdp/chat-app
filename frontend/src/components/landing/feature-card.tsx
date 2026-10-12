import { Check, LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  iconClassName: string;
  iconBackgroundClassName: string;
  hoverBorderClassName: string;
  title: string;
  description?: string;
  benefits: string[];
};

export function FeatureCard({
  icon: Icon,
  iconClassName,
  iconBackgroundClassName,
  hoverBorderClassName,
  title,
  description,
  benefits,
}: FeatureCardProps) {
  return (
    <article
      className={`group rounded-xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm transition-colors ${hoverBorderClassName}`}
    >
      <div
        className={`mb-6 flex h-14 w-14 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${iconBackgroundClassName}`}
      >
        <Icon className={`h-7 w-7 ${iconClassName}`} />
      </div>
      <h3 className="mb-3 text-2xl font-bold">{title}</h3>
      {description && <p className="mb-4 text-slate-400">{description}</p>}
      <ul className="space-y-2">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-start">
            <Check className="mr-2 mt-0.5 h-4 w-4 text-green-500" />
            <span className="text-slate-300">{benefit}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
