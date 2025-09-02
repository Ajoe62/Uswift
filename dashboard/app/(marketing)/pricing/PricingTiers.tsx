import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Check, X } from "lucide-react";

const tiers = [
  {
    name: "Basic",
    price: "$0",
    description: "Get started with essential AI career tools.",
    features: [
      { text: "AI Career Assistant", included: true },
      { text: "Job Application Tracker", included: true },
      { text: "5 Resume Enhancements", included: true },
      { text: "5 Cover Letter Generations", included: true },
      { text: "Community Support", included: true },
      { text: "Smart Auto-Apply", included: false },
    ],
    cta: "Start for Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$25",
    description: "Unlock the full power of Uswift for serious job seekers.",
    features: [
      { text: "Everything in Basic", included: true },
      { text: "Unlimited Resume Enhancements", included: true },
      { text: "Unlimited Cover Letters", included: true },
      { text: "Smart Auto-Apply on major job boards", included: true },
      { text: "AI-Powered Interview Prep", included: true },
      { text: "Priority Email Support", included: true },
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Career Coach",
    price: "Custom",
    description: "For professionals managing multiple clients.",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Multi-client Management Dashboard", included: true },
      { text: "Branded Reports & Analytics", included: true },
      { text: "Dedicated Account Manager", included: true },
      { text: "Custom Integrations", included: true },
      { text: "Team Seats", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const PricingTiers = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-400">Find the perfect plan for your career journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-animate="reveal">
          {tiers.map((tier, idx) => (
            <div key={`${tier.name}-${idx}`} className="flex flex-col">
              <Card>
                {tier.popular && (
                  <div className="bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded mb-4 inline-block">
                    Most Popular
                  </div>
                )}

                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900">{tier.name}</h3>
                  <div className="text-4xl font-bold text-gray-900">
                    {tier.price}
                    <span className="text-base font-normal text-gray-500">
                      {tier.name === "Pro" ? "/month" : ""}
                    </span>
                  </div>
                  <p className="text-gray-600">{tier.description}</p>
                </div>

                <ul className="space-y-3">
                  {tier.features.map((feature, fIdx) => (
                    <li key={`${tier.name}-feature-${fIdx}`} className="flex items-center text-gray-800">
                      {feature.included ? (
                        <Check className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
                      )}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-6">
                  <Button variant={tier.popular ? "primary" : "secondary"} className="w-full">
                    {tier.cta}
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingTiers;