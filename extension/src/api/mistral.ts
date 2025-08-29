// Mistral AI API Client for Chrome Extension
// Handles chat, embeddings, and file operations

interface MistralConfig {
  apiKey: string;
  baseUrl: string;
  chatUrl?: string;
  embeddingsUrl?: string;
  filesUrl?: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  model?: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface EmbeddingsRequest {
  input: string | string[];
  model?: string;
  encoding_format?: string;
}

interface EmbeddingsResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

class MistralClient {
  private config: MistralConfig;

  constructor(config: MistralConfig) {
    this.config = config;
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit
  ): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      mode: "cors",
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(
        errorData.error?.message ||
          `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  }

  // Chat completion
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const chatUrl = this.config.chatUrl || "/v1/chat/completions";

    return await this.makeRequest(chatUrl, {
      method: "POST",
      body: JSON.stringify({
        model: request.model || "mistral-tiny",
        messages: request.messages,
        max_tokens: request.max_tokens || 512,
        temperature: request.temperature || 0.7,
        stream: request.stream || false,
      }),
    });
  }

  // Simple chat with text prompt
  async chatWithPrompt(
    prompt: string,
    options?: {
      model?: string;
      max_tokens?: number;
      temperature?: number;
      systemMessage?: string;
    }
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    if (options?.systemMessage) {
      messages.push({
        role: "system",
        content: options.systemMessage,
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    const response = await this.chat({
      messages,
      model: options?.model,
      max_tokens: options?.max_tokens,
      temperature: options?.temperature,
    });

    return response.choices[0]?.message?.content || "";
  }

  // Generate embeddings
  async generateEmbeddings(
    request: EmbeddingsRequest
  ): Promise<EmbeddingsResponse> {
    const embeddingsUrl = this.config.embeddingsUrl || "/v1/embeddings";

    return await this.makeRequest(embeddingsUrl, {
      method: "POST",
      body: JSON.stringify({
        input: request.input,
        model: request.model || "mistral-embed",
        encoding_format: request.encoding_format || "float",
      }),
    });
  }

  // Resume enhancement
  async enhanceResume(
    resumeContent: string,
    jobDescription?: string
  ): Promise<string> {
    const systemMessage = `You are an expert resume writer and career coach. Your task is to enhance and optimize resumes to make them more compelling for job applications. Focus on:

1. Strong action verbs and quantifiable achievements
2. Relevant keywords from the job description
3. Clear, concise language
4. Professional formatting suggestions
5. Skills optimization
6. Experience highlighting

Provide specific suggestions for improvement and a rewritten version if appropriate.`;

    let prompt = `Please enhance the following resume:\n\n${resumeContent}`;

    if (jobDescription) {
      prompt += `\n\nFor the following job description:\n\n${jobDescription}`;
    }

    prompt += `\n\nPlease provide:
1. Key improvements needed
2. Enhanced version of the resume
3. Specific suggestions for tailoring to the job`;

    return await this.chatWithPrompt(prompt, {
      model: "mistral-small",
      max_tokens: 2048,
      temperature: 0.7,
      systemMessage,
    });
  }

  // Cover letter generation
  async generateCoverLetter(
    resumeContent: string,
    jobDescription: string,
    companyName?: string
  ): Promise<string> {
    const systemMessage = `You are a professional cover letter writer. Create compelling, personalized cover letters that:

1. Highlight relevant experience and skills
2. Show enthusiasm for the role and company
3. Connect the candidate's background to the job requirements
4. Use professional, engaging language
5. Keep it concise (250-400 words)
6. Include a strong call-to-action

Structure: Introduction, Body paragraphs highlighting key qualifications, Conclusion with enthusiasm.`;

    const prompt = `Please write a personalized cover letter for this job application:

**Resume Content:**
${resumeContent}

**Job Description:**
${jobDescription}

**Company Name:** ${companyName || "the company"}

Please create a professional cover letter that effectively connects the candidate's experience with the job requirements.`;

    return await this.chatWithPrompt(prompt, {
      model: "mistral-small",
      max_tokens: 1024,
      temperature: 0.8,
      systemMessage,
    });
  }

