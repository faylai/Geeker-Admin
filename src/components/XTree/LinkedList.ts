class LinkedNode<T extends object> {
  data: T;
  prev: LinkedNode<T> | null = null;
  next: LinkedNode<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

export class LinkedList<T extends object> {
  head: LinkedNode<T> | null = null;
  tail: LinkedNode<T> | null = null;
  length: number = 0;
  lookup: WeakMap<T, LinkedNode<T>> = new WeakMap();

  prepend(data: T): void {
    const newNode = new LinkedNode(data);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head.prev = newNode;
      this.head = newNode;
    }
    this.length++;
    this.lookup.set(data, newNode);
  }

  append(data: T): void {
    const newNode = new LinkedNode(data);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.length++;
    this.lookup.set(data, newNode);
  }

  deleteNode(node: LinkedNode<T>): void {
    const data = node.data;
    if (node === this.head) {
      this.head = this.head!.next;
      if (this.head) {
        this.head.prev = null;
      }
    } else if (node === this.tail) {
      this.tail = this.tail!.prev;
      if (this.tail) {
        this.tail.next = null;
      }
    } else {
      const prevNode = node.prev!;
      const nextNode = node.next!;
      prevNode.next = nextNode;
      nextNode.prev = prevNode;
    }
    this.length--;
    this.lookup.delete(data);
  }

  deleteNodeNext(node: T, nextSize: number): void {
    let found = this.find(node);
    if (found) {
      let currentNode = found.next;
      let count = 0;
      while (currentNode && count < nextSize) {
        const nextNode = currentNode.next;
        this.deleteNode(currentNode);
        currentNode = nextNode;
        count++;
      }
    } else {
      console.warn("cant delete node:", node);
    }
  }

  find(data: T): LinkedNode<T> | undefined {
    return this.lookup.get(data);
  }

  size(): number {
    return this.length;
  }

  insertBatchAfter(data: T, dataArray: T[]): void {
    const node = this.lookup.get(data);
    if (node) {
      let afterNode = node;
      for (const newData of dataArray) {
        const newNode = new LinkedNode(newData);
        newNode.prev = afterNode;
        newNode.next = afterNode.next;
        if (afterNode.next) {
          afterNode.next.prev = newNode;
        } else {
          this.tail = newNode;
        }
        afterNode.next = newNode;
        this.length++;
        this.lookup.set(newData, newNode);
        afterNode = newNode;
      }
    } else {
      console.error("cant find the node:", node);
    }
  }

  previous(startNode: T, startIndex: number, endIndex: number) {
    let found = this.find(startNode);
    if (found) {
      let currentNode = found;
      while (currentNode && currentNode.prev && startIndex > endIndex) {
        currentNode = currentNode.prev;
        startIndex--;
      }
      return currentNode;
    } else {
      throw new Error("cant find the node in linkedList:" + startNode);
    }
  }

  next(startNode: T, startIndex: number, endIndex: number) {
    let found = this.find(startNode);
    if (found) {
      let currentNode = found;
      while (currentNode && currentNode.next && startIndex < endIndex) {
        currentNode = currentNode.next;
        startIndex++;
      }
      return currentNode;
    } else {
      throw new Error("cant find the node in linkedList:" + startNode);
    }
  }

  getRange(startIndex: number, endIndex: number, lastRangeInfo?: { startNode: T; startIndex: number }): T[] {
    const result: T[] = [];
    let currentNode = this.head;
    let currentIndex = 0;
    //console.log("lastRangeInfo", lastRangeInfo);
    //console.log("thisRangeInfo", { startIndex, endIndex });
    if (lastRangeInfo !== undefined) {
      if (startIndex === lastRangeInfo.startIndex) {
        let found = this.find(lastRangeInfo.startNode);
        if (found) {
          currentNode = found;
          currentIndex = startIndex;
        }
      } else if (startIndex > lastRangeInfo.startIndex) {
        currentNode = this.next(lastRangeInfo.startNode, lastRangeInfo.startIndex, startIndex);
        currentIndex = startIndex;
      } else {
        currentNode = this.previous(lastRangeInfo.startNode, lastRangeInfo.startIndex, startIndex);
        currentIndex = startIndex;
      }
    }

    while (currentNode) {
      if (currentIndex >= startIndex && currentIndex <= endIndex) {
        result.push(currentNode.data);
      }
      if (currentIndex > endIndex) {
        break;
      }
      currentNode = currentNode.next;
      currentIndex++;
    }

    return result;
  }
}
