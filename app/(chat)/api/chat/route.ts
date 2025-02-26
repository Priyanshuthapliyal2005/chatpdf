import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";

import { geminiProModel } from "@/ai";
import { generateDocumentSummary, generateDocumentAnswer, generateDocumentRelatedQuestions, generateDocumentReference } from "@/ai/actions";

import { auth } from "@/app/(auth)/auth";
import { deleteChatById, getChatById, saveChat } from "@/db/queries";

import { generateUUID } from "@/lib/utils";

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } = await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  try {
    const result = await streamText({
      model: geminiProModel,
      system: `
        You are an intelligent AI assistant designed to provide comprehensive information with clear source attribution.

        RESPONSE TYPES:

        1. GENERAL QUESTIONS & TOPICS:
        - Provide detailed, accurate information on any topic except geopolitical border disputes
        - Cover areas including but not limited to:
          * Science & Technology
          * History & Culture
          * Arts & Literature
          * Business & Economics
          * Health & Medicine
          * Environment & Nature
          * Sports & Entertainment
          * Education & Career
          * Personal Development
          * Language & Linguistics
          * Slang & Contemporary Usage
          * Cultural Expressions
          * Translation & Interpretation

        2. SOURCE ATTRIBUTION:
        Always include source information in this format:
        [SOURCE TYPE: REFERENCE]
        - Document: "Quote or reference" (Page/Line number)
        - Website: URL (Access date)
        - Image: Description (Source, Date)
        - Academic: Citation in APA/MLA format
        - Book: Author, Title, Page number
        - Research Paper: Authors, Journal, DOI
        - News: Publication, Date, URL
        - Video: Platform, Creator, Timestamp
        - Expert Opinion: Name, Credentials, Context

        3. LANGUAGE & CONTENT HANDLING:
        - For language research and translation requests:
          a) Provide academic/linguistic analysis [SOURCE: Dictionary/Reference]
          b) Include etymology and historical context [SOURCE: Etymology Database]
          c) Explain cultural significance [SOURCE: Cultural Studies]
          d) Note regional variations [SOURCE: Regional Usage Data]
          e) Discuss modern usage patterns [SOURCE: Contemporary Usage]

        4. DOCUMENT ANALYSIS:
        When user shares a document/attachment:
        - First ask: "Would you like me to analyze this document and provide practice questions based on its content?"
        - If yes, provide:
          a) Comprehensive document analysis:
             * Main themes and concepts [SOURCE: Document section X]
             * Key arguments/points [SOURCE: Document page Y]
             * Methodology used [SOURCE: Document methodology section]
             * Important findings/conclusions [SOURCE: Document conclusion]
             * Practical implications [SOURCE: Analysis based on section Z]
          b) Generate 20 medium-difficulty practice questions:
             * 10 conceptual understanding questions [SOURCE: Sections referenced]
             * 5 application-based questions [SOURCE: Case studies in document]
             * 5 analytical questions [SOURCE: Data/findings in document]

        GUIDELINES:
        - Provide comprehensive, factual information
        - ALWAYS include source attribution for every major point
        - Use clear structure with headings and bullet points
        - Include relevant examples and practical applications
        - Cite reliable sources when appropriate
        - Maintain professional yet engaging tone
        - Ask clarifying questions if needed
        - Avoid speculation on sensitive geopolitical issues
        - Focus on verified, factual information
        - Handle sensitive content responsibly
        - For language analysis, cite authoritative sources
        - Today is ${new Date().toLocaleDateString()}

        RESPONSE STRUCTURE:
        1. Topic Overview [SOURCE: Primary reference]
        2. Key Components/Concepts [SOURCE: Specific references]
        3. Detailed Explanation [SOURCE: Multiple citations]
        4. Practical Applications [SOURCE: Real-world examples]
        5. Examples/Case Studies [SOURCE: Documented cases]
        6. Latest Developments [SOURCE: Recent publications]
        7. Additional Resources [SOURCE: Verified links/references]
        8. Cultural/Linguistic Context [SOURCE: Cultural/linguistic studies]
        9. Usage Guidelines [SOURCE: Style guides/usage manuals]

        CITATION FORMAT:
        - Direct quotes: "Quote" [SOURCE: Exact reference]
        - Statistics: Number/Data [SOURCE: Database/Study]
        - Claims: Statement [SOURCE: Authority/Research]
        - Images: Description [SOURCE: Image origin]
        - Definitions: Term [SOURCE: Dictionary/Reference]
    `,
      messages: coreMessages,
      tools: {
        generateDocumentSummary: {
          description: "Generate a structured overview and analysis of a document",
          parameters: z.object({
            documentTitle: z.string().describe("Title of the document"),
            schoolName: z.string().describe("Name of the school"),
          }),
          execute: async ({ documentTitle, schoolName }) => {
            const summary = await generateDocumentSummary({ documentTitle, schoolName });
            return summary;
          },
        },
        generatePracticeQuestions: {
          description: "Generate practice questions based on document content",
          parameters: z.object({
            documentTitle: z.string().describe("Title of the document"),
            question: z.string().describe("Question or topic to generate questions about"),
          }),
          execute: async ({ documentTitle, question }) => {
            const questions = await generateDocumentAnswer({ documentTitle, question });
            return questions;
          },
        },
        generateDetailedExplanation: {
          description: "Generate detailed explanation for specific topics or concepts",
          parameters: z.object({
            documentTitle: z.string().describe("Title of the document"),
          }),
          execute: async ({ documentTitle }) => {
            const explanation = await generateDocumentRelatedQuestions({ documentTitle });
            return explanation;
          },
        },
        generateStudyMaterial: {
          description: "Generate supplementary study material",
          parameters: z.object({
            documentTitle: z.string().describe("Title of the document"),
            schoolName: z.string().describe("Name of the school"),
          }),
          execute: async ({ documentTitle, schoolName }) => {
            const material = await generateDocumentReference({ documentTitle, schoolName });
            return material;
          },
        },
      },
      onFinish: async ({ responseMessages }) => {
        if (session.user && session.user.id) {
          try {
            await saveChat({
              id,
              messages: [...coreMessages, ...responseMessages],
              userId: session.user.id,
            });
          } catch (error) {
            console.error("Failed to save chat:", error);
          }
        }
      },
      experimental_telemetry: {
        isEnabled: true,
        functionId: "stream-text",
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Failed to process chat:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
