import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hellodddooo world");
});

// Preprocess text
/**
 * Processes users search query
 * @param   string
 * @returns string[] List of indexed words.
 */
const preprocess = (text: string): string[] => {
  const processedText = text.toLowerCase().split(/\s+/);
  console.log("From Preprocessor", processedText);
  return processedText;
};

// Add document and update index
app.post("/api/documents", async (req: Request, res: Response) => {
  const { content }: { content: string } = req.body;
  try {
    const document = await prisma.document.create({ data: { content } });
    const terms = preprocess(content);
    const termFreq: { [key: string]: { tf: number; positions: number[] } } = {};
    terms.forEach((term, pos) => {
      termFreq[term] = termFreq[term] || { tf: 0, positions: [] };
      termFreq[term].tf += 1;
      termFreq[term].positions.push(pos);
    });

    for (const [term, { tf, positions }] of Object.entries(termFreq)) {
      await prisma.term.upsert({
        where: { term },
        update: { cf: { increment: tf }, df: { increment: 1 } },
        create: { term, cf: tf, df: 1 },
      });
      await prisma.posting.create({
        data: { term, docId: document.id, tf, positions },
      });
    }

    await computeTfIdf();
    res.status(201).json({ docId: document.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Compute TF-IDF for all documents
async function computeTfIdf(): Promise<void> {
  const N = await prisma.document.count();
  if (N === 0) {
    console.log("No documents found, skipping TF-IDF computation");
    return;
  }
  const terms = await prisma.term.findMany({
    select: { term: true, df: true },
  });

  for (const { term, df } of terms) {
    const idf = df > 0 ? Math.log(N / df) : 0;
    const postings = await prisma.posting.findMany({
      where: { term },
      select: { docId: true, tf: true },
    });

    for (const { docId, tf } of postings) {
      const tfidf = tf * idf;
      await prisma.docVector.upsert({
        where: { docId_term: { docId, term } },
        update: { tfidf },
        create: { docId, term, tfidf },
      });
    }
  }
}

// Cosine similarity
function cosineSimilarity(
  vec1: { [key: string]: number },
  vec2: { [key: string]: number }
): number {
  const common = Object.keys(vec1).filter((t) => vec2[t]);
  const dot = common.reduce((sum, t) => sum + vec1[t] * vec2[t], 0);
  const norm1 = Math.sqrt(
    Object.values(vec1).reduce((sum, v) => sum + v ** 2, 0)
  );
  const norm2 = Math.sqrt(
    Object.values(vec2).reduce((sum, v) => sum + v ** 2, 0)
  );
  return norm1 && norm2 ? dot / (norm1 * norm2) : 0;
}

// Process search query
app.get("/api/search", async (req: Request, res: Response): Promise<any> => {
  const { query }: { query?: string } = req.query;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const terms = preprocess(query);
    console.log("Query terms:", terms);
    const N = await prisma.document.count();
    if (N === 0) {
      console.log("No documents in database");
      return res.json([]);
    }
    const queryVec: { [key: string]: number } = {};

    for (const term of terms) {
      const termData = await prisma.term.findUnique({
        where: { term },
        select: { df: true },
      });
      if (termData && termData.df > 0) {
        const idf = Math.log(N / termData.df);
        queryVec[term] = (queryVec[term] || 0) + idf;
      } else {
        console.log(`Term not found or df=0: ${term}`);
        queryVec[term] = 0;
      }
    }
    console.log("Query vector:", queryVec);

    const docVectors: { [key: string]: { [key: string]: number } } = {};
    const vectors = await prisma.docVector.findMany({
      select: { docId: true, term: true, tfidf: true },
    });
    for (const { docId, term, tfidf } of vectors) {
      docVectors[docId] = docVectors[docId] || {};
      docVectors[docId][term] = tfidf;
    }
    console.log("Document vectors:", docVectors);

    const scores: { [key: string]: number } = {};
    for (const [docId, vec] of Object.entries(docVectors)) {
      scores[docId] = cosineSimilarity(queryVec, vec);
    }
    console.log("Scores:", scores);

    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const results: { docId: string; content: string; score: number }[] = [];
    for (const [docId, score] of sorted) {
      if (score > 0) {
        const doc = await prisma.document.findUnique({
          where: { id: parseInt(docId) },
          select: { content: true },
        });
        if (doc) results.push({ docId, content: doc.content, score });
      }
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default app;
