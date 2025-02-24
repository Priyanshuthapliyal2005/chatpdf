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
    prompt: `As an expert academic analyst, provide a comprehensive yet concise summary of the document "${documentTitle}" from ${schoolName}.

Key aspects to cover:
1. Main objectives and core concepts
2. Key findings or arguments
3. Significant methodologies or approaches used
4. Important conclusions or recommendations
5. Practical implications or applications

Format your response with clear structure and emphasize the most critical points. Use professional academic language while maintaining clarity.`,
    schema: z.object({
      title: z.string().describe("Title of the document"),
      schoolName: z.string().describe("Name of the school"),
      summary: z.string().describe("Detailed, well-structured summary of the document"),
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
    prompt: `As an expert academic advisor, provide a detailed and accurate answer to the following question about "${documentTitle}":

Question: "${question}"

Please ensure your response:
1. Directly addresses the specific question asked
2. Provides relevant context from the document
3. Cites specific sections or examples where applicable
4. Explains complex concepts in clear terms
5. Maintains academic rigor while being accessible
6. Includes relevant supporting details or examples

If any part of the question cannot be fully answered based on the document content, explicitly state this and explain what information is available.`,
    schema: z.object({
      title: z.string().describe("Title of the document"),
      question: z.string().describe("The posed question"),
      answer: z.string().describe("Comprehensive, well-reasoned answer based on document content"),
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
    prompt: `As an experienced academic researcher, generate insightful follow-up questions about "${documentTitle}".

Generate questions that:
1. Probe deeper into key concepts and findings
2. Explore practical applications and implications
3. Challenge assumptions or methodologies
4. Connect ideas to broader academic contexts
5. Encourage critical thinking and analysis
6. Address potential gaps or areas for further research

Each question should be:
- Clear and specific
- Academically relevant
- Thought-provoking
- Connected to the document's core themes`,
    output: "array",
    schema: z.array(
      z.object({
        question: z.string().describe("A thought-provoking, academically-focused follow-up question"),
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
    prompt: `As an academic librarian, provide detailed reference information for "${documentTitle}" from ${schoolName}.

Include comprehensive details about:
1. Full document title and subtitle
2. Institution and department affiliation
3. Document type and classification
4. Version information or edition details
5. Publication or last update date
6. Any unique identifiers or reference numbers
7. Related documentation or companion materials
8. Access classification or restrictions

Format the reference details in a clear, structured manner following academic standards.`,
    schema: z.object({
      title: z.string().describe("Complete title of the document"),
      schoolName: z.string().describe("Name of the school and relevant department"),
      reference: z.string().describe("Comprehensive reference details following academic standards"),
    }),
  });

  return referenceDetails;
}
