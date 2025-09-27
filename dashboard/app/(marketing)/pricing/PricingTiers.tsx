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
    <div className="min-h-screen bg-gray-900 p-4 sm:p-8"> {/* Changed: p-4 for mobile, sm:p-8 for larger screens */}
      <div className="max-w-2xl sm:max-w-4xl lg:max-w-7xl mx-auto"> {/* Changed: max-w-2xl for mobile, sm:max-w-4xl for tablets, lg:max-w-7xl for desktop */}
        <div className="text-center mb-8 sm:mb-12"> {/* Changed: mb-8 for mobile, sm:mb-12 for larger screens */}
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4"> {/* Changed: text-2xl for mobile, sm:text-4xl for larger screens */}
            Choose Your Plan
          </h2>
          <p className="text-base sm:text-xl text-gray-400"> {/* Changed: text-base for mobile, sm:text-xl for larger screens */}
            Find the perfect plan for your career journey
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8" data-animate="reveal"> {/* Changed: grid-cols-1 for mobile, sm:grid-cols-2 for tablets, lg:grid-cols-3 for desktop; gap-4 for mobile, sm:gap-8 for larger screens */}
          {tiers.map((tier, idx) => (
            <div key={`${tier.name}-${idx}`} className="flex flex-col">
              <Card>
                {tier.popular && (
                  <div className="bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded mb-4 inline-block">
                    Most Popular
                  </div>
                )}

                <div className="border-b border-gray-200 pb-4 sm:pb-6 mb-4 sm:mb-6"> {/* Changed: pb-4 mb-4 for mobile, sm:pb-6 sm:mb-6 for larger screens */}
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">{tier.name}</h3> {/* Changed: text-xl for mobile, sm:text-2xl for larger screens */}
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900"> {/* Changed: text-3xl for mobile, sm:text-4xl for larger screens */}
                    {tier.price}
                    <span className="text-base font-normal text-gray-500">
                      {tier.name === "Pro" ? "/month" : ""}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base">{tier.description}</p> {/* Changed: text-sm for mobile, sm:text-base for larger screens */}
                </div>

                <ul className="space-y-2 sm:space-y-3"> {/* Changed: space-y-2 for mobile, sm:space-y-3 for larger screens */}
                  {tier.features.map((feature, fIdx) => (
                    <li key={`${tier.name}-feature-${fIdx}`} className="flex items-center text-gray-800 text-sm sm:text-base"> {/* Changed: text-sm for mobile, sm:text-base for larger screens */}
                      {feature.included ? (
                        <Check className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
                      )}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 sm:pt-6"> {/* Changed: pt-4 for mobile, sm:pt-6 for larger screens */}
                  <Button variant={tier.popular ? "primary" : "secondary"} className="w-full text-sm sm:text-base"> {/* Changed: text-sm for mobile, sm:text-base for larger screens */}
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