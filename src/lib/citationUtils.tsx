import { CitationResponse } from "@/lib/api/types";

/**
 * Parses the text to find all citation markers in the format [n] or [n, m].
 * Returns an ordered list of unique citation IDs found in the text.
 * 
 * Example: "See [2] and [1, 3] and [2]" -> [2, 1, 3]
 */
export function extractOrderedCitationIds(text: string): number[] {
    const regex = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
    const matches = text.matchAll(regex);
    const ids: number[] = [];
    const seen = new Set<number>();

    for (const match of matches) {
        // match[1] contains the numbers, e.g., "1" or "1, 2"
        const parts = match[1].split(',').map(s => parseInt(s.trim(), 10));
        for (const id of parts) {
            if (!isNaN(id) && !seen.has(id)) {
                ids.push(id);
                seen.add(id);
            }
        }
    }

    return ids;
}

/**
 * Creates a map of citation ID (from the text marker) to the actual CitationResponse object.
 * The mapping is based on the order of first appearance:
 * The nth unique ID found in the text corresponds to the nth element in the citations array.
 */
export function mapCitationsToIds(
    orderedIds: number[],
    citations: CitationResponse[]
): Map<number, CitationResponse> {
    const map = new Map<number, CitationResponse>();

    orderedIds.forEach((id, index) => {
        if (index < citations.length) {
            map.set(id, citations[index]);
        }
    });

    return map;
}

export interface CitationReplacement {
    marker: string;
    ids: number[];
}

/**
 * Helper to check if a part is a citation replacement
 */
export function isCitationReplacement(part: string | CitationReplacement): part is CitationReplacement {
    return (part as CitationReplacement).marker !== undefined;
}

/**
 * Helper to split text by citation patterns for rendering.
 */
export function splitTextByCitations(text: string): (string | CitationReplacement)[] {
    // Regex capturing the whole marker [1, 2] and the inner content 1, 2
    const regex = /(\[(\d+(?:\s*,\s*\d+)*)\])/g;
    const parts = text.split(regex);
    const result: (string | CitationReplacement)[] = [];

    // split with capturing groups returns: [pre, match, group1, group2, post, ...]
    // Regex: /(\[(\d+(?:\s*,\s*\d+)*)\])/g has 2 capturing groups.
    // 0: Full match implicitly (but split doesn't return it unless captured)
    // 1: Outer group `[...]`
    // 2: Inner group `1, 2`

    // Example: "A [1] B"
    // split: ["A ", "[1]", "1", " B"]

    for (let i = 0; i < parts.length; i += 3) {
        // Text part
        if (parts[i]) {
            result.push(parts[i]);
        }

        // Match part
        if (i + 1 < parts.length) {
            const marker = parts[i + 1]; // "[1]"
            const numbers = parts[i + 2]; // "1"

            if (marker && numbers) {
                const ids = numbers.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

                result.push({
                    marker,
                    ids
                });
            }
        }
    }

    return result;
}
