<template>
  <div class="card content-box">
    <span class="text"> 虚拟树 🍓🍇🍈🍉</span>
    <el-alert title="百万数据如丝滑般的显示" type="warning" :closable="false" />
    <div id="Geeker">
      <el-button type="primary" @click.prevent.stop="guide"> 打开引导页 🤹‍♂️ </el-button>
    </div>
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
import Driver from "driver.js";
import "driver.js/dist/driver.min.css";
import XTile from "@/components/XTile/index.vue";
import XTree from "@/components/XTree/index.vue";
const guide = () => {
  const driver: Driver = new Driver({
    allowClose: false,
    doneBtnText: "结束",
    closeBtnText: "关闭",
    nextBtnText: "下一步",
    prevBtnText: "上一步"
  });
  driver.defineSteps(steps);
  driver.start();
};
function onSpanClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  console.log("span clicked");
}

const steps = [
  {
    element: "#collapseIcon",
    popover: {
      title: "Collapse Icon",
      description: "Open && Close sidebar",
      position: "right"
    }
  },
  {
    element: "#breadcrumb",
    popover: {
      title: "Breadcrumb",
      description: "Indicate the current page location",
      position: "right"
    }
  },
  {
    element: "#assemblySize",
    popover: {
      title: "Switch Assembly Size",
      description: "Switch the system size",
      position: "left"
    }
  },
  {
    element: "#language",
    popover: {
      title: "Switch Language",
      description: "Switch the system language",
      position: "left"
    }
  },
  {
    element: "#searchMenu",
    popover: {
      title: "Page Search",
      description: "Page search, quick navigation",
      position: "left"
    }
  },
  {
    element: "#themeSetting",
    popover: {
      title: "Setting theme",
      description: "Customize settings theme",
      position: "left"
    }
  },
  {
    element: "#message",
    popover: {
      title: "Message Notification",
      description: "Can receive company information",
      position: "left"
    }
  },
  {
    element: "#fullscreen",
    popover: {
      title: "Full Screen",
      description: "Full Screen, Exit The Full Screen Page",
      position: "left"
    }
  }
];
</script>

<style scoped lang="scss">
@import "./index.scss";
</style>
