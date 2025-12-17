<type>(<optional scope>): <description>
empty line as separator
<optional body>
empty line as separator
<optional footer>

### Key Rules

Header: Max 100 chars, trimmed.
Line Length: Body and Footer max 100 chars.
Spacing: Blank line required before Body and Footer.

### Types

Here is a compact, strictly defined list optimized for AI context injection. It resolves the overlap between `Build` and `CI` to ensure clear classification.

### Conventional Commit Types

- `feat`: Introduces a new feature or adjusts existing functionality in the API or UI.
- `fix`: Resolves a bug or defect in the API or UI.
- `content`: Updates user-facing text, images, or data resources (distinct from code logic).
- `refactor`: Restructures code for quality or performance without changing external behavior.
- `test`: Adds, updates, or corrects test suites and test data.
- `build`: Modifies build tools, dependencies (package.json), or versioning configuration.
- `ci`: Modifies CI/CD pipelines, infrastructure (Terraform), deployment scripts, or backup procedures.
- `docs`: Modifies documentation files (README, Wiki) and add code comments explanations.
- `chore`: Routine repository maintenance (e.g., .gitignore, linter configs,
  file moves) that does not fit other categories.

### Scopes

The `scope` provides additional contextual information.

- The scope is an **optional** part
- Allowed scopes vary and are typically defined by the specific project
- **Do not** use issue identifiers as scopes

### Breaking Changes Indicator

- A commit that introduce breaking changes **must** be indicated by an `!` before the `:` in the subject line e.g. `feat(api)!: remove status endpoint`
- Breaking changes **should** be described in the [commit footer section](#footer), if the [commit description](#description) isn't sufficiently informative

### Description

The `description` contains a concise description of the change.

- The description is a **mandatory** part
- Use the imperative, present tense: "change" not "changed" nor "changes"
  - Think of `This commit will...` or `This commit should...`
- **Do not** capitalize the first letter
- **Do not** end the description with a period (`.`)
- I case of breaking changes also see [breaking changes indicator](#breaking-changes-indicator)

### Body

The `body` should include the motivation for the change and contrast this with previous behavior.

- The body is an **optional** part
- Use the imperative, present tense: "change" not "changed" nor "changes"

### Footer

The `footer` should contain issue references and informations about **Breaking Changes**

- The footer is an **optional** part, except if the commit introduce breaking changes
- _Optionally_ reference issue identifiers (e.g., `Closes #123`, `Fixes JIRA-456`)
- **Breaking Changes** **must** start with the word `BREAKING CHANGE:`
  - For a single line description just add a space after `BREAKING CHANGE:`
  - For a multi line description add two new lines after `BREAKING CHANGE:`
