-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Term" (
    "term" TEXT NOT NULL,
    "df" INTEGER NOT NULL DEFAULT 0,
    "cf" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("term")
);

-- CreateTable
CREATE TABLE "Posting" (
    "term" TEXT NOT NULL,
    "docId" INTEGER NOT NULL,
    "tf" INTEGER NOT NULL DEFAULT 0,
    "positions" INTEGER[],

    CONSTRAINT "Posting_pkey" PRIMARY KEY ("term","docId")
);

-- CreateTable
CREATE TABLE "DocVector" (
    "docId" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "tfidf" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DocVector_pkey" PRIMARY KEY ("docId","term")
);

-- AddForeignKey
ALTER TABLE "Posting" ADD CONSTRAINT "Posting_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Posting" ADD CONSTRAINT "Posting_term_fkey" FOREIGN KEY ("term") REFERENCES "Term"("term") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocVector" ADD CONSTRAINT "DocVector_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocVector" ADD CONSTRAINT "DocVector_term_fkey" FOREIGN KEY ("term") REFERENCES "Term"("term") ON DELETE RESTRICT ON UPDATE CASCADE;
