import { defineComponent, onMounted } from "vue";

export default defineComponent({
  setup(props, { slots }) {
    onMounted(() => {
      //console.log("component is unmounted");
    });
    return () => {
      if (slots.default) {
        return slots.default()[0];
      } else {
        <div></div>;
      }
    };
  }
});
