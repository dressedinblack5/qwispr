export interface ASTNode {
  type: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  startIndex: number;
  endIndex: number;
  children: ASTNode[];
  text: string;
  named: boolean;
}

function tokenize(source: string): { type: string; value: string; start: number; end: number }[] {
  const tokens: { type: string; value: string; start: number; end: number }[] = [];
  const lines = source.split('\n');
  let offset = 0;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    let col = 0;
    while (col < line.length) {
      const char = line[col];
      if (/\s/.test(char)) {
        col++;
        continue;
      }
      const start = offset + col;
      if (char === '/' && col + 1 < line.length && line[col + 1] === '/') {
        // Single-line comment
        const end = offset + line.length;
        tokens.push({ type: 'comment', value: line.slice(col), start, end });
        break;
      }
      if (char === '/' && col + 1 < line.length && line[col + 1] === '*') {
        // Multi-line comment (simplified)
        let endCol = col + 2;
        while (endCol < line.length && !(line[endCol] === '*' && line[endCol + 1] === '/')) {
          endCol++;
        }
        endCol += 2;
        const end = offset + endCol;
        tokens.push({ type: 'comment', value: line.slice(col, endCol), start, end });
        col = endCol;
        continue;
      }
      if (char === '"' || char === "'" || char === '`') {
        // String
        const quote = char;
        let endCol = col + 1;
        while (endCol < line.length && line[endCol] !== quote) {
          if (line[endCol] === '\\' && endCol + 1 < line.length) endCol += 2;
          else endCol++;
        }
        endCol++;
        const end = offset + endCol;
        tokens.push({ type: 'string', value: line.slice(col, endCol), start, end });
        col = endCol;
        continue;
      }
      if (/[a-zA-Z_$]/.test(char)) {
        // Identifier/keyword
        let endCol = col + 1;
        while (endCol < line.length && /[a-zA-Z0-9_$]/.test(line[endCol])) endCol++;
        const end = offset + endCol;
        const value = line.slice(col, endCol);
        tokens.push({
          type: /^(const|let|var|function|class|if|else|for|while|return|import|export|from|async|await|try|catch|finally|throw|new|this|super|extends|implements|interface|type|enum|namespace|declare|abstract|private|protected|public|static|readonly|get|set)$/.test(
            value
          )
            ? 'keyword'
            : 'identifier',
          value,
          start,
          end,
        });
        col = endCol;
        continue;
      }
      if (/[0-9]/.test(char)) {
        // Number
        let endCol = col + 1;
        while (endCol < line.length && /[0-9.]/.test(line[endCol])) endCol++;
        const end = offset + endCol;
        tokens.push({ type: 'number', value: line.slice(col, endCol), start, end });
        col = endCol;
        continue;
      }
      // Punctuation/operator
      const end = offset + col + 1;
      tokens.push({ type: 'punctuation', value: char, start, end });
      col++;
    }
    offset += line.length + 1; // +1 for newline
  }
  return tokens;
}

function parseSimple(source: string): ASTNode {
  const tokens = tokenize(source);
  const children: ASTNode[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (
      token.type === 'keyword' &&
      (token.value === 'function' ||
        token.value === 'const' ||
        token.value === 'let' ||
        token.value === 'var')
    ) {
      const start = token.start;
      let end = token.end;
      let j = i + 1;
      while (j < tokens.length && tokens[j].type !== 'punctuation' && tokens[j].value !== ';') j++;
      if (j < tokens.length) end = tokens[j].end;
      children.push({
        type: token.value === 'function' ? 'function_declaration' : 'variable_declaration',
        startPosition: { row: 1, column: 1 },
        endPosition: { row: 1, column: 1 },
        startIndex: start,
        endIndex: end,
        named: true,
        text: source.slice(start, end),
        children: [],
      });
      i = j + 1;
    } else if (
      token.type === 'keyword' &&
      (token.value === 'if' || token.value === 'for' || token.value === 'while')
    ) {
      const start = token.start;
      let end = token.end;
      let j = i + 1;
      while (j < tokens.length && tokens[j].value !== ';') j++;
      if (j < tokens.length) end = tokens[j].end;
      children.push({
        type: token.value + '_statement',
        startPosition: { row: 1, column: 1 },
        endPosition: { row: 1, column: 1 },
        startIndex: start,
        endIndex: end,
        named: true,
        text: source.slice(start, end),
        children: [],
      });
      i = j + 1;
    } else {
      i++;
    }
  }

  return {
    type: 'program',
    startPosition: { row: 0, column: 0 },
    endPosition: { row: source.split('\n').length, column: 0 },
    startIndex: 0,
    endIndex: source.length,
    named: true,
    text: source,
    children,
  };
}

export function parse(source: string, _filePath: string): ASTNode {
  return parseSimple(source);
}

export function getLanguage(filePath: string): 'javascript' | 'typescript' {
  return filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'typescript' : 'javascript';
}
