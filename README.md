<p align="center">
  <img src="public/icon.svg" alt="Scouter" width="80" />
</p>

<h1 align="center">Scouter</h1>

<p align="center">
  <strong>AI-powered job search assistant that finds roles matching your background.</strong>
</p>

<p align="center">
  Upload your resume, get personalized job matches, and generate custom cover letters.
</p>

<p align="center">
  <a href="https://github.com/agenisea/scouter"><strong>→ View on GitHub</strong></a>
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| **Resume Analysis** | AI-powered parsing extracts skills, experience, tech stack, and job history |
| **Smart Matching** | Transparent, evidence-based fit scores (0-100) with detailed rationale |
| **Cover Letters** | Customized drafts for each role using your personal template |
| **Privacy First** | Your resume stays on your device. We never store your personal data. |
| **Markdown Export** | Download results as markdown for easy reference and application tracking |

---

## How It Works

1. **Upload Resume** - Drop in your resume (PDF, TXT, or MD). AI parses your skills and experience.
2. **Configure Search** - Set target roles, locations, work preferences, and salary range.
3. **Get Scored Matches** - Each job receives a transparent fit score with matched/missing skills analysis.
4. **Download & Apply** - Get custom cover letters for top matches. Export everything as markdown.

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 10+

### Setup

```bash
# Clone the repository
git clone https://github.com/agenisea/scouter.git
cd scouter

# Install dependencies
pnpm install

# Copy environment template
cp .env.local.example .env.local

# Add your API keys to .env.local
# Then start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file with:

```bash
# Required: OpenAI API key for resume parsing, fit analysis, and cover letter generation
OPENAI_API_KEY=sk-...

# Required: RapidAPI key for JSearch job aggregation
RAPIDAPI_KEY=...

# Optional: Comma-separated list of job sites to ignore
IGNORED_JOB_SITES=
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

---

## Using Default Files

You can place default files in the project root to skip wizard steps:

### RESUME.pdf

Place your resume as `RESUME.pdf` in the project root. The app will automatically detect and use it.

### COVER_LETTER_TEMPLATE.md

Place your cover letter template as `COVER_LETTER_TEMPLATE.md` in the project root for generating personalized cover letters.

```
scouter/
├── RESUME.pdf                 <-- Your resume
├── COVER_LETTER_TEMPLATE.md   <-- Your template
├── package.json
└── ...
```

---

## Cover Letter Template

The template uses placeholders that get filled in by AI:

```markdown
Dear Hiring Team,

I'm excited to apply for the {{ROLE_TITLE}} at {{COMPANY_NAME}} {{OPENING_HOOK}}

{{EXPERIENCE_HIGHLIGHT_1}}

{{EXPERIENCE_HIGHLIGHT_2}}

{{SKILLS_BRIDGE}}

{{CLOSING}}

Sincerely,
{{CANDIDATE_NAME}}
```

### Available Placeholders

| Placeholder | Description |
|-------------|-------------|
| `{{COMPANY_NAME}}` | Target company name |
| `{{ROLE_TITLE}}` | Job title being applied for |
| `{{OPENING_HOOK}}` | Why this role/company excites you |
| `{{EXPERIENCE_HIGHLIGHT_1}}` | Primary relevant experience |
| `{{EXPERIENCE_HIGHLIGHT_2}}` | Secondary experience or projects |
| `{{SKILLS_BRIDGE}}` | Your approach/philosophy |
| `{{CLOSING}}` | Role-specific value proposition |
| `{{CANDIDATE_NAME}}` | Your name |

---

## Fit Scoring

Each job receives scores (0-100) across four dimensions:

| Dimension | What it measures |
|-----------|------------------|
| **Skills Match** | Required skills you have vs. missing |
| **Experience Match** | Relevant work history alignment |
| **Tech Stack Match** | Technologies/tools overlap |
| **Seniority Fit** | Level alignment (junior/mid/senior/staff) |

### Score Guidelines

| Score | Meaning |
|-------|---------|
| 90-100 | Exceptional fit, exceeds requirements |
| 80-89 | Strong fit, meets all key requirements |
| 70-79 | Good fit, meets most requirements |
| 60-69 | Moderate fit, some gaps |
| Below 60 | Weak fit, significant gaps |

---

## Privacy

- **No server storage** - Resume and template are cached in browser localStorage only
- **Transient processing** - Files sent to APIs for analysis are not persisted
- **No tracking** - Beyond basic Vercel Analytics for page views
- **Local results** - Search results saved in localStorage, not on servers

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI**: Vercel AI SDK + OpenAI GPT-4o-mini
- **Jobs API**: JSearch (via RapidAPI)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State**: React Context + localStorage

---

## Architecture

### Pipeline

```
Resume Upload → Parse → Search Jobs → Analyze Fit → Generate Cover Letters → Export
```

### API Routes

| Route | Purpose |
|-------|---------|
| `/api/parse-resume` | Extract profile from resume |
| `/api/search-jobs` | Search JSearch API for listings |
| `/api/analyze-fit` | Score job fit with rationale |
| `/api/generate-cover-letter` | Create personalized cover letter |
| `/api/defaults` | Check for default files |

### Job Sources

JSearch aggregates listings from Indeed, LinkedIn, Glassdoor, ZipRecruiter, Monster, and Wellfound.

---

## Contributing

Issues and pull requests are welcome.

---

## License

This project is released under the [MIT License](https://opensource.org/licenses/MIT).

---

*Built by [Agenisea™](https://agenisea.ai)*

---

© 2026 Patrick Peña / Agenisea™.
All text and original written content is protected by copyright.
