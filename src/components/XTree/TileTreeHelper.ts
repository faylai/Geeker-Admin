import type { NodeType } from "./treeUtils";
import { LinkedList } from "./LinkedList";
import { downNodeDeepByDeep } from "./treeUtils";
import { throttle } from "lodash";
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
  $scrollEl: HTMLElement;
  $tileContainer: HTMLElement;
  listTileHelper: ListTileHelper = new ListTileHelper(0, 0, 0);
  lastTileViewConfig: TileViewConfig = { startIndex: 0, endIndex: 0 };
  lastLinkedListVisibleRange: NodeTypeExtra[] = new Array<NodeTypeExtra>();
  onScrollElScrollThrottler: () => void = function () {};
  onTileContainerClickBinder: (event: MouseEvent) => void = function () {};
  tileClass: string = "";
  _isDestroyed: boolean = false;

  constructor(args: {
    treeData: NodeType[];
    tileHeight: number;
    tileClass?: string;
    $scrollEl: HTMLElement;
    $tileContainer: HTMLElement;
  }) {
    this.viewHeight = args.$tileContainer.offsetHeight;
    this.tileHeight = args.tileHeight;
    this.$scrollEl = args.$scrollEl;
    this.$tileContainer = args.$tileContainer;
    this.tileClass = args.tileClass || "";
    this.initLinkedList(args.treeData);
    this.onVisibleTileSizeChange();
    this.initDomEvents();
    this.render();
  }

  private onVisibleTileSizeChange() {
    this.$tileContainer.style.height = [this.linkedList.size() * this.tileHeight, "px"].join("");
    this.listTileHelper = new ListTileHelper(this.linkedList.size(), this.viewHeight, this.tileHeight);
  }

  private onTileContainerClick(event: MouseEvent) {
    if (event.target) {
      let block = event.target as HTMLDivElement;
      if (block.hasAttribute("data-node-index")) {
        let index = Number(block.getAttribute("data-node-index"));
        this.toggleTileNodeExpand(index);
        this.onVisibleTileSizeChange();
        this.render();
      }
    }
  }

  private onScrollElScroll() {
    this.render();
  }

  private initDomEvents() {
    this.onTileContainerClickBinder = this.onTileContainerClick.bind(this);
    this.$tileContainer.addEventListener("click", this.onTileContainerClickBinder);
    this.onScrollElScrollThrottler = throttle(this.onScrollElScroll.bind(this), 200);
    this.$scrollEl.addEventListener("scroll", this.onScrollElScrollThrottler);
  }

  private initLinkedList(treeData: NodeType[]) {
    downNodeDeepByDeep(treeData, (node, parent, level) => {
      if (isNodeVisible(node, parent)) {
        this.linkedList.append(createNodeExtra(node, parent, level));
        return true;
      }
      return node.expand;
    });
  }

  createTileDom(node: NodeTypeExtra): HTMLElement {
    let tileDom: HTMLDivElement = document.createElement("div") as HTMLDivElement;
    let expandible = node.raw.children && node.raw.children.length > 0;
    let arrow = node.raw.expand === false && expandible ? "&gt" : "O";
    let directChildrenSize = expandible ? node.raw.children?.length : 0;
    tileDom.className = this.tileClass;
    tileDom.innerHTML = `${arrow}--${node.raw.nodeName} (${directChildrenSize})`;
    return tileDom;
  }

  render() {
    console.time("渲染大量节点");
    let fragment = document.createDocumentFragment();
    const { startIndex, tiles } = this.getTiles(this.$scrollEl.scrollTop);
    for (let index = 0; index < tiles.length; index++) {
      const node = tiles[index];
      const element: HTMLElement = this.createTileDom(node);
      let tileViewIndex = startIndex + index;
      element.style.top = [tileViewIndex * this.tileHeight, "px"].join("");
      element.style.paddingLeft = [node.level * 20, "px"].join("");
      element.style.height = [this.tileHeight, "px"].join("");
      element.style.position = "absolute";
      element.setAttribute("data-node-index", String(index));
      fragment.appendChild(element);
    }
    this.$tileContainer.innerHTML = "";
    this.$tileContainer.appendChild(fragment);
    console.timeEnd("渲染大量节点");
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
  }
  destroyed() {
    this._isDestroyed = true;
    this.$tileContainer.removeEventListener("click", this.onTileContainerClickBinder);
    this.$scrollEl.removeEventListener("scroll", this.onScrollElScrollThrottler);
  }
}
