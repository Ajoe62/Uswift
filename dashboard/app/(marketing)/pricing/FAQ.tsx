import React from "react";

type AccordionProps = React.HTMLAttributes<HTMLDivElement> & { type?: string; collapsible?: boolean };
const Accordion: React.FC<AccordionProps> = ({ children, ...props }) => {
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
    <div className="py-20 md:py-28" data-animate="reveal">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white">Frequently Asked Questions</h2>
      </div>
      <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <AccordionItem value={`item-${index}`} key={index} className="border-gray-700">
            <AccordionTrigger className="text-white hover:no-underline">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-gray-400">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQ;