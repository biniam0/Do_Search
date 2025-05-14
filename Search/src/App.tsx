import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import "./App.css";

interface DocType {
  docId: string;
  content: string;
  score: number;
}

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocType[]>([]);
  const [newDoc, setNewDoc] = useState("");

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await axios.get("http://localhost:5000/api/search", {
        params: { query },
      });
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDoc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/documents", {
        content: newDoc,
      });
      setNewDoc("");
      alert("Document added!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-[65%] mx-auto my-auto space-y-8">
          <h1 className="text-3xl font-bold text-center">Search Engine</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter search query"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setQuery(e.target.value)
              }
              className="w-full"
            />
            <Button type="submit" className="max-w-fit">
              Search
            </Button>
          </form>

          <form onSubmit={handleAddDoc} className="space-y-4">
            <Textarea
              value={newDoc}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNewDoc(e.target.value)
              }
              placeholder="Add new document"
              className="w-full min-h-[120px]"
            />
            <Button type="submit" className="max-w-fit">
              Add Document
            </Button>
          </form>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search results</h2>
            <ul className="space-y-4">
              {results.map((result) => (
                <li
                  key={result.docId}
                  className="p-4 border border-border rounded-lg shadow-sm bg-card"
                >
                  <p className="mb-2 max">
                    {result.content.length > 150
                      ? `${result.content.slice(0, 150)}...`
                      : result.content}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Score: {result.score.toFixed(4)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
