import { CitationResponse } from "@/lib/api/types";

/**
 * Creates a map of citation ID (from the API response) to the actual CitationResponse object.
 * The mapping is based on the explicit 'id' field in the citation object.
 */
export function createIdToCitationMap(citations: CitationResponse[]): Map<number, CitationResponse> {
    const map = new Map<number, CitationResponse>();
    citations.forEach(citation => {
        if (citation.id !== undefined) {
            map.set(citation.id, citation);
        }
    });
    return map;
}


