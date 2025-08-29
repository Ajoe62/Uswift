import React, { useState, useRef, useEffect } from "react";
import { getMistralClient } from "./api/mistral";
import "./index.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface QuickPrompt {
  id: string;
  label: string;
  prompt: string;
  category: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  // Career Development
  {
    id: "career-advice",
    label: "Career Advice",
    prompt:
      "I need advice on advancing my career. Can you help me identify growth opportunities and create a development plan?",
    category: "Career",
  },
  {
    id: "interview-prep",
    label: "Interview Prep",
    prompt:
      "Help me prepare for a technical interview. What are common questions and how should I structure my answers?",
    category: "Career",
  },
  {
    id: "skill-development",
    label: "Skill Development",
    prompt:
      "What skills should I focus on to stay competitive in the tech industry? Please suggest a learning roadmap.",
    category: "Career",
  },

  // Job Search
  {
    id: "job-search-strategy",
    label: "Job Search Strategy",
    prompt:
      "Create a comprehensive job search strategy for me. Include networking, application tips, and follow-up strategies.",
    category: "Job Search",
  },
  {
    id: "resume-review",
    label: "Resume Review",
    prompt:
      "I'd like you to review my resume and suggest improvements. What are the key elements I should focus on?",
    category: "Job Search",
  },
  {
    id: "salary-negotiation",
    label: "Salary Negotiation",
    prompt:
      "Help me prepare for salary negotiations. What factors should I consider and how should I approach the discussion?",
    category: "Job Search",
  },

  // Professional Development
  {
    id: "leadership-skills",
    label: "Leadership Skills",
    prompt:
      "What are essential leadership skills for technical professionals? How can I develop them?",
    category: "Professional",
  },
  {
    id: "communication",
    label: "Communication Skills",
    prompt:
      "How can I improve my technical communication skills, both written and verbal?",
    category: "Professional",
  },
  {
    id: "work-life-balance",
    label: "Work-Life Balance",
    prompt:
      "How can I maintain a healthy work-life balance while pursuing career growth?",
    category: "Professional",
  },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your AI career assistant powered by Mistral AI. I can help you with:\n\n• Resume and cover letter optimization\n• Career advice and planning\n• Interview preparation\n• Job search strategies\n• Skill development guidance\n\nWhat would you like to work on today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mistralClient = getMistralClient();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const categories = [
    "All",
    ...Array.from(new Set(QUICK_PROMPTS.map((p) => p.category))),
  ];

  const filteredPrompts =
    selectedCategory === "All"
      ? QUICK_PROMPTS
      : QUICK_PROMPTS.filter((p) => p.category === selectedCategory);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Get AI response
      const response = await mistralClient.chatWithPrompt(content, {
        model: "mistral-small",
        max_tokens: 1024,
        temperature: 0.7,
        systemMessage:
          "You are a helpful career assistant and job search expert. Provide practical, actionable advice and be encouraging and professional.",
      });

      // Replace loading message with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? { ...msg, content: response, isLoading: false }
            : msg
        )
      );
    } catch (error) {
      console.error("Chat error:", error);

      // Replace loading message with error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content:
                  "Sorry, I encountered an error while processing your request. Please try again.",
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: QuickPrompt) => {
    sendMessage(prompt.prompt);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm your AI career assistant powered by Mistral AI. I can help you with:\n\n• Resume and cover letter optimization\n• Career advice and planning\n• Interview preparation\n• Job search strategies\n• Skill development guidance\n\nWhat would you like to work on today?",
        timestamp: new Date(),
      },
    ]);
  };

  const formatMessage = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "1.5rem",
        padding: "2rem",
        minWidth: 350,
        minHeight: 520,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        className="uswift-gradient"
        style={{
          height: 8,
          borderRadius: 8,
          marginBottom: 16,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "#111827",
            margin: 0,
          }}
        >
          AI Assistant
        </h2>
        <button
          onClick={clearChat}
          style={{
            background: "#EDE9FE",
            color: "#6D28D9",
            border: "none",
            borderRadius: 8,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          Clear Chat
        </button>
      </div>

      {/* Quick Prompts */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                background:
                  selectedCategory === category ? "#6D28D9" : "#F3F4F6",
                color: selectedCategory === category ? "#FFFFFF" : "#6B7280",
                border: "none",
                borderRadius: 6,
                padding: "4px 12px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 500,
              }}
            >
              {category}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            maxHeight: 120,
            overflowY: "auto",
          }}
        >
          {filteredPrompts.slice(0, 6).map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => handleQuickPrompt(prompt)}
              disabled={isLoading}
              style={{
                background: "#F8F9FA",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: "0.8rem",
                color: "#4B5563",
                opacity: isLoading ? 0.6 : 1,
                transition: "all 0.2s ease",
                flex: "1 1 auto",
                minWidth: 120,
                textAlign: "left",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = "#EDE9FE";
                  e.currentTarget.style.borderColor = "#6D28D9";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = "#F8F9FA";
                  e.currentTarget.style.borderColor = "#E5E7EB";
                }
              }}
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: 16,
          maxHeight: 300,
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: 16,
              display: "flex",
              flexDirection: message.role === "user" ? "row-reverse" : "row",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius: 12,
                background: message.role === "user" ? "#6D28D9" : "#F3F4F6",
                color: message.role === "user" ? "#FFFFFF" : "#111827",
                fontSize: "0.9rem",
                lineHeight: 1.4,
                position: "relative",
              }}
            >
              {message.isLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid #6D28D9",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <span style={{ color: "#6B7280" }}>Thinking...</span>
                </div>
              ) : (
                formatMessage(message.content)
              )}

              <div
                style={{
                  fontSize: "0.7rem",
                  opacity: 0.7,
                  marginTop: 4,
                  textAlign: message.role === "user" ? "right" : "left",
                }}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(inputMessage);
            }
          }}
          placeholder="Ask me anything about your career..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            fontSize: "0.9rem",
            outline: "none",
            opacity: isLoading ? 0.6 : 1,
          }}
        />
        <button
          onClick={() => sendMessage(inputMessage)}
          disabled={isLoading || !inputMessage.trim()}
          className="uswift-btn"
          style={{
            padding: "12px 16px",
            opacity: isLoading || !inputMessage.trim() ? 0.6 : 1,
            cursor:
              isLoading || !inputMessage.trim() ? "not-allowed" : "pointer",
            minWidth: 60,
          }}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 12,
          textAlign: "center",
          fontSize: "0.8rem",
          color: "#6B7280",
        }}
      >
        Powered by Mistral AI • Ask me about career advice, resume help, or
        interview tips!
      </div>
    </div>
  );
}
