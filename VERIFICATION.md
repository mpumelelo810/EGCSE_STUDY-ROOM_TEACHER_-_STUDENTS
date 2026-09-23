# Verification — 23 September 2026

Tested locally in Chromium 133 using Playwright. No prompts were sent to external AI services.

- All 53 chapters render without script errors or equation-formatting fallbacks.
- Core/Extended Mathematics, Chemistry/Physics filters and chapter search work.
- 26,500 variants pass answer-shape and checker tests. Independent checks cover percentages, cuboids, trigonometry, bearings, burettes, moles, energy, series/parallel resistance, half-lives and logic gates.
- Checking, unlocking, regeneration, changed answers, worked explanations and note persistence work.
- Hover/focus refresher tooltips appear and dismiss with Escape.
- Teacher references and progress export work; private notes are excluded from reference exports.
- AI handoff includes the right subject, edition and question. LaTeX renders locally; pasted HTML is escaped.
- PDF upload, persistence after reload and downloaded bytes were checked.
- A freshly opened class copy works offline with its PDF and generator. Private progress and AI drafts are excluded.
- Screens were checked at 320, 390 and 1440 pixels without page overflow. Representative screenshots were visually inspected.
- Question and AI solution printouts were checked as one-page A4 PDFs. Visual inspection found a final-answer rounding inconsistency, which was fixed.
- Project-subpath hosting and blocked-browser-storage fallback were exercised.
- No external network requests occurred during the integration suite; external resources load only when followed.

Limits: no live GitHub deployment was performed. External links can change. This is a curriculum-based revision app with selected examples, not certification of complete syllabus coverage or an official marking scheme. See README and CHAPTER-SOURCES.csv for scope and the three chapters without a verified original-paper question.
