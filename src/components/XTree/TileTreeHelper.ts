import type { NodeType, NodeTypeExtra } from "./treeUtils";
import { LinkedList } from "./LinkedList";
import { downNodeDeepByDeep } from "./treeUtils";
import { throttle } from "lodash";

export type HTMLElementWithUnmount = {
  unmount: () => void;
} & HTMLElement;

export type TileViewConfig = {
  startIndex: number;
  endIndex: number;
};
const tileExtraSize = 3; // 前后多余显示tile的个数越多滚动视觉平滑度越好，但是有性能上的稍微损失
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

function createELByTags(tags: string): HTMLElement {
  let div: HTMLElement = document.createElement("div");
  div.innerHTML = tags;
  return div.firstElementChild as HTMLElement;
}

function findAttributeToUp(node: HTMLElement, attributeName: string, stopEl?: HTMLElement): string | null {
  let currentNode: HTMLElement | null = node;
  while (currentNode !== null && currentNode !== (stopEl || document.body)) {
    if (currentNode.hasAttribute(attributeName)) {
      return currentNode.getAttribute(attributeName);
    }
    currentNode = currentNode.parentElement;
  }
  return null;
}

// 用于树的事件点击后，重新找到对于的数据对象
const dataTileNodeIndex: string = "data-tile-node-index";

export class TileTreeHelper {
  // 存放把树拍平数据结构，能够很好的快速插入展开的节点，由于是滚动向前或者向后，查询的效率也非常的高
  linkedList: LinkedList<NodeTypeExtra> = new LinkedList<NodeTypeExtra>();
  // 这个树的可视高度
  viewHeight: number = 200;
  // 树的节点默认高度也就是瓦片的高度
  tileHeight: number = 30;
  //滚动条所处的dom
  $scrollEl: HTMLElement;
  //存放瓦片的容器
  $tileContainer: HTMLElement;
  // 计算列表滚动显示那些瓷砖的帮助类
  listTileHelper: ListTileHelper = new ListTileHelper(0, 0, 0);
  // 缓存上次一显示那些瓷砖的数据（只有下标）
  lastTileViewConfig: TileViewConfig = { startIndex: 0, endIndex: 0 };
  // 缓存上次一显示那些瓷砖的 NodeTypeExtra 数据
  lastLinkedListVisibleRange: NodeTypeExtra[] = new Array<NodeTypeExtra>();
  // 缓存上次 scrollTop 用来判断是向前或者向后滚动
  lastScrollTop: number = 0;
  //滚动时候的节流控制方法
  onScrollElScrollThrottler: () => void = function () {};
  //树节点点击时候的处理方法
  onTileContainerClickBinder: (event: MouseEvent) => void = function () {};
  //自定义渲染树节点的方法
  tileDomCreator: ((node: NodeTypeExtra) => HTMLElementWithUnmount) | undefined = undefined;
  // 树节点额外的样式
  tileClass: string = "";
  _isDestroyed: boolean = false;
  //外部web 相应框架创建的dom 收集器，用来销毁事件的绑定
  outerFrameDoms: HTMLElementWithUnmount[] = [];

  constructor(args: {
    treeData: NodeType[];
    tileHeight: number;
    tileClass?: string;
    $scrollEl: HTMLElement;
    $tileContainer: HTMLElement;
    tileDomCreator?: (node: NodeTypeExtra) => HTMLElementWithUnmount;
  }) {
    this.viewHeight = args.$tileContainer.offsetHeight;
    this.tileHeight = args.tileHeight;
    this.$scrollEl = args.$scrollEl;
    this.$tileContainer = args.$tileContainer;
    this.tileClass = args.tileClass || "";
    this.tileDomCreator = args.tileDomCreator;
    this.initLinkedList(args.treeData);
    this.onVisibleTileSizeChange();
    this.initDomEvents();
    this.render();
  }

  /**
   * 如果可显示数据变化需要同步修改 $tileContainer 容器的大小和列表瓦片帮助类
   */
  private onVisibleTileSizeChange() {
    this.$tileContainer.style.height = [this.linkedList.size() * this.tileHeight, "px"].join("");
    this.listTileHelper = new ListTileHelper(this.linkedList.size(), this.viewHeight, this.tileHeight);
  }

