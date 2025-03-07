import { NodeType, node_symbol } from "./treeUtils";
const generateRandomId = () => Math.random().toString(36).substring(2, 9);
const generateRandomName = function (level: number, index: number) {
  return `node ${level}-${index}`;
};
const treeLevel: number = 3; // 树的层级
const mockTree = (level: number, parentId: string | null): NodeType[] => {
  if (level <= 0) {
    return [];
  }

  const numChildren = 100;
  const children: NodeType[] = [];

  for (let i = 0; i < numChildren; i++) {
    const nodeId = generateRandomId();
    const nodeName = generateRandomName(treeLevel - level + 1, i + 1);
    const expand = false;
    const childNode: NodeType = {
      [node_symbol]: true,
      nodeId,
      nodeName,
      parentId,
      expand
    };

    childNode.children = mockTree(level - 1, nodeId);
    children.push(childNode);
  }

  return children;
};

export default function generateMockData() {
  const root: NodeType[] = [];
  for (let i = 0; i < 200; i++) {
    const nodeId = generateRandomId();
    const nodeName = generateRandomName(1, i + 1);
    const expand = false;
    const rootNode: NodeType = {
      [node_symbol]: true,
      nodeId,
      nodeName,
      parentId: null,
      expand
    };

    rootNode.children = mockTree(treeLevel - 1, nodeId);
    root.push(rootNode);
  }

  return root;
}
