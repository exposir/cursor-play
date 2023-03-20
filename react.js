// 定义一个 Component 类
class Component {
  constructor(props) {
    this.props = props;
  }
}

// 定义一个 createElement 函数
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

// 定义一个 createTextElement 函数
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

// 定义一个 render 函数
function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  const isProperty = key => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name];
    });

  element.props.children.forEach(child => render(child, dom));
  container.appendChild(dom);
}

// 定义一个 MiniReact 对象
const MiniReact = {
  createElement,
  render,
  Component,
};

// 创建一个 element
const element = MiniReact.createElement(
  "div",
  { id: "my-div", className: "my-class" },
  MiniReact.createElement("h1", null, "Hello World"),
  MiniReact.createElement("p", null, "This is a paragraph")
);

// 获取 container 并渲染 element
const container = document.getElementById("root");
MiniReact.render(element, container);
