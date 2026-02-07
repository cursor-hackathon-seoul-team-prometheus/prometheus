import Anthropic from "@anthropic-ai/sdk";
import { SyllabusAnalysis, Answer } from "../types";

// Initialize Claude Client
// IMPORTANT: process.env.API_KEY is automatically injected.
const client = new Anthropic({
  apiKey: process.env.API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Extracts text from a syllabus image or PDF using Claude's multimodal capabilities.
 */
export const extractSyllabusFromFile = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    const contentBlock: Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam =
      mimeType === "application/pdf"
        ? {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Data,
            },
          }
        : {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64Data,
            },
          };

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            {
              type: "text",
              text: "이 파일(이미지 또는 PDF)에 있는 강의계획서 내용을 텍스트로 추출해줘. 마크다운 형식으로 구조화해서 정리해줘. 다른 설명은 제외하고 내용만 출력해.",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock && textBlock.type === "text" ? textBlock.text : "";
  } catch (error) {
    console.error("Error extracting text from file:", error);
    throw new Error("파일에서 텍스트를 추출하는데 실패했습니다. 파일 형식을 확인해주세요.");
  }
};

/**
 * Analyzes the uploaded syllabus to identify missing information.
 */
export const analyzeSyllabus = async (syllabusText: string): Promise<SyllabusAnalysis> => {
  try {
    const prompt = `
      You are an expert instructional designer. Analyze the following syllabus text.
      Determine if there is enough information to create a high-quality, 1-hour lecture slide deck.
      
      Look for missing critical details such as:
      1. Target Audience Level (Beginner, Advanced, etc.)
      2. Specific Learning Objectives (if vague)
      3. Tone of the lecture (Academic, Casual, Professional)
      4. Key constraints (Time limits, specific tools to use)
      5. Focus areas (Theory vs. Practice)

      If information is missing, generate 3-5 specific questions in Korean (한국어) to ask the user to clarify these details.
      Also provide the summary in Korean.

      Syllabus:
      """
      ${syllabusText}
      """
    `;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools: [
        {
          name: "analyze_syllabus",
          description: "Return the structured analysis of the syllabus including whether info is missing, a summary, and clarifying questions.",
          input_schema: {
            type: "object" as const,
            properties: {
              missingInfo: {
                type: "boolean",
                description: "True if important details are missing, False if the syllabus is very comprehensive.",
              },
              summary: {
                type: "string",
                description: "A brief 1-sentence summary of the syllabus topic in Korean.",
              },
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    question: { type: "string", description: "The question in Korean." },
                    context: {
                      type: "string",
                      description: "Brief explanation of why this info helps generate better slides, in Korean.",
                    },
                    type: { type: "string", enum: ["text", "choice"] },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      description: "Options in Korean if type is choice, otherwise empty array.",
                    },
                  },
                  required: ["id", "question", "context", "type"],
                },
              },
            },
            required: ["missingInfo", "summary", "questions"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "analyze_syllabus" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolBlock = response.content.find((block) => block.type === "tool_use");
    if (toolBlock && toolBlock.type === "tool_use") {
      return toolBlock.input as SyllabusAnalysis;
    }
    throw new Error("No structured response received from Claude.");
  } catch (error) {
    console.error("Error analyzing syllabus:", error);
    throw new Error("Failed to analyze syllabus. Please try again.");
  }
};

/**
 * Generates the final lecture materials based on syllabus and user answers.
 */
export const generateLectureMaterial = async (syllabusText: string, answers: Answer[]): Promise<string> => {
  try {
    const answersText = answers.map((a) => `Q: ${a.questionText}\nA: ${a.answer}`).join("\n\n");

    const prompt = `
      You are a world-class educational content creator. 
      Create a comprehensive lecture slide deck outline and content in Markdown format based on the syllabus and user clarifications.
      
      **IMPORTANT**: All generated content must be in **Korean** (한국어).

      **STRICT RULE**: 
      - DO NOT include any introductory remarks, conversational filler, or summary of the request.
      - DO NOT start with phrases like "제공해주신...", "요청하신...", "작성된 강의 교안입니다."
      - START IMMEDIATELY with the first slide header (# Title).
      - ONLY output the Markdown lecture content.

      **Source Material:**
      Syllabus:
      """
      ${syllabusText}
      """

      **User Clarifications:**
      """
      ${answersText}
      """

      **Output Requirements:**
      1.  **Format**: Markdown. Use # for Slide Titles, ## for Main Points, - for bullets.
      2.  **Structure**:
          *   **Title Slide**: Topic, Presenter Name placeholder.
          *   **Agenda**: What will be covered.
          *   **Learning Objectives**: Clear goals.
          *   **Content Slides**: Break down the syllabus topics into logical slides. Each slide should have substantial content.
          *   **Activity/Discussion**: Include at least one interactive element or discussion question based on the content.
          *   **Conclusion/Summary**: Key takeaways.
          *   **Speaker Notes**: For every slide, add a 'Speaker Notes:' section in blockquotes (>) at the bottom of the slide section.
      3.  **Tone**: Adapt to the user's clarified audience and tone.
      4.  **Visuals**: Suggest an image description for key slides in italic *(Image suggestion: ...)*.
    `;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      thinking: {
        type: "enabled",
        budget_tokens: 2048,
      },
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock && textBlock.type === "text" ? textBlock.text : "# Error generating content.";
  } catch (error) {
    console.error("Error generating material:", error);
    throw new Error("Failed to generate lecture materials.");
  }
};

/**
 * Refines a specific slide based on user instruction.
 */
export const refineSlideContent = async (currentSlideContent: string, instruction: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert presentation editor. 
      Update the following Markdown slide content based on the user's instruction.
      
      **Original Slide:**
      """
      ${currentSlideContent}
      """

      **User Instruction:**
      "${instruction}"

      **STRICT REQUIREMENTS:**
      1. Keep the output in **Korean** (unless the user asks to translate).
      2. Maintain Markdown format (# for title, bullets, etc.).
      3. **ONLY output the updated content for this specific slide.** 
      4. **DO NOT add any conversational filler, explanations, or introductory text.**
      5. START IMMEDIATELY with the slide content (e.g., # Slide Title).
    `;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock && textBlock.type === "text" ? textBlock.text : currentSlideContent;
  } catch (error) {
    console.error("Error refining slide:", error);
    throw new Error("슬라이드 수정 중 오류가 발생했습니다.");
  }
};
