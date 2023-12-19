<template>
  <div class="x-tree" ref="rootRef">
    <div ref="tileWrapper" class="tile-wrapper"></div>
  </div>
</template>

<script lang="ts" name="XTile" setup>
import { onMounted, onUnmounted, ref, useSlots, getCurrentInstance } from "vue";
import { TileTreeHelper } from "./TileTreeHelper";
import vDom2Dom from "./adaptor/vue3/index";
import mock from "./mock";
let tileTreeHelper: TileTreeHelper | undefined = undefined;
let rootRef = ref<HTMLDivElement>();
let tileWrapper = ref<HTMLDivElement>();
let slots = useSlots();
let instance = getCurrentInstance();
onMounted(() => {
  const height: number = 36; // 节点的高度
  const mockData = mock();
  if (rootRef.value && tileWrapper.value) {
    tileTreeHelper = new TileTreeHelper({
      treeData: mockData,
      tileHeight: height,
      tileClass: "tile",
      $scrollEl: rootRef.value,
      $tileContainer: tileWrapper.value,
      tileDomCreator: function (node) {
        if (slots.default) {
          return vDom2Dom(node, slots.default, instance?.appContext);
        } else {
          let div = document.createElement("div");
          div.innerHTML = `${node.raw.nodeName}-(${node.raw.children ? node.raw.children.length : 0})`;
          return {
            el: div,
            unmount: () => {}
          };
        }
      }
    });
  }
});

onUnmounted(() => {
  tileTreeHelper?.destroyed();
});
</script>
<style lang="scss">
.x-tree {
  min-width: 160px;
  height: 400px;
  overflow: auto;
  border: 1px solid grey;
  .tile-wrapper {
    position: relative;
    height: 400px;
  }
  .tile {
    box-sizing: border-box;
    display: flex;
    align-items: center; /* 垂直居中 */
    min-width: 100%;
    padding: 0 8px;
    word-break: keep-all;
    white-space: nowrap;
    border-bottom: 1px solid blue;
  }
}
</style>
