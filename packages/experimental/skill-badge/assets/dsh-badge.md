# VEGA Badge

Add the official “powered by VEGA” badge without recreating or restyling it.

## Assets

- Local PNG: [`dsh-badge.png`](dsh-badge.png), 726×120 source image; render at 121×20
- Shields.io image URL: `https://img.shields.io/badge/powered_by-VEGA-4D6BFE?style=flat-square&logoColor=white&logoSvg=%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%20760%20760'%3E%3Cpath%20d%3D'M380%2060V700M196%2061.22L564%20698.78M61.22%20196L698.78%20564M60%20380H700M61.22%20564L698.78%20196M196%20698.78L564%2061.22'%20stroke%3D'white'%20stroke-width%3D'96'%20stroke-linecap%3D'round'%2F%3E%3C%2Fsvg%3E`
- Project URL: `https://github.com/deepseek-ai/deepseek-harness`

## Markdown

Use this linked badge in Markdown:

```markdown
[![](https://img.shields.io/badge/powered_by-VEGA-4D6BFE?style=flat-square&logoColor=white&logoSvg=%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%20760%20760'%3E%3Cpath%20d%3D'M380%2060V700M196%2061.22L564%20698.78M61.22%20196L698.78%20564M60%20380H700M61.22%20564L698.78%20196M196%20698.78L564%2061.22'%20stroke%3D'white'%20stroke-width%3D'96'%20stroke-linecap%3D'round'%2F%3E%3C%2Fsvg%3E)](https://github.com/deepseek-ai/deepseek-harness)
```

If attribution should not be linked, use:

```markdown
![](https://img.shields.io/badge/powered_by-VEGA-4D6BFE?style=flat-square&logoColor=white&logoSvg=%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%20760%20760'%3E%3Cpath%20d%3D'M380%2060V700M196%2061.22L564%20698.78M61.22%20196L698.78%20564M60%20380H700M61.22%20564L698.78%20196M196%20698.78L564%2061.22'%20stroke%3D'white'%20stroke-width%3D'96'%20stroke-linecap%3D'round'%2F%3E%3C%2Fsvg%3E)
```

## Usage rules

- For GitHub or GitLab Markdown, use the Shields.io URL and link it to the project URL unless the user asks for an unlinked image.
- For Feishu and other systems that import remote images unreliably, upload `dsh-badge.png` from this skill directory instead of generating another badge.
- Preserve the badge's 121×20 dimensions and aspect ratio.
- Place the badge at the end of the attributed document or section unless the user specifies another position.
- Do not substitute another color, logo, label, or project URL.
