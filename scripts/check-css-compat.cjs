const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'src');
const styleFilePattern = /\.(css|scss|less)$/;

const unsupportedRules = [
  {
    name: 'CSS container queries',
    pattern: /@container\b/g,
    message: 'Chrome 60 does not support CSS container queries.',
  },
  {
    name: 'CSS cascade layers',
    pattern: /@layer\b/g,
    message: 'Chrome 60 does not support CSS cascade layers.',
  },
  {
    name: ':has selector',
    pattern: /:has\s*\(/g,
    message: 'Chrome 60 does not support the :has() selector.',
  },
  {
    name: ':is selector',
    pattern: /:is\s*\(/g,
    message: 'Chrome 60 does not support the :is() selector.',
  },
  {
    name: ':where selector',
    pattern: /:where\s*\(/g,
    message: 'Chrome 60 does not support the :where() selector.',
  },
  {
    name: ':focus-visible selector',
    pattern: /:focus-visible\b/g,
    message: 'Chrome 60 does not support the :focus-visible selector.',
  },
  {
    name: 'CSS subgrid',
    pattern: /\bsubgrid\b/g,
    message: 'Chrome 60 does not support CSS subgrid.',
  },
  {
    name: 'CSS color-mix',
    pattern: /\bcolor-mix\s*\(/g,
    message: 'Chrome 60 does not support color-mix().',
  },
  {
    name: 'Modern CSS color functions',
    pattern: /\b(?:lab|lch|oklab|oklch)\s*\(/g,
    message: 'Chrome 60 does not support lab(), lch(), oklab(), or oklch() colors.',
  },
  {
    name: 'CSS math functions',
    pattern: /\b(?:min|max|clamp)\s*\(/g,
    message: 'Chrome 60 does not support CSS min(), max(), or clamp().',
  },
  {
    name: 'Modern viewport units',
    pattern: /(?:^|[^-\w.])(?:\d*\.?\d+)(?:svh|svw|lvh|lvw|dvh|dvw|vi|vb)\b/g,
    message: 'Use Chrome 60-safe viewport units. Avoid svh/svw/lvh/lvw/dvh/dvw/vi/vb.',
  },
  {
    name: 'CSS logical margin properties',
    pattern: /\bmargin-(?:inline|block)(?:-(?:start|end))?\b/g,
    message: 'Chrome 60 does not reliably support margin-inline/margin-block. Use margin-left/right/top/bottom.',
  },
  {
    name: 'CSS logical padding properties',
    pattern: /\bpadding-(?:inline|block)(?:-(?:start|end))?\b/g,
    message: 'Chrome 60 does not reliably support padding-inline/padding-block. Use padding-left/right/top/bottom.',
  },
  {
    name: 'CSS logical layout properties',
    pattern: /\b(?:border|inset)-(?:inline|block)(?:-(?:start|end))?\b|\b(?:inline-size|block-size|min-inline-size|max-inline-size|min-block-size|max-block-size)\b/g,
    message: 'Chrome 60 has incomplete support for CSS logical properties. Use physical fallbacks.',
  },
  {
    name: 'Media query range syntax',
    pattern: /@media[^{]*(?:[<>=]=?|=\s*)[^{]*\)/g,
    message: 'Chrome 60 does not support modern media query range syntax. Use min-width/max-width style queries.',
  },
];

function listStyleFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listStyleFiles(fullPath));
    } else if (entry.isFile() && styleFilePattern.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function maskCommentsAndStrings(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\r\n]/g, ' '))
    .replace(/(["'])(?:\\.|(?!\1)[\s\S])*\1/g, (match) =>
      match.replace(/[^\r\n]/g, ' '),
    );
}

function getLocation(content, index) {
  const before = content.slice(0, index);
  const lines = before.split(/\r\n|\r|\n/);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

const violations = [];

for (const file of listStyleFiles(sourceDir)) {
  const content = fs.readFileSync(file, 'utf8');
  const searchableContent = maskCommentsAndStrings(content);

  for (const rule of unsupportedRules) {
    rule.pattern.lastIndex = 0;

    let match;
    while ((match = rule.pattern.exec(searchableContent)) !== null) {
      const location = getLocation(searchableContent, match.index);
      violations.push({
        file,
        line: location.line,
        column: location.column,
        rule: rule.name,
        message: rule.message,
      });
    }
  }
}

if (violations.length > 0) {
  console.error('CSS compatibility check failed for Chrome 60:\n');
  for (const violation of violations) {
    const relativePath = path.relative(rootDir, violation.file);
    console.error(
      `${relativePath}:${violation.line}:${violation.column} - ${violation.rule}: ${violation.message}`,
    );
  }
  console.error(
    '\nUpdate the CSS to a Chrome 60-compatible pattern or add a conservative fallback.',
  );
  process.exit(1);
}

console.log('CSS compatibility check passed for Chrome 60.');
