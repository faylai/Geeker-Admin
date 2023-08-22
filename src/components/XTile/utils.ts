export type IndexConfig = {
  startIndex: number;
  endIndex: number;
  removeStartIndex?: number;
  removeEndIndex?: number;
  merged: boolean;
};
const extraSize = 3; // 前后多余显示元素个数
export class TileHelper {
  dataSize: number;
  blockHeight: number;
  viewHeight: number;
  private lastIndexes: IndexConfig | undefined = undefined;
  constructor(dataSize: number, viewHeight: number, blockHeight: number) {
    this.dataSize = dataSize;
    this.viewHeight = viewHeight;
    this.blockHeight = blockHeight;
  }

  mergeLast(newIndexes: IndexConfig): IndexConfig {
    if (this.lastIndexes !== undefined) {
      // 向下滚动且由数据交叉
      if (newIndexes.startIndex <= this.lastIndexes.endIndex && newIndexes.endIndex > this.lastIndexes.endIndex) {
        let startIndex = this.lastIndexes.endIndex + 1;
        let endIndex = newIndexes.endIndex;
        let ret = {
          startIndex: startIndex,
          endIndex: endIndex,
          removeStartIndex: this.lastIndexes.startIndex,
          removeEndIndex: newIndexes.startIndex - 1,
          merged: true
        };
        return ret;
      } else if (newIndexes.endIndex <= this.lastIndexes.startIndex && newIndexes.endIndex < this.lastIndexes.endIndex) {
        // 向上滚动且由数据交叉
        let endIndex = this.lastIndexes.startIndex - 1;
        let startIndex = newIndexes.startIndex;
        let ret = {
          startIndex: startIndex,
          endIndex: endIndex,
          removeStartIndex: newIndexes.endIndex + 1,
          removeEndIndex: this.lastIndexes.endIndex,
          merged: true
        };
        return ret;
      } else {
        return { ...newIndexes };
      }
    } else {
      return { ...newIndexes };
    }
  }

  getDisplayIndexes(scrollTop: number) {
    let startIndex = Math.ceil(scrollTop / this.blockHeight);
    let endIndex = Math.ceil((scrollTop + this.viewHeight) / this.blockHeight);
    startIndex = Math.max(0, startIndex - extraSize);
    endIndex = Math.min(this.dataSize - 1, endIndex + extraSize);
    let ret = { startIndex, endIndex, merged: false };
    let mergedConfig = this.mergeLast(ret);
    this.lastIndexes = { ...ret, merged: false };
    return mergedConfig;
  }
}
