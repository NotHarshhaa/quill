export interface NoteTemplate {
  id: string;
  title: string;
  description: string;
  iconName: string;
  defaultTitle: string;
  tags: string[];
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "meeting",
    title: "Meeting Notes",
    description: "Structure attendees, agenda, key decisions, and action checklists.",
    iconName: "Users",
    defaultTitle: "Meeting: [Topic]",
    tags: ["meeting", "work"],
    content: `# Meeting: [Topic]

**Date:** ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}  
**Participants:** @Name, @Name  

## Agenda
1. Review sprint goals
2. Architecture discussion
3. Open blockers

## Key Decisions
> [!NOTE] Decisions Record
> Summarize agreed outcomes and architectural choices here.

- Decision 1: 
- Decision 2: 

## Action Items
- [ ] Draft pull request specification
- [ ] Share meeting recap with engineering
- [ ] Follow up on dependency bump

#meeting #work`,
  },
  {
    id: "journal",
    title: "Daily Journal",
    description: "Start the day with morning intentions and wrap up with reflection & gratitude.",
    iconName: "Sun",
    defaultTitle: `Daily Journal — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    tags: ["journal", "reflection"],
    content: `# Daily Journal — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}

> [!TIP] Today's Anchor Thought
> "Clarity comes from engagement, not thought."

## Morning Intentions
- **Top Priority:** Complete core implementation
- **Energy Level:** High
- **Focus Block:** 9:00 AM – 11:30 AM

## Thoughts & Logs
Notes and stream of consciousness throughout the day:

- 

## Evening Gratitude
1. 
2. 
3. 

#journal #reflection`,
  },
  {
    id: "project",
    title: "Project Blueprint",
    description: "Comprehensive spec outlining goals, technical architecture, and milestones.",
    iconName: "Compass",
    defaultTitle: "Project Blueprint: [Name]",
    tags: ["project", "spec"],
    content: `# Project Blueprint: [Name]

## 1. Executive Summary
High-level overview of the project, user persona, and value proposition.

## 2. Technical Architecture
| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| Framework | Next.js App Router | Fast SSR & Turbopack |
| Storage | IndexedDB / LocalStorage | Offline-first privacy |
| UI Tokens | Tailwind CSS & Corners | Blueprint paper aesthetic |

## 3. Milestones & Checklist
- [ ] Phase 1: Prototype core engine
- [ ] Phase 2: Design system tokens & typography
- [ ] Phase 3: Offline persistence & sync
- [ ] Phase 4: Production release

#project #spec`,
  },
  {
    id: "weekly",
    title: "Weekly Review",
    description: "Weekly cadence for celebrating wins, auditing blockers, and setting targets.",
    iconName: "Calendar",
    defaultTitle: "Weekly Review: Week [X]",
    tags: ["review", "productivity"],
    content: `# Weekly Review: Week [X]

## 🏆 Key Wins & Milestones
- Delivered v1 feature set
- Reduced build latency by 40%

## 🚧 Challenges & Learnings
> [!WARNING] Bottleneck Audit
> Review recurring obstacles and root causes.

- What slowed us down this week?
- What process can be simplified?

## 🎯 Next Week's Critical Three
1. 
2. 
3. 

#review #productivity`,
  },
];