  // Job description analysis
  async analyzeJobDescription(jobDescription: string): Promise<string> {
    const systemMessage = `You are a career counselor and job market expert. Analyze job descriptions to extract:

1. Key requirements and qualifications
2. Important skills and technologies
3. Company culture indicators
4. Career level assessment
5. Salary range insights
6. Application tips

Provide clear, actionable insights for job seekers.`;

    const prompt = `Please analyze this job description and provide insights for job seekers:

${jobDescription}

Please structure your analysis with:
- Key Requirements
- Required Skills
- Nice-to-Have Skills
- Company Culture Insights
- Application Strategy Tips`;

    return await this.chatWithPrompt(prompt, {
      model: "mistral-small",
      max_tokens: 1024,
      temperature: 0.6,
      systemMessage,
    });
  }

  // Skills gap analysis
  async analyzeSkillsGap(
    userSkills: string,
    jobRequirements: string
  ): Promise<string> {
    const systemMessage = `You are a career development expert. Help candidates identify skill gaps and create development plans.

Focus on:
1. Matching existing skills to requirements
2. Identifying gaps and learning priorities
3. Suggesting learning resources
4. Timeline recommendations
5. Alternative qualifications that could compensate`;

    const prompt = `Compare the candidate's skills with job requirements and provide a skills gap analysis:

**Candidate Skills:**
${userSkills}

**Job Requirements:**
${jobRequirements}

Please provide:
1. Skills Match Assessment
2. Key Gaps to Address
3. Learning Recommendations
4. Timeline Suggestions
5. Alternative Approaches`;

    return await this.chatWithPrompt(prompt, {
      model: "mistral-small",
      max_tokens: 1024,
      temperature: 0.7,
      systemMessage,
    });
  }
}

// Configuration - uses centralized config system
const getMistralConfig = (): MistralConfig => {
  // Try to get from global config first (Chrome extension environment)
  const globalConfig = (globalThis as any).EXTENSION_CONFIG;

  if (globalConfig?.mistral) {
    return {
      apiKey: globalConfig.mistral.apiKey,
      baseUrl: globalConfig.mistral.baseUrl,
      chatUrl: "/v1/chat/completions",
      embeddingsUrl: "/v1/embeddings",
    };
  }

  // Fallback to global variables (for Chrome extension environment)
  const apiKey =
    (globalThis as any).VITE_MISTRAL_API_KEY ||
    (globalThis as any).process?.env?.VITE_MISTRAL_API_KEY ||
    "your-mistral-api-key-here"; // Fallback for development

  const baseUrl =
    (globalThis as any).VITE_MISTRAL_BASE_URL ||
    (globalThis as any).process?.env?.VITE_MISTRAL_BASE_URL ||
    "https://api.mistral.ai";

  return {
    apiKey,
    baseUrl,
    chatUrl: "/v1/chat/completions",
    embeddingsUrl: "/v1/embeddings",
  };
};

const DEFAULT_CONFIG: MistralConfig = getMistralConfig();

// Create and export singleton instance
let mistralClient: MistralClient | null = null;

export function getMistralClient(): MistralClient {
  if (!mistralClient) {
    // Validate configuration before creating client
    if (
      !DEFAULT_CONFIG.apiKey ||
      DEFAULT_CONFIG.apiKey === "your-mistral-api-key-here"
    ) {
      console.error(
        "🚨 Mistral API Key not configured! Please set VITE_MISTRAL_API_KEY environment variable."
      );
      throw new Error(
        "Mistral API key not configured. Please check your environment variables."
      );
    }

    console.log("✅ Initializing Mistral client with config:", {
      baseUrl: DEFAULT_CONFIG.baseUrl,
      hasApiKey: !!DEFAULT_CONFIG.apiKey,
      apiKeyLength: DEFAULT_CONFIG.apiKey.length,
    });

    mistralClient = new MistralClient(DEFAULT_CONFIG);
  }
  return mistralClient;
}

export { MistralClient };
export type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  EmbeddingsRequest,
  EmbeddingsResponse,
};
