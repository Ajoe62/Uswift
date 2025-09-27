import React from "react";

type AccordionProps = React.HTMLAttributes<HTMLDivElement> & { type?: string; collapsible?: boolean };
const Accordion: React.FC<AccordionProps> = ({ children, collapsible, type, ...props }) => {
  return <div {...props}>{children}</div>;
};

type AccordionItemProps = React.DetailsHTMLAttributes<HTMLDetailsElement> & { value?: string };
const AccordionItem: React.FC<AccordionItemProps> = ({ children, ...props }) => {
  return <details {...props}>{children}</details>;
};

type AccordionTriggerProps = React.HTMLAttributes<HTMLElement>;
const AccordionTrigger: React.FC<AccordionTriggerProps> = ({ children, ...props }) => {
  // Render as <summary> so it works natively with <details>
  return <summary {...props}>{children}</summary>;
};

type AccordionContentProps = React.HTMLAttributes<HTMLDivElement>;
const AccordionContent: React.FC<AccordionContentProps> = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

const faqs = [
  {
    question: "Is my resume and personal data secure?",
    answer: "Yes, absolutely. We use enterprise-grade encryption for all data. Your personal information, resume details, and generated documents are kept private and are never used for training models.",
  },
  {
    question: "How does the Smart Auto-Apply feature work?",
    answer: "The Auto-Apply feature uses intelligent automation to fill out job applications on supported platforms like LinkedIn, Indeed, and others. It uses your saved profile and resume information to complete forms quickly and accurately, saving you hours of manual data entry.",
  },
  {
    question: "What if a job board is not supported?",
    answer: "We are constantly adding support for new job boards and Applicant Tracking Systems (ATS). If you come across a site that isn't fully supported, our extension will still attempt to assist where possible, and you can notify us to request full integration.",
  },
  {
    question: "Can I cancel my 'Pro' subscription at any time?",
    answer: "Yes, you can cancel your subscription at any time from your account dashboard. You will retain access to Pro features until the end of your current billing cycle.",
  },
];

const FAQ = () => {
  return (
    <div className="py-10 sm:py-16 md:py-28 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900" data-animate="reveal"> {/* Changed: modern gradient background, py-10 for mobile, sm:py-16 for tablets, md:py-28 for desktop */}
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-uswift-navy mb-2"> {/* Changed: font-extrabold, text-uswift-navy for visibility, responsive text sizes, mb-2 for spacing */}
          Frequently Asked Questions
        </h2>
        <p className="text-base sm:text-lg text-gray-300 max-w-xl mx-auto"> {/* Changed: subtitle for professionalism, text-gray-300 for visibility, responsive text sizes */}
          Everything you need to know about Uswift and our privacy-first job automation.
        </p>
      </div>
      <Accordion
        type="single"
        collapsible
        className="w-full max-w-2xl sm:max-w-3xl mx-auto space-y-4" // Changed: max-w-2xl for mobile, sm:max-w-3xl for desktop, space-y-4 for spacing
      >
        {faqs.map((faq, index) => (
          <AccordionItem
            value={`item-${index}`}
            key={index}
            className="bg-gray-800/80 border border-gray-700 rounded-xl shadow transition-all duration-300 overflow-hidden" // Changed: modern card style, rounded-xl, shadow, border, transition
          >
            <AccordionTrigger className="flex items-center justify-between px-4 py-4 sm:py-5 cursor-pointer text-lg sm:text-xl font-semibold text-white hover:text-uswift-accent focus:outline-none focus:text-uswift-accent transition-colors"> {/* Changed: flex, padding, font-semibold, text-lg for mobile, sm:text-xl for desktop, hover/focus color */}
              {faq.question}
              <span className="ml-2 text-uswift-accent">&#9662;</span> {/* Changed: arrow indicator for modern look */}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-base sm:text-lg text-gray-100 leading-relaxed"> {/* Changed: padding, text-gray-100 for visibility, responsive text size, leading-relaxed for readability */}
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQ;