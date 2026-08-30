import type { ASTNode } from '../parsers/javascript.js';

export interface CFGNode {
  id: number;
  type: 'entry' | 'exit' | 'block' | 'condition' | 'call' | 'return' | 'throw';
  startLine: number;
  endLine: number;
  text: string;
  meta?: Record<string, unknown>;
}

export interface CFGEdge {
  from: number;
  to: number;
  type: 'sequential' | 'branch-true' | 'branch-false' | 'call' | 'return' | 'exception' | 'loop';
  label?: string;
}

export interface CFG {
  nodes: CFGNode[];
  edges: CFGEdge[];
}

let nodeId = 0;

function newId(): number {
  return nodeId++;
}

export function extractCFG(ast: ASTNode): CFG {
  nodeId = 0;
  const nodes: CFGNode[] = [];
  const edges: CFGEdge[] = [];

  const entryId = newId();
  nodes.push({ id: entryId, type: 'entry', startLine: 1, endLine: 1, text: 'ENTRY' });

  const exitId = newId();
  nodes.push({ id: exitId, type: 'exit', startLine: 1, endLine: 1, text: 'EXIT' });

  function addBlock(node: ASTNode, isConditional = false): number {
    const id = newId();
    nodes.push({
      id,
      type: isConditional ? 'condition' : 'block',
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1,
      text: node.text.slice(0, 80).replace(/\n/g, ' '),
      meta: { nodeType: node.type },
    });
    return id;
  }

  function getChild(node: ASTNode, index: number): ASTNode | null {
    return node.children[index] ?? null;
  }

  function walk(node: ASTNode, parentId: number): number {
    let currentId = parentId;

    switch (node.type) {
      case 'program':
      case 'block':
        for (const child of node.children) {
          currentId = walk(child, currentId);
        }
        break;

      case 'if_statement': {
        const condNode = getChild(node, 0);
        const consequentNode = getChild(node, 1);
        const elseNode = getChild(node, 2);

        if (!condNode || !consequentNode) break;

        const condId = addBlock(condNode, true);
        edges.push({ from: currentId, to: condId, type: 'sequential' });

        const consequentId = addBlock(consequentNode);
        edges.push({ from: condId, to: consequentId, type: 'branch-true' });
        walk(consequentNode, consequentId);

        let afterIfId = consequentId;
        if (elseNode?.type === 'else_clause') {
          const altChild = getChild(elseNode, 0);
          if (altChild) {
            const altId = addBlock(altChild);
            edges.push({ from: condId, to: altId, type: 'branch-false' });
            walk(altChild, altId);
            afterIfId = altId;
          }
        } else {
          edges.push({ from: condId, to: exitId, type: 'branch-false' });
        }
        currentId = afterIfId;
        break;
      }

      case 'while_statement':
      case 'for_statement':
      case 'for_in_statement':
      case 'for_of_statement': {
        const condNode = getChild(node, 0);
        const bodyNode = getChild(node, 1);
        if (!condNode || !bodyNode) break;

        const loopCondId = addBlock(condNode, true);
        edges.push({ from: currentId, to: loopCondId, type: 'sequential' });

        const loopBodyId = addBlock(bodyNode);
        edges.push({ from: loopCondId, to: loopBodyId, type: 'branch-true' });
        walk(bodyNode, loopBodyId);

        edges.push({ from: loopBodyId, to: loopCondId, type: 'loop' });
        edges.push({ from: loopCondId, to: exitId, type: 'branch-false' });
        currentId = loopCondId;
        break;
      }

      case 'function_declaration':
      case 'function_expression':
      case 'arrow_function':
      case 'method_definition': {
        const funcId = addBlock(node);
        edges.push({ from: currentId, to: funcId, type: 'call' });
        const bodyNode = node.children.find(
          c => c.type === 'block' || c.type === 'statement_block'
        );
        if (bodyNode) {
          walk(bodyNode, funcId);
        }
        currentId = funcId;
        break;
      }

      case 'return_statement': {
        const retId = addBlock(node);
        nodes[retId] = { ...nodes[retId], type: 'return' };
        edges.push({ from: currentId, to: retId, type: 'return' });
        edges.push({ from: retId, to: exitId, type: 'sequential' });
        currentId = retId;
        break;
      }

      case 'throw_statement': {
        const throwId = addBlock(node);
        nodes[throwId] = { ...nodes[throwId], type: 'throw' };
        edges.push({ from: currentId, to: throwId, type: 'exception' });
        currentId = throwId;
        break;
      }

      case 'call_expression': {
        const callId = addBlock(node);
        nodes[callId] = { ...nodes[callId], type: 'call' };
        edges.push({ from: currentId, to: callId, type: 'call' });
        currentId = callId;
        break;
      }

      case 'expression_statement': {
        const firstChild = getChild(node, 0);
        if (firstChild?.type === 'call_expression') {
          return walk(firstChild, currentId);
        }
        // Fall through
      }
      default: {
        for (const child of node.children) {
          if (child.named) {
            currentId = walk(child, currentId);
          }
        }
      }
    }

    return currentId;
  }

  walk(ast, entryId);
  edges.push({ from: entryId, to: exitId, type: 'sequential' });

  return { nodes, edges };
}
