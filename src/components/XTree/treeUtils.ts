export const node_symbol: unique symbol = Symbol("node_symbol");
import { isObject } from "./common";

export type NodeType = {
  [node_symbol]: boolean;
  nodeId: string;
  nodeName: string;
  parentId: string | null;
  expand: boolean;
  children?: NodeType[];
  [key: string]: any;
};

export type HTMLElementWithUnmount = {
  el: HTMLElement;
  unmount?: () => void;
};

export type NodeTypeExtra = {
  raw: NodeType;
  level: number;
  parent: NodeType | null;
  checkState: 0 | 1 | 2;
};

export function createProxy<T extends NodeType | NodeType[] = NodeType | NodeType[]>(obj: T): T {
  let handler = {
    get(target: any, key: PropertyKey, receiver: any) {
      let ret = Reflect.get(target, key, receiver);
      //代理 NodeType 数组其他的忽略
      if (Array.isArray(ret) && (receiver as NodeType).hasOwnProperty(node_symbol) && key == "children") {
        return createProxy(ret as T);
      } else if (isObject(ret) && (ret as NodeType).hasOwnProperty(node_symbol)) {
        //代理 NodeType 其他的忽略
        return createProxy(ret as T);
      } else {
        return ret;
      }
    },
    set(target: any, p: string | symbol, value: any, receiver: any): boolean {
      traceSetter(p, value, receiver);
      return Reflect.set(target, p, value, receiver);
    },
    apply(target: any, thisArg: any, args: any[]): any {
      return Reflect.apply(target, thisArg, args);
    }
  };
  return new Proxy<T>(obj as T, handler);
}

function traceSetter(p: string | symbol, value: any, receiver: any) {
  if (receiver.hasOwnProperty(node_symbol)) {
    console.log("----->");
    console.log("set ", p, " value:", value);
  }
}

/**
 * 按照金字塔层级一层一层遍历树
 * @param node 根节点
 * @param visitor 访问者
 */
export function downNodeAtSameLevel<T extends NodeType | NodeType[] = NodeType | NodeType[]>(
  node: T,
  visitor: (node: NodeType) => boolean
) {
  let children: NodeType[] = Array.isArray(node) ? node : [node];
  while (children && children.length > 0) {
    let subChildren: NodeType[] = [];
    children.forEach(subNode => {
      const returnFalse = visitor(subNode) === false;
      if (Array.isArray(subNode.children) && !returnFalse) {
        subChildren = subChildren.concat(subNode.children);
      }
    });
    if (subChildren.length > 0) {
      children = subChildren;
    } else {
      break;
    }
  }
}

export type TreeVisitor = (node: NodeType, parent: NodeType | null, level: number) => boolean;

function _downNodeDeepByDeep(node: NodeType[], parentNode: NodeType | null, level: number, visitor: TreeVisitor) {
  node.forEach(subNode => {
    const returnFalse = visitor(subNode, parentNode, level) === false;
    if (Array.isArray(subNode.children) && !returnFalse) {
      _downNodeDeepByDeep(subNode.children, subNode, level + 1, visitor);
    }
  });
}

export function downNodeDeepByDeep(node: NodeType[], visitor: TreeVisitor) {
  let children: NodeType[] = Array.isArray(node) ? node : [node];
  _downNodeDeepByDeep(children, null, 0, visitor);
}
