
import { CreatorLead, SearchQuery } from "../types.ts";

export interface SearchResult {
  leads: CreatorLead[];
  sources: { title: string; uri: string }[];
}

export const searchCreators = async (
  query: SearchQuery,
  existingUsernames: string[]
): Promise<SearchResult> => {
  const res = await fetch("/api/search-creators", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, existingUsernames }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "Errore durante la sincronizzazione con il database remoto");
  }

  return data as SearchResult;
};
