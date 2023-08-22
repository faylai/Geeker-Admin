import type { NodeType } from "./treeUtils";
import { LinkedList } from "./LinkedList";
import { downNodeDeepByDeep } from "./treeUtils";

export type TileViewConfig = {
  startIndex: number;
  endIndex: number;
};
const tileExtraSize = 3; // 前后多余显示元素个数
export class ListTileHelper {
  dataSize: number;
  blockHeight: number;
  viewHeight: number;

  constructor(dataSize: number, viewHeight: number, blockHeight: number) {
    this.dataSize = dataSize;
    this.viewHeight = viewHeight;
    this.blockHeight = blockHeight;
  }

  getDisplayIndexes(scrollTop: number) {
    let startIndex = Math.ceil(scrollTop / this.blockHeight);
    let endIndex = Math.ceil((scrollTop + this.viewHeight) / this.blockHeight);
    startIndex = Math.max(0, startIndex - tileExtraSize);
    endIndex = Math.min(this.dataSize - 1, endIndex + tileExtraSize);
    return { startIndex, endIndex };
  }
}

type NodeTypeExtra = {
  raw: NodeType;
  level: number;
  parent: NodeType | null;
  checkState: 0 | 1 | 2;
};

function createNodeExtra(node: NodeType, parent: NodeType | null, level: number): NodeTypeExtra {
  return {
    raw: node,
    level,
    parent,
    checkState: 0
  };
}

function isNodeVisible(node: NodeType, parent: NodeType | null): boolean {
  if (parent === null) {
    return true;
  } else if (parent.expand || node.expand) {
    return true;
  }
  return false;
}

export class TileTreeHelper {
  linkedList: LinkedList<NodeTypeExtra> = new LinkedList<NodeTypeExtra>();
  viewHeight: number = 200;
  tileHeight: number = 30;
  listTileHelper: ListTileHelper = new ListTileHelper(0, 0, 0);
  lastTileViewConfig: TileViewConfig = { startIndex: 0, endIndex: 0 };
  lastLinkedListVisibleRange: NodeTypeExtra[] = new Array<NodeTypeExtra>();

  constructor(treeData: NodeType[], viewHeight: number, tileHeight: number) {
    this.viewHeight = viewHeight;
    this.tileHeight = tileHeight;
    this.initLinkedList(treeData);
  }

  private initListTileHelper(size: number) {
    this.listTileHelper = new ListTileHelper(size, this.viewHeight, this.tileHeight);
  }

  private initLinkedList(treeData: NodeType[]) {
    downNodeDeepByDeep(treeData, (node, parent, level) => {
      if (isNodeVisible(node, parent)) {
        this.linkedList.append(createNodeExtra(node, parent, level));
        return true;
      }
      return node.expand;
    });
    this.initListTileHelper(this.linkedList.size());
  }

  getTiles(scrollTop: number): { startIndex: number; tiles: NodeTypeExtra[] } {
    let lastTileViewConfig = this.lastTileViewConfig;
    let lastLinkedListVisibleRange = this.lastLinkedListVisibleRange;
    let config = (this.lastTileViewConfig = this.listTileHelper.getDisplayIndexes(scrollTop));
    this.lastLinkedListVisibleRange = this.linkedList.getRange(
      config.startIndex,
      config.endIndex,
      lastLinkedListVisibleRange.length > 0
        ? {
            startNode: lastLinkedListVisibleRange[0],
            startIndex: lastTileViewConfig.startIndex
          }
        : undefined
    );
    return { startIndex: config.startIndex, tiles: this.lastLinkedListVisibleRange };
  }

  toggleTileNodeExpand(tileIndex: number) {
    let tileNode = this.lastLinkedListVisibleRange[tileIndex];
    tileNode.raw.expand = !tileNode.raw.expand;
    if (tileNode.raw.children && tileNode.raw.children.length > 0) {
      if (tileNode.raw.expand) {
        this.linkedList.insertBatchAfter(
          tileNode,
          tileNode.raw.children.map(node => createNodeExtra(node, tileNode.raw, tileNode.level + 1))
        );
      } else {
        let deleteList = new Array<NodeType>();
        downNodeDeepByDeep(tileNode.raw.children || [], (node, parent) => {
          if (isNodeVisible(node, parent)) {
            deleteList.push(node);
          }
          return node.expand;
        });
        deleteList.forEach(node => {
          node.expand = false;
        });
        this.linkedList.deleteNodeNext(tileNode, deleteList.length);
      }
    } else {
      // do nothing with no child node
    }
    this.initListTileHelper(this.linkedList.size());
  }
}
