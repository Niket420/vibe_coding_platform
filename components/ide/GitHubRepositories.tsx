"use client";

import { useEffect, useState } from "react";
import { cloneRepository } from "@/lib/git";

type Repository = {
  id: number;
  name: string;
  fullName: string;
  cloneUrl: string;
};

export default function GitHubRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRepositories() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/github/repos");

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load repositories");
        }

        setRepositories(data.repositories);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load repositories",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRepositories();
  }, []);

  if (loading) {
    return <div>Loading GitHub repositories...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-2">
      <h2 className="font-semibold">GitHub Repositories</h2>

      {repositories.length === 0 ? (
        <p>No repositories available.</p>
      ) : (
        repositories.map((repo) => (
          <div
            key={repo.id}
            className="flex items-center justify-between rounded border p-3"
          >
            <div>
              <div className="font-medium">{repo.name}</div>
              <div className="text-sm text-gray-500">{repo.fullName}</div>
            </div>

            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/github/clone", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      cloneUrl: repo.cloneUrl,
                    }),
                  });

                  const data = await response.json();

                  if (!response.ok || !data.success) {
                    throw new Error(
                      data.error || "Failed to create GitHub token",
                    );
                  }

                  // Now use the temporary GitHub token to clone
                  await cloneRepository(repo.cloneUrl, data.token);

                  console.log("Repository cloned successfully");
                } catch (error) {
                  console.error("Clone failed:", error);
                }
              }}
            >
              Clone
            </button>
          </div>
        ))
      )}
    </div>
  );
}
