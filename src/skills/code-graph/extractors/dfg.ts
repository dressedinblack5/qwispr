import type { ASTNode } from '../parsers/javascript.js';

export interface DFGNode {
  id: number;
  name: string;
  type: 'variable' | 'parameter' | 'function' | 'property';
  scope: number;
  declarationLine: number;
}

export interface DFGEdge {
  from: number;
  to: number;
  type: 'def-use' | 'use-def' | 'call-arg' | 'return-value' | 'property-access';
}

export interface DFG {
  nodes: DFGNode[];
  edges: DFGEdge[];
}

let dfgNodeId = 0;
const varMap = new Map<string, number>();

function newDFGId(): number {
  return dfgNodeId++;
}

export function extractDFG(ast: ASTNode): DFG {
  dfgNodeId = 0;
  varMap.clear();

  const nodes: DFGNode[] = [];
  const edges: DFGEdge[] = [];
  let scopeDepth = 0;

  function getOrCreateVar(name: string, type: DFGNode['type'], line: number): number {
    const key = `${scopeDepth}:${name}`;
    if (!varMap.has(key)) {
      const id = newDFGId();
      varMap.set(key, id);
      nodes.push({ id, name, type, scope: scopeDepth, declarationLine: line });
    }
    return varMap.get(key)!;
  }

  function walk(node: ASTNode, isDeclaration = false) {
    switch (node.type) {
      case 'variable_declarator': {
        const nameNode = node.children.find(c => c.type === 'identifier');
        const valueNode = node.children.find(c => c.type !== 'identifier' && c.type !== '=');
        if (nameNode) {
          getOrCreateVar(nameNode.text, 'variable', nameNode.startPosition.row + 1);
          if (valueNode) walk(valueNode);
        }
        break;
      }

      case 'identifier': {
        if (!isDeclaration) {
          const key = `${scopeDepth}:${node.text}`;
          if (varMap.has(key)) {
            // Use site - could connect to declaration here
          }
        }
        break;
      }

      case 'function_declaration':
      case 'function_expression':
      case 'arrow_function': {
        const funcName = node.children.find(c => c.type === 'identifier')?.text || 'anonymous';
        getOrCreateVar(funcName, 'function', node.startPosition.row + 1);
        scopeDepth++;
        const params = node.children.find(c => c.type === 'formal_parameters');
        if (params) {
          for (const param of params.children) {
            if (param.type === 'identifier') {
              getOrCreateVar(param.text, 'parameter', param.startPosition.row + 1);
            }
          }
        }
        const body = node.children.find(c => c.type === 'block' || c.type === 'statement_block');
        if (body) walk(body);
        scopeDepth--;
        break;
      }

      case 'call_expression': {
        const callee = node.children[0];
        if (callee?.type === 'identifier') {
          getOrCreateVar(callee.text, 'function', callee.startPosition.row + 1);
        }
        const args = node.children.find(c => c.type === 'arguments');
        if (args) {
          for (const arg of args.children) {
            if (arg.named) walk(arg);
          }
        }
        break;
      }

      default:
        for (const child of node.children) {
          if (child.named) walk(child);
        }
    }
  }

  walk(ast);
  return { nodes, edges };
}
