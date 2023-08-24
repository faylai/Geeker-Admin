import { AppContext, createVNode, render } from "vue";
import SlotComponent from "./SlotRender";
import { HTMLElementWithComponent } from "../../treeUtils";

export default function vDom2Dom(
  node: object,
  slotFunction: (...arg: any[]) => any,
  appContext: AppContext | null = null
): HTMLElementWithComponent {
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
    render(null, container);
  }

  let ret: HTMLElementWithComponent = container.firstElementChild as HTMLElementWithComponent;
  ret.unmount = unmount;
  return ret;
}
