import { Check, LucideIcon, X } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

type PricingFeature = {
  label: string;
  included: boolean;
};

type PricingCardProps = {
  icon: LucideIcon;
  iconClassName: string;
  iconBackgroundClassName: string;
  borderClassName: string;
  name: string;
  price: string;
  interval: string;
  description: string;
  features: PricingFeature[];
  actionLabel: string;
};

export function PricingCard({
  icon: Icon,
  iconClassName,
  iconBackgroundClassName,
  borderClassName,
  name,
  price,
  interval,
  description,
  features,
  actionLabel,
}: PricingCardProps) {
  return (
    <article
      className={`flex flex-col items-center rounded-2xl border-2 bg-slate-900/50 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 ${borderClassName}`}
    >
      <div className="mb-4 flex flex-col items-center justify-center text-center">
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconBackgroundClassName}`}>
          <Icon className={`h-8 w-8 ${iconClassName}`} />
        </div>
        <h3 className="mb-2 text-xl font-bold text-amber-50">{name}</h3>
        <div className="mb-2 text-3xl font-bold text-amber-50">
          {price}
          <span className="text-lg font-normal text-slate-500">/{interval}</span>
        </div>
        <p className="text-slate-500">{description}</p>
      </div>

      <ul className="mb-8 space-y-4">
        {features.map(({ label, included }) => {
          const FeatureIcon = included ? Check : X;
          return (
            <li key={label} className="flex items-start">
              <FeatureIcon
                className={`mr-2 mt-0.5 h-5 w-5 shrink-0 ${included ? "text-green-500" : "text-red-500"}`}
              />
              <span className="text-slate-300">{label}</span>
            </li>
          );
        })}
      </ul>

      <Button className="mt-auto w-full border-slate-700 bg-blue-600 px-8 py-6 text-amber-50 hover:bg-blue-500">
        <Link href="/signup" className="flex items-center justify-center">
          {actionLabel}
        </Link>
      </Button>
    </article>
  );
}
