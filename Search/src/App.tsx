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
        <div className="max-w-[600px] mx-auto my-auto space-y-8">
          <h1 className="text-3xl font-bold text-center">Do Search</h1>

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
          <hr />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search results</h2>
            <ul className="space-y-4">
              {results.length === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    No files match your query.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold">DF: </span>0
                  </p>
                </>
              ) : (
                results.map((result) => (
                  <li
                    key={result.docId}
                    className="p-4 border border-border rounded-lg shadow-sm bg-card flex items-start space-x-3 hover:bg-muted transition-colors"
                  >
                    {/* File icon */}
                    <svg
                      className="w-6 h-6 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <div className="flex-1">
                      {/* File title: first two words */}
                      <p className="text-base font-semibold text-foreground">
                        {result.content.split(/\s+/).slice(0, 2).join(" ") ||
                          "Untitled File"}
                      </p>
                      {/* Content preview */}
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.content.length > 70
                          ? `${result.content.slice(0, 70)}...`
                          : result.content}
                      </p>
                      {/* Score */}
                      <p className="text-xs text-muted-foreground mt-2">
                        Score: {result.score.toFixed(4)}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
          <hr />
          <div className="max-w-2xl mx-auto my-8">
            <h1 className="text-lg font-bold mb-4 text-foreground">
              Team Members
            </h1>
            <table className="w-full border-collapse border border-border bg-card">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left text-sm font-semibold text-foreground"></th>
                  <th className="border border-border p-2 text-left text-sm font-semibold text-foreground">
                    Name
                  </th>
                  <th className="border border-border p-2 text-left text-sm font-semibold text-foreground">
                    School ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Jaleta Kebede", schoolId: "UGR/30722/15" },
                  { name: "Abel Getahun", schoolId: "UGR/30057/15" },
                  { name: "Aklilu Desalegn", schoolId: "UGR/30121/15" },
                  { name: "Abdisa", schoolId: "UGR/_____/15" },
                  { name: "Negasa", schoolId: "UGR/_____/15" },
                  { name: "Yonatan Solomon", schoolId: "UGR/31446/15" },
                ].map((member, index) => (
                  <tr key={index} className="hover:bg-muted transition-colors">
                    <td className="border border-border p-2 text-sm text-foreground">
                      {index + 1}
                    </td>
                    <td className="border border-border p-2 text-sm text-foreground">
                      {member.name}
                    </td>
                    <td className="border border-border p-2 text-sm text-foreground">
                      {member.schoolId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
