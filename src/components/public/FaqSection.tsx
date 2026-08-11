// Server component — no client JS. <details>/<summary> gives accordion
// behavior (keyboard + screen reader support) for free, so there is nothing
// here to hydrate.
//
// Answers are grounded in what the app actually does, not aspirational copy —
// e.g. no "free trial" question, because checkout charges immediately (see
// src/lib/actions/checkout.ts). Edit this array + redeploy to change copy;
// there is deliberately no CMS/table behind it yet.
const faqs: { question: string; answer: string }[] = [
  {
    question: "What plans do you offer?",
    answer:
      "Basic (₺49/mo) covers up to 50 listings and 2 agent seats. Pro (₺99/mo) covers up to 250 listings and 10 seats, plus lead generation tools. Enterprise (₺199/mo) has unlimited listings and seats, with a dedicated account manager.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes. Upgrade or downgrade at any time from your dashboard — the change takes effect on your next billing cycle.",
  },
  {
    question: "How do I add team members?",
    answer:
      "An admin sends an invite link from the Team Directory. No email is required on our end — the new member opens the link and sets a password to activate their account.",
  },
  {
    question: "Is my agency's data isolated from other agencies?",
    answer:
      "Yes. Every agency's properties, leads, and team data are isolated at the database level, not just hidden in the interface — another tenant's data is never reachable through the API, regardless of what the app's UI shows.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "Cards, through PayTabs' secure hosted payment page. Card details are entered on PayTabs and never touch our servers.",
  },
];

export default function FaqSection() {
  return (
    <section className="max-w-max-width-public mx-auto px-lg py-xl mb-xl">
      <div className="mb-lg">
        <h2 className="font-h2 text-h2 text-primary-navy font-bold tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="font-sm text-sm text-text-secondary mt-sm">
          Everything agencies ask before signing up.
        </p>
      </div>

      <div className="rounded-xl border border-border-gray divide-y divide-border-gray bg-surface-container-lowest overflow-hidden">
        {faqs.map((faq) => (
          <details key={faq.question} className="group p-lg">
            <summary className="flex items-center justify-between gap-md cursor-pointer list-none font-body text-body font-semibold text-primary-navy">
              <span>{faq.question}</span>
              <span className="material-symbols-outlined text-text-secondary shrink-0 transition-transform duration-200 group-open:rotate-180">
                expand_more
              </span>
            </summary>
            <p className="font-sm text-sm text-text-secondary mt-md leading-relaxed">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