  private onTileContainerClick(event: MouseEvent) {
    if (event.target) {
      let block = event.target as HTMLDivElement;
      let nodeDataIndexValue = findAttributeToUp(block, dataTileNodeIndex, this.$tileContainer);
      if (nodeDataIndexValue !== null) {
        let index = Number(nodeDataIndexValue);
        this.toggleTileNodeExpand(index);
        this.onVisibleTileSizeChange();
        this.render();
      }
    }
  }

  private onScrollElScroll() {
    let lastScrollTop = this.lastScrollTop;
    if (this.$scrollEl.scrollTop !== lastScrollTop) {
      this.render();
      this.lastScrollTop = this.$scrollEl.scrollTop;
    }
  }

  /**
   * 绑定dom 事件，只能调用一次，请不要重复调用
   */
  private initDomEvents() {
    this.onTileContainerClickBinder = this.onTileContainerClick.bind(this);
    this.$tileContainer.addEventListener("click", this.onTileContainerClickBinder);
    this.onScrollElScrollThrottler = throttle(this.onScrollElScroll.bind(this), 200);
    this.$scrollEl.addEventListener("scroll", this.onScrollElScrollThrottler);
  }

  /**
   *深度遍历树结构，转换成为滑动的链表形式
   * @param treeData 树形数据
   */
  private initLinkedList(treeData: NodeType[]) {
    downNodeDeepByDeep(treeData, (node, parent, level) => {
      if (isNodeVisible(node, parent)) {
        this.linkedList.append(createNodeExtra(node, parent, level));
        return true;
      }
      return node.expand;
    });
  }

  /**
   * 创建树节点的dom
   * @param node 节点数据
   * @returns dom
   */
  createTileDom(node: NodeTypeExtra): HTMLElement {
    let tileDom: HTMLElement = document.createElement("div") as HTMLElement;
    let expandable = node.raw.children && node.raw.children.length > 0;
    let arrow = !node.raw.expand && expandable ? "&gt" : "O";
    let directChildrenSize = expandable ? node.raw.children?.length : 0;
    tileDom.className = [tileDom.className, this.tileClass].join(" ");
    tileDom.appendChild(createELByTags(`<div style="width:24px;text-align:right;">${arrow}&nbsp;</div>`));
    let nodeNameDom: HTMLElement = createELByTags(`<div style="flex:1"></div>`);
    tileDom.appendChild(nodeNameDom);
    if (this.tileDomCreator !== undefined) {
      let outerFrameDom = this.tileDomCreator(node);
      this.outerFrameDoms.push(outerFrameDom);
      nodeNameDom.appendChild(outerFrameDom);
    } else {
      nodeNameDom.appendChild(createELByTags(`<div> --${node.raw.nodeName} (${directChildrenSize})</div>`));
    }
    return tileDom;
  }

  /**
   * 树的整体渲染方法
   */
  render() {
    console.time("渲染大量节点");
    // 树节点创建新的之前备份下需要销毁的节点
    let outerFrameDomArray = this.outerFrameDoms;
    this.outerFrameDoms = [];
    // 利用 fragment 进行批量插入节约时间
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
      element.setAttribute(dataTileNodeIndex, String(index));
      fragment.appendChild(element);
    }
    this.$tileContainer.innerHTML = "";
    // 如果是框架的slot 渲染的需要主动调用 unmount 的方法
    this.destroyTreeNode(outerFrameDomArray);
    this.$tileContainer.appendChild(fragment);
    console.timeEnd("渲染大量节点");
  }

  private destroyTreeNode(outerFrameDoms: HTMLElementWithUnmount[]) {
    outerFrameDoms.forEach(dom => {
      dom.unmount!();
    });
  }

  /**
   *通过scrollTop计算出实际要显示的节点
   * @param scrollTop 滚动的位置
   * @returns 可以显示节点
   */
  private getTiles(scrollTop: number): { startIndex: number; tiles: NodeTypeExtra[] } {
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

  /**
   *展开/折叠树节点
   * @param tileIndex 显示节点的下标
   */
  toggleTileNodeExpand(tileIndex: number) {
    let tileNode = this.lastLinkedListVisibleRange[tileIndex];
    if (tileNode) {
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
    } else {
      // do nothing with no child node
    }
  }

  destroyed() {
    this._isDestroyed = true;
    this.$tileContainer.removeEventListener("click", this.onTileContainerClickBinder);
    this.$scrollEl.removeEventListener("scroll", this.onScrollElScrollThrottler);
    this.destroyTreeNode(this.outerFrameDoms);
  }
}
