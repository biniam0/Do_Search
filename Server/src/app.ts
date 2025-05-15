import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { WordTokenizer } from "natural";
import { removeStopwords } from "stopword";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world");
});

// Preprocess the query or doc content by tokenizing or removing stop words
const tokenizer = new WordTokenizer();
const preprocess = (text: string): string[] => {
  const processedText = tokenizer
    .tokenize(text.toLowerCase())
    .filter((term: string) => /^[a-zA-Z0-9]+$/.test(term));
  const filtered = removeStopwords(processedText);
  console.log("Preprocessed terms:", filtered);
  return filtered;
};

// Add document and update index
app.post(
  "/api/documents",
  async (req: Request, res: Response): Promise<any> => {
    const { content }: { content: string } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });
    try {
      const document = await prisma.document.create({ data: { content } });
      const terms = preprocess(content);
      const termFreq: { [key: string]: { tf: number; positions: number[] } } =
        {};
      terms.forEach((term, pos) => {
        termFreq[term] = termFreq[term] || { tf: 0, positions: [] };
        termFreq[term].tf += 1;
        if (term && typeof term === "string")
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
    } catch (err: any) {
      console.error("Document error:", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

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
    const idf = df > 0 ? Math.log10(N / df) + 1 : 0; // Use log10, add 1 to ensure non-zero idf
    const postings = await prisma.posting.findMany({
      where: { term },
      select: { docId: true, tf: true },
    });

    for (const { docId, tf } of postings) {
      const tfidf = (1 + Math.log10(tf)) * idf; // Normalize tf with log10
      if (isNaN(tfidf) || tfidf <= 0) {
        console.log(
          `Invalid tfidf for term=${term}, docId=${docId}, tf=${tf}, idf=${idf}`
        );
        continue;
      }
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
  const common = Object.keys(vec1).filter((t) => vec2[t] !== undefined);
  if (common.length === 0) return 0;

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
  console.log("Query content: ", query);

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
        const idf = Math.log10(N / termData.df) + 1; // Match computeTfIdf
        if (isNaN(idf) || idf <= 0) {
          console.log(
            `Invalid idf for term=${term}, df=${termData.df}, N=${N}`
          );
          queryVec[term] = 0;
        } else {
          queryVec[term] = idf; // Simplified: one occurrence per term in query
        }
      } else {
        console.log(`Term not found or df=0: ${term}`);
        queryVec[term] = 0;
      }
    }
    // console.log("Query vector:", queryVec);

    const docVectors: { [key: string]: { [key: string]: number } } = {};
    const vectors = await prisma.docVector.findMany({
      select: { docId: true, term: true, tfidf: true },
    });
    for (const { docId, term, tfidf } of vectors) {
      docVectors[docId] = docVectors[docId] || {};
      docVectors[docId][term] = tfidf;
    }
    // console.log("Document vectors:", docVectors);

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
    console.log("Search results:", results);
    res.json(results);
  } catch (err: any) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default app;
