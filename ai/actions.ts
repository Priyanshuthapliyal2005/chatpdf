import { generateObject } from "ai";
import { z } from "zod";

import { geminiFlashModel } from ".";

export async function generateDocumentSummary({
  documentTitle,
  schoolName,
}: {
  documentTitle: string;
  schoolName: string;
}) {
  const { object: documentSummary } = await generateObject({
    model: geminiFlashModel,
    prompt: `Provide a concise summary for the document titled "${documentTitle}" from ${schoolName}. Highlight its key points.`,
    schema: z.object({
      title: z.string().describe("Title of the document"),
      schoolName: z.string().describe("Name of the school"),
      summary: z.string().describe("Summary of the document"),
    }),
  });

  return documentSummary;
}

export async function generateDocumentAnswer({
  documentTitle,
  question,
}: {
  documentTitle: string;
  question: string;
}) {
  const { object: documentAnswer } = await generateObject({
    model: geminiFlashModel,
    prompt: `Answer this question: "${question}" regarding the document titled "${documentTitle}".`,
    schema: z.object({
      title: z.string().describe("Title of the document"),
      question: z.string().describe("The posed question"),
      answer: z.string().describe("Answer based on the document content"),
    }),
  });

  return documentAnswer;
}

export async function generateDocumentRelatedQuestions({
  documentTitle,
}: {
  documentTitle: string;
}) {
  const { object: relatedQuestions } = await generateObject({
    model: geminiFlashModel,
    prompt: `List a few follow-up questions that could clarify details about the document titled "${documentTitle}".`,
    output: "array",
    schema: z.array(
      z.object({
        question: z.string().describe("A follow-up question related to the document"),
      })
    ),
  });

  return { questions: relatedQuestions };
}

export async function generateDocumentReference({
  documentTitle,
  schoolName,
}: {
  documentTitle: string;
  schoolName: string;
}) {
  const { object: referenceDetails } = await generateObject({
    model: geminiFlashModel,
    prompt: `Provide reference details for the document titled "${documentTitle}" from ${schoolName}. Include identifiers or version info if available.`,
    schema: z.object({
      title: z.string().describe("Title of the document"),
      schoolName: z.string().describe("Name of the school"),
      reference: z.string().describe("Reference details for the document"),
    }),
  });

  return referenceDetails;
}
