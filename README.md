# EGCSE Study Room

A static study app for **Mathematics (6880)** and **Physical Science (6888)**, adapted from the MAT442 study room for Mpumelelo Dlamini.

## Open it now
download the code

1. Extract this ZIP.
2. Open **EGCSE-Offline.html** in a modern browser.
3. Choose Mathematics or Physical Science and open a chapter.

The one-file version contains lessons, the equation formatter and question generators. It needs no installation, server, account or API key. Links to original papers, resources and external chats need internet.

For the multi-file version, keep `index.html` and `assets/` together. You can also serve the folder locally with `python3 -m http.server 8000` and open `http://localhost:8000/`.

## Learning flow

Each of the 53 topic guides contains original explanations, a worked example, a common mistake, a practice question with a worked answer, and an explanation question.

- Read the guide and expand the worked example.
- Open its original exam reference, where available, and attempt that question.
- Check the in-app practice question or reveal its working to unlock **Generate similar question**. Opening the teaching example's steps or recording an attempt at the original paper also unlocks it.
- Generate another variant with new values or a different concept example. Answers and steps update together.
- Hover or keyboard-focus an underlined concept for a “Click to learn…” bubble.
- Mark a chapter reviewed and write a short note.

Generation uses built-in mathematical and conceptual templates, without an AI service. Concept question pools are finite and can repeat after several generations. Adjacent generations are checked to be different. Numeric checking accepts decimals, scientific notation and fractions such as `3/4`. Enter the number without units.

## Syllabus edition and coverage

The supplied [Khanyisa syllabus collection](https://www.khanyisa.online/educare/syllabus/form5/) contains the **2024–2026** syllabuses used here. The app labels that edition throughout.

- Mathematics: 24 syllabus topic headings. Core and Extended are labelled; Core has 23 guides because differentiation is Extended only. Basic matrices, vectors and inequality regions are included in Core.
- Physical Science: 14 Chemistry topics and 15 Physics topics, including digital electronics and LED monitors.
- These are guided revision notes with selected worked skills, not a complete textbook or a substitute for the official objectives, teacher instruction or laboratory work. Extended scope notes identify additional material to study.
- For a different examination edition, confirm the applicable syllabus with your teacher.

`CHAPTER-SOURCES.csv` records chapter-to-syllabus and exam-question mappings. References were checked against the original PDFs on 23 September 2026.

## Past papers and question provenance

The directory links nine Mathematics and Physical Science papers from October/November 2020 and 2021 on Khanyisa. Fifty chapters have verified question references, with subject code, paper, session, question and PDF page. A reference targets a relevant skill; it does not claim the paper covers the whole chapter.

No specific question was verified in the selected papers for **P07 Electrostatics, P12 Digital electronics or P15 LEDs**. These chapters still have lessons and original practice, and identify the missing exam reference. No paper numbers have been invented. Teachers can add a reference beneath any chapter and export class references as JSON; students import these under **My progress & notes**.

Original papers open at the publisher. This ZIP does not redistribute exam PDFs or reproduce their full question text. Generated questions and in-app explanations are original teaching material, labelled separately from ECESWA papers. Original-paper mark schemes are not embedded; the app links Khanyisa's marking-scheme collection, whose availability varies by year.

## Add and share PDF papers

1. Open **Past exam papers** and download a suitable paper from Khanyisa, or use a PDF you already have.
2. Add its title, subject code, year and subject. Limits: 20 MB per PDF and 60 MB per collection.
3. The PDFs stay in this browser. They do not automatically appear on another device.
4. Tick papers and select **Download class copy**. The exported HTML contains the complete app and those selected PDFs.
5. Send the HTML to students. They can open it offline, use the generators and open or download the included papers.

The class copy excludes your notes, progress and private AI draft. Custom chapter references have their separate **Download references for class** export.

## AI help and PDF solutions

**Take this question to AI** fills the study desk with the exact generated question. For a scanned exam, type or copy the question, or attach the paper in your external chat.

1. Copy the study prompt.
2. Open your own ChatGPT or Gemini chat and paste it. The app does not send the question or PDF automatically.
3. Paste the response back into the study desk.
4. Format it, check the reasoning and choose **Save solution as PDF**.

Saving PDF opens the browser's print dialog; choose **Save as PDF**. LaTeX is formatted locally. The app does not automatically retrieve a chat response, verify an AI explanation or provide an API-funded AI service.

**Print / PDF** prints the current page. Open any worked steps you want included first. **Question PDF** prints only the current original practice question, its options if applicable, and its answer when revealed.

## Host free on GitHub Pages

This is a static app. A public repository can use GitHub Pages on GitHub Free.

**Simple branch deployment**

1. Use your study-app repository, or create a public repository such as `egcse-study`. Keep your portfolio repository separate.
2. Upload the **extracted contents** of this ZIP. The repository's top level must contain **index.html**, **assets/** and **EGCSE-Offline.html**. Do not upload only the ZIP or leave the app inside an extra folder.
3. In **Settings → Pages**, select **Deploy from a branch**, then **main** and **/(root)**. Save.
4. Wait for deployment, then use the URL shown there.

For username `mpumelelo810` and repository `egcse-study`, the project URL would be:

`https://mpumelelo810.github.io/egcse-study/`

If retaining the repository name `mat442.github.io`, the project URL would be:

`https://mpumelelo810.github.io/mat442.github.io/`

The account root `https://mpumelelo810.github.io/` is a different site. GitHub does not extract uploaded ZIP files. Filename case matters: the entry point is exactly `index.html`.

**GitHub Actions alternative**

The included `.github/workflows/static.yml` supports a manual deployment. Select **GitHub Actions** as the Pages source, then open **Actions → Deploy EGCSE to Pages → Run workflow**. It checks generators and deploys only public files. It does not automatically deploy on every push. Replace an older workflow that still expects MAT442 filenames if choosing this method.

For a class copy with embedded PDFs, publish that exported HTML as `index.html` instead. Its included papers then become publicly downloadable; local-only uploads do not.

GitHub guidance: [Create a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

This package was tested locally, including under a project subpath. It has **not** been uploaded to your GitHub repository or deployed to your live site.

## Progress, editing and tests

Progress and notes use local storage; uploaded papers use IndexedDB. Export a progress backup before changing browsers, clearing browser data or resetting. When saving is blocked, the app shows a warning and still runs for the current visit.

To edit content, change `course_content.py` or `resource_overrides.json`, then run:

```bash
python3 course_content.py
python3 build_offline.py
node --test tests/generators.test.cjs
```

The build recreates `assets/content.js`, `CHAPTER-SOURCES.csv`, `assets/share-template.js` and `EGCSE-Offline.html`. Rebuild after any HTML, CSS, content or JavaScript changes so offline and class copies stay current.

The optional integration suite `tests/browser.cjs` uses Playwright. Set `PLAYWRIGHT_MODULE` to its installed module path and `EGCSE_BROWSER_PATH` to a Chromium executable when needed. `EGCSE_QA_DIR` sets the screenshot/PDF output directory.

KaTeX is included locally under its MIT license, in `assets/vendor/KATEX-LICENSE.txt`. External materials remain with their respective authors and publishers.
