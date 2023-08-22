<template>
  <div class="x-tile">
    <div ref="wrapper" class="wrapper"></div>
  </div>
</template>

<script lang="ts" name="XTile">
import { defineComponent } from "vue";
import { TileHelper } from "./utils";
import type { IndexConfig } from "./utils";
import { throttle } from "lodash";
export default defineComponent({
  props: {
    throttle: {
      type: Number
    }
  },
  data() {
    return {
      msg: "hello vue3 in typescript"
    };
  },
  mounted() {
    const root = this.$el as HTMLDivElement;
    const $wrapper = this.$refs.wrapper as HTMLDivElement;
    const size: number = 10000; // 节点的个数
    const height: number = 36; // 节点的高度
    const helper = new TileHelper(size, $wrapper.offsetHeight, height);
    $wrapper.style.height = [size * height, "px"].join(""); // 可视高度
    const cache = new Array<HTMLDivElement>();
    function renderVisibleNode(config: IndexConfig): void {
      console.time("渲染大量节点");
      let fragment = document.createDocumentFragment();
      let block: HTMLDivElement = document.createElement("div") as HTMLDivElement;
      block.innerHTML = "&nbsp;";
      block.className = "block";
      for (let index = config.startIndex; index <= config.endIndex; index++) {
        const element: HTMLDivElement = block.cloneNode(true) as HTMLDivElement;
        element.style.top = [index * height, "px"].join("");
        element.innerHTML = "第：" + String(index);
        cache[index] = element;
        fragment.appendChild(element);
      }
      //$wrapper.innerHTML = "";
      if (config.merged && config.removeStartIndex !== undefined && config.removeEndIndex !== undefined) {
        for (let i = config.removeStartIndex; i <= config.removeEndIndex; i++) {
          if (cache[i] !== undefined) {
            cache[i].parentNode?.removeChild(cache[i]);
          } else {
            console.log("miss remove child index:", i);
          }
        }
      } else {
        $wrapper.innerHTML = "";
      }
      $wrapper.appendChild(fragment);
      console.timeEnd("渲染大量节点");
    }
    function onScroll() {
      console.log("scrollTop:", root.scrollTop);
      let startAndEnd = helper.getDisplayIndexes(root.scrollTop);
      console.log(startAndEnd);
      renderVisibleNode(startAndEnd);
    }
    root.addEventListener("scroll", throttle(onScroll, 200));
    renderVisibleNode(helper.getDisplayIndexes(root.scrollTop));
  }
});
</script>
<style lang="scss">
.x-tile {
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
