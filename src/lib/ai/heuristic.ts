/**
 * Zero-dependency heuristic NLP engine.
 * Provides instant (<5ms) offline summarization, action item extraction,
 * and keyword/tag derivation without requiring model downloads or WebGPU.
 */

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
  "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
  "during", "each", "few", "for", "from", "further", "had", "hadn't", "has",
  "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
  "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
  "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
  "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
  "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
  "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same",
  "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so",
  "some", "such", "than", "that", "that's", "the", "their", "theirs", "them",
  "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll",
  "they're", "they've", "this", "those", "through", "to", "too", "under", "until",
  "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
  "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
  "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
  "yourself", "yourselves", "will", "just", "also", "like"
]);

const ACTION_VERBS = new Set([
  "todo", "to-do", "fix", "review", "implement", "update", "create", "write",
  "send", "call", "email", "schedule", "prepare", "check", "verify", "deploy",
  "build", "design", "refactor", "investigate", "clean", "buy", "order", "test",
  "discuss", "follow", "complete", "finish", "publish", "add", "remove", "organize"
]);

/**
 * Strips markdown syntax (headers, links, asterisks, tables, codes) to produce raw text.
 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/^#+\s+/gm, "")
    .replace(/\!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`{1,3}.*?`{1,3}/gs, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\|.*?\|/g, "")
    .trim();
}

/**
 * TextRank-inspired frequency-weighted extractive summarizer.
 */
export function heuristicSummarize(markdown: string, maxSentences: number = 3): string {
  const plain = stripMarkdown(markdown);
  if (!plain) return "No sufficient content to summarize.";

  // Split into sentences
  const rawSentences = plain
    .split(/(?<=[.?!])\s+(?=[A-Z0-9])/g)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 350);

  if (rawSentences.length <= maxSentences) {
    return rawSentences.map(s => `• ${s}`).join("\n");
  }

  // Calculate word frequencies (excluding stop words)
  const words = plain.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freqMap = new Map<string, number>();
  for (const w of words) {
    if (!STOP_WORDS.has(w)) {
      freqMap.set(w, (freqMap.get(w) || 0) + 1);
    }
  }

  // Score sentences
  const scored = rawSentences.map((sentence, index) => {
    const sWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    let score = 0;
    for (const w of sWords) {
      score += freqMap.get(w) || 0;
    }
    // Boost earlier sentences (lead bias)
    const positionBoost = 1 + (1 / (index + 1)) * 0.5;
    return {
      sentence,
      score: (score / Math.max(1, sWords.length)) * positionBoost,
      index
    };
  });

  // Pick top sentences and preserve original order
  const topSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map(item => `• ${item.sentence}`);

  return topSentences.join("\n");
}

/**
 * Scans markdown and extracts actionable items into - [ ] checklist format.
 */
export function heuristicExtractActions(markdown: string): string {
  const lines = markdown.split("\n");
  const extracted: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check if line already has an uncompleted or completed checkbox
    const checkboxMatch = line.match(/^[-*]\s+\[\s*\]\s+(.*)/i);
    if (checkboxMatch) {
      const item = checkboxMatch[1].trim();
      if (!seen.has(item.toLowerCase())) {
        seen.add(item.toLowerCase());
        extracted.push(`- [ ] ${item}`);
      }
      continue;
    }

    // Check if it's a bullet item starting with an action verb
    const bulletMatch = line.match(/^[-*+]\s+(.*)/);
    const content = bulletMatch ? bulletMatch[1].trim() : line;
    const firstWord = content.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");

    if (firstWord && ACTION_VERBS.has(firstWord) && content.length > 5 && content.length < 150) {
      if (!seen.has(content.toLowerCase())) {
        seen.add(content.toLowerCase());
        extracted.push(`- [ ] ${content}`);
      }
    }
  }

  if (extracted.length === 0) {
    // Fallback: search sentences for action phrases
    const sentences = markdown.split(/(?<=[.?!])\s+/);
    for (const s of sentences) {
      const clean = s.trim().replace(/^#+\s+/, "");
      const firstWord = clean.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
      if (firstWord && ACTION_VERBS.has(firstWord) && clean.length < 120) {
        if (!seen.has(clean.toLowerCase())) {
          seen.add(clean.toLowerCase());
          extracted.push(`- [ ] ${clean}`);
        }
      }
    }
  }

  return extracted.length > 0
    ? extracted.join("\n")
    : "- [ ] Review and organize note objectives\n- [ ] Follow up on key discussion points";
}

/**
 * Extracts top keyword concepts suitable for hashtags (#tag).
 */
export function heuristicExtractTags(markdown: string, existingTags: string[] = []): string[] {
  const plain = stripMarkdown(markdown).toLowerCase();
  const words = plain.match(/\b[a-z]{4,}\b/g) || [];
  const freqMap = new Map<string, number>();

  for (const w of words) {
    if (!STOP_WORDS.has(w) && !ACTION_VERBS.has(w)) {
      freqMap.set(w, (freqMap.get(w) || 0) + 1);
    }
  }

  const existingSet = new Set(existingTags.map(t => t.toLowerCase().replace(/^#/, "")));

  const sorted = Array.from(freqMap.entries())
    .filter(([word, count]) => count >= 2 && !existingSet.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => `#${word}`);

  return sorted;
}

/**
 * Cleans and formats markdown structure with consistent spacing and typography.
 */
export function heuristicPolishMarkdown(markdown: string): string {
  let text = markdown;

  // 1. Ensure header spacing: # Header needs space after #
  text = text.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");

  // 2. Ensure blank line before headers
  text = text.replace(/([^\n])\n(#{1,6}\s+)/g, "$1\n\n$2");

  // 3. Fix list formatting
  text = text.replace(/([^\n])\n([-*+]\s+)/g, "$1\n\n$2");

  // 4. Trim redundant trailing whitespace on lines
  text = text.replace(/[ \t]+$/gm, "");

  // 5. Replace 3+ consecutive newlines with 2
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}
