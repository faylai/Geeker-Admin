<template>
  <div class="x-tree" ref="rootRef">
    <div ref="tileWrapper" class="tile-wrapper"></div>
  </div>
</template>

<script lang="ts" name="XTile" setup>
import { onMounted, onUnmounted, ref } from "vue";
import { TileTreeHelper } from "./TileTreeHelper";
import mock from "./mock";
let tileTreeHelper: TileTreeHelper | undefined = undefined;
let rootRef = ref<HTMLDivElement>();
let tileWrapper = ref<HTMLDivElement>();
onMounted(() => {
  const height: number = 36; // 节点的高度
  const mockData = mock();
  if (rootRef.value && tileWrapper.value) {
    tileTreeHelper = new TileTreeHelper({
      treeData: mockData,
      tileHeight: height,
      tileClass: "tile",
      $scrollEl: rootRef.value,
      $tileContainer: tileWrapper.value
    });
  }
});

onUnmounted(() => {
  tileTreeHelper?.destroyed();
});
</script>
<style lang="scss">
.x-tree {
  position: relative;
  min-width: 160px;
  height: 400px;
  overflow: auto;
  border: 1px solid grey;
  .tile-wrapper {
    height: 400px;
  }
  .tile {
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
