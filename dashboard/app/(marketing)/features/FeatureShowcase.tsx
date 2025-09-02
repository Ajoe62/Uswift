import CardPkg from "@/components/ui/Card";
const Card: any = (CardPkg as any).default ?? CardPkg;
const CardContent: any = (CardPkg as any).CardContent ?? (CardPkg as any).default ?? (() => null);
const CardHeader: any = (CardPkg as any).CardHeader ?? (() => null);
import {
  Zap,
  BrainCircuit,
  Code,
  Bot,
  FileText,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: <Zap className="w-8 h-8 text-purple-400" />,
    title: "Real-time Code Generation",
    description:
      "Instantly generate code snippets, components, or entire files from natural language prompts.",
  },
  {
    icon: <BrainCircuit className="w-8 h-8 text-green-400" />,
    title: "Intelligent Context Awareness",
    description:
      "Uswift understands your entire codebase, providing relevant suggestions and maintaining consistency.",
  },
  {
    icon: <Code className="w-8 h-8 text-blue-400" />,
    title: "Multi-language & Framework Support",
    description:
      "From Python to Rust, React to Vue, get expert-level assistance across your favorite technologies.",
  },
  {
    icon: <Bot className="w-8 h-8 text-red-400" />,
    title: "Automated Workflows",
    description:
      "Automate repetitive tasks like writing tests, generating documentation, and refactoring code.",
  },
  {
    icon: <FileText className="w-8 h-8 text-yellow-400" />,
    title: "Document Analysis",
    description:
      "Chat with your documents. Extract information, summarize content, and get answers from your PDFs and text files.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-teal-400" />,
    title: "Secure and Private",
    description:
      "Your code and data are never stored or used for training. All processing is secure and ephemeral.",
  },
];

const FeatureShowcase = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} data-animate="reveal">
              <div className="h-full bg-gray-800/30 border-gray-700 hover:border-purple-400 transition-colors duration-300">
                <Card>
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <h3 className="text-white text-lg font-semibold">{feature.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;