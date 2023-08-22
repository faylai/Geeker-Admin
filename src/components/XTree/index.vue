<template>
  <div class="x-tree">
    <div ref="wrapper" class="wrapper"></div>
  </div>
</template>

<script lang="ts" name="XTile">
import { defineComponent } from "vue";
import { TileTreeHelper } from "./TileTreeHelper";
import { throttle } from "lodash";
import mock from "./mock";
export default defineComponent({
  data() {
    return {};
  },
  mounted() {
    const root = this.$el as HTMLDivElement;
    const $wrapper = this.$refs.wrapper as HTMLDivElement;
    const height: number = 36; // 节点的高度
    const viewHeight: number = root.offsetHeight;
    const mockData = mock();
    let tileTreeHelper = new TileTreeHelper(mockData, viewHeight, height);
    function syncWrapperHeight() {
      $wrapper.style.height = [tileTreeHelper.linkedList.size() * height, "px"].join("");
    }

    function renderVisibleTileNode(): void {
      console.time("渲染大量节点");
      let fragment = document.createDocumentFragment();
      let block: HTMLDivElement = document.createElement("div") as HTMLDivElement;
      block.innerHTML = "&nbsp;";
      block.className = "block";
      const { startIndex, tiles } = tileTreeHelper.getTiles(root.scrollTop);
      for (let index = 0; index < tiles.length; index++) {
        const element: HTMLDivElement = block.cloneNode(true) as HTMLDivElement;
        const node = tiles[index];
        let tileViewIndex = startIndex + index;
        element.style.top = [tileViewIndex * height, "px"].join("");
        element.style.paddingLeft = [node.level * 20, "px"].join("");
        let expandible = node.raw.children && node.raw.children.length > 0;
        let arrow = node.raw.expand === false && expandible ? "&gt" : "O";
        let directChildrenSize = expandible ? node.raw.children?.length : 0;
        element.innerHTML = `${arrow}--${node.raw.nodeName} (${directChildrenSize})`;
        element.setAttribute("data-node-index", String(index));
        fragment.appendChild(element);
      }
      $wrapper.innerHTML = "";
      $wrapper.appendChild(fragment);
      console.timeEnd("渲染大量节点");
    }
    function onScroll() {
      renderVisibleTileNode();
    }

    root.addEventListener("scroll", throttle(onScroll, 200));

    $wrapper.addEventListener("click", function (event) {
      if (event.target) {
        let block = event.target as HTMLDivElement;
        if (block.hasAttribute("data-node-index")) {
          let index = Number(block.getAttribute("data-node-index"));
          tileTreeHelper.toggleTileNodeExpand(index);
          syncWrapperHeight();
          renderVisibleTileNode();
        }
      }
    });
    syncWrapperHeight();
    renderVisibleTileNode();
  }
});
</script>
<style lang="scss">
.x-tree {
  position: relative;
  min-width: 160px;
  height: 400px;
  overflow: auto;
  border: 1px solid grey;
  .wrapper {
    height: 400px;
  }
  .block {
    position: absolute;
    right: 0;
    left: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center; /* 垂直居中 */
    height: 36px;
    padding: 0 8px;
    word-break: keep-all;
    white-space: nowrap;
    border-bottom: 1px solid blue;
  }
}
</style>
./common./common
