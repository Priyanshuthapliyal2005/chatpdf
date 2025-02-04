import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";

import { geminiProModel } from "@/ai";
import { generateDocumentSummary, generateDocumentAnswer, generateDocumentRelatedQuestions, generateDocumentReference } from "@/ai/actions";

import { auth } from "@/app/(auth)/auth";
import { createReservation, deleteChatById, getChatById, saveChat } from "@/db/queries";

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

  const result = await streamText({
    model: geminiProModel,
    system: `
        - You are a document question-answer bot for school documents.
        - Provide clear, concise, and accurate answers based on the document content.
        - Limit your responses to a sentence.
        - Ask clarifying questions if details are missing (e.g., document type, section).
        - Do not output lists.
        - Today is ${new Date().toLocaleDateString()}.
        - Tailor responses for a SaaS app serving schools.
    `,
    messages: coreMessages,
    tools: {
      generateDocumentSummary: {
        description: "Generate a concise summary for a school document",
        parameters: z.object({
          documentTitle: z.string().describe("Title of the document"),
          schoolName: z.string().describe("Name of the school"),
        }),
        execute: async ({ documentTitle, schoolName }) => {
          const summary = await generateDocumentSummary({ documentTitle, schoolName });
          return summary;
        },
      },
      generateDocumentAnswer: {
        description: "Answer a question based on the document content",
        parameters: z.object({
          documentTitle: z.string().describe("Title of the document"),
          question: z.string().describe("Question related to the document"),
        }),
        execute: async ({ documentTitle, question }) => {
          const answer = await generateDocumentAnswer({ documentTitle, question });
          return answer;
        },
      },
      generateDocumentRelatedQuestions: {
        description: "Provide follow-up questions to clarify document details",
        parameters: z.object({
          documentTitle: z.string().describe("Title of the document"),
        }),
        execute: async ({ documentTitle }) => {
          const questions = await generateDocumentRelatedQuestions({ documentTitle });
          return questions;
        },
      },
      generateDocumentReference: {
        description: "Provide reference details for a document",
        parameters: z.object({
          documentTitle: z.string().describe("Title of the document"),
          schoolName: z.string().describe("Name of the school"),
        }),
        execute: async ({ documentTitle, schoolName }) => {
          const reference = await generateDocumentReference({ documentTitle, schoolName });
          return reference;
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
          console.error("Failed to save chat");
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
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
