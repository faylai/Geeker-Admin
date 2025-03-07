<template>
  <div class="card content-box">
    <span class="text"> 虚拟树 🍓🍇🍈🍉</span>
    <el-alert title="500万数据如丝滑般的显示，打开dev tools 看看内存多大！" type="warning" :closable="false" />
    <div style="display: flex; justify-content: center; width: 500px">
      <div style="flex: 1; padding: 0 10px">
        <p>xTile 瓦片加载select</p>
        <XTile :throttle="22"></XTile>
      </div>
      <div style="flex: 1; padding: 0 10px">
        <p>xTile 瓦片加载tree</p>
        <XTree>
          <template #default="node">
            <div>
              <a href=":;" @click="onSpanClick">{{ node.raw.nodeName }}</a>
              <span>来自vue 的模板</span>
            </div>
          </template>
        </XTree>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="guide">
import XTile from "@/components/XTile/index.vue";
import XTree from "@/components/XTree/index.vue";
function onSpanClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  console.log("span clicked");
}
</script>

<style scoped lang="scss">
@import "./index.scss";
</style>
