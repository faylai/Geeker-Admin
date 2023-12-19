import { AppContext, createVNode, render } from "vue";
import SlotComponent from "./SlotRender";
import { HTMLElementWithUnmount } from "../../treeUtils";

export default function vDom2Dom(
  node: object,
  slotFunction: (...arg: any[]) => any,
  appContext: AppContext | null = null
): HTMLElementWithUnmount {
  const vNode = createVNode(
    SlotComponent,
    {},
    {
      default: () => {
        return slotFunction(node);
      }
    }
  );
  vNode.appContext = appContext;
  let container: HTMLElement = document.createElement("div");
  render(vNode, container);

  function unmount() {
    //console.log("destroy node");
    render(null, container);
  }
  return {
    el: container.firstElementChild as HTMLElement,
    unmount
  };
}
