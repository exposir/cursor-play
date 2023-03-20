// MiniVue类
class MiniVue {
  constructor(options) {
    this.$options = options; // 保存选项
    this.$data = options.data; // 保存数据
    this.observe(this.$data); // 监听数据
    this.$compile = new Compile(options.el, this); // 编译模板
  }

  // 监听数据
  observe(data) {
    if (!data || typeof data !== "object") {
      return;
    }
    Object.keys(data).forEach((key) => {
      this.defineReactive(data, key, data[key]); // 定义响应式数据
      this.proxyData(key); // 代理数据
    });
  }

  // 定义响应式数据
  defineReactive(data, key, val) {
    const dep = new Dep(); // 创建依赖
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get() {
        Dep.target && dep.addSub(Dep.target); // 收集依赖
        return val;
      },
      set(newVal) {
        if (newVal === val) {
          return;
        }
        val = newVal;
        dep.notify(); // 通知依赖更新
      },
    });
    this.observe(val); // 监听嵌套数据
  }

  // 代理数据
  proxyData(key) {
    Object.defineProperty(this, key, {
      enumerable: true,
      configurable: true,
      get() {
        return this.$data[key];
      },
      set(newVal) {
        this.$data[key] = newVal;
      },
    });
  }
}

// 编译类
class Compile {
  constructor(el, vm) {
    this.$vm = vm; // 保存MiniVue实例
    this.$el = document.querySelector(el); // 保存根元素
    if (this.$el) {
      this.$fragment = this.node2Fragment(this.$el); // 创建文档片段
      this.compile(this.$fragment); // 编译模板
      this.$el.appendChild(this.$fragment); // 将文档片段添加到根元素
    }
  }

  // 创建文档片段
  node2Fragment(el) {
    const fragment = document.createDocumentFragment();
    let child;
    while ((child = el.firstChild)) {
      fragment.appendChild(child);
    }
    return fragment;
  }

  // 编译模板
  compile(el) {
    const childNodes = el.childNodes;
    Array.from(childNodes).forEach((node) => {
      if (node.nodeType === 1) {
        this.compileElement(node); // 编译元素节点
      } else if (this.isInterpolation(node)) {
        this.compileText(node); // 编译插值表达式
      }
      if (node.childNodes && node.childNodes.length) {
        this.compile(node); // 递归编译子节点
      }
    });
  }

  // 编译元素节点
  compileElement(node) {
    const nodeAttrs = node.attributes;
    Array.from(nodeAttrs).forEach((attr) => {
      const attrName = attr.name;
      const exp = attr.value;
      if (this.isDirective(attrName)) {
        const dir = attrName.substring(2);
        this[dir] && this[dir](node, this.$vm, exp); // 执行指令对应的方法
      }
    });
  }

  // 是否是指令
  isDirective(attr) {
    return attr.indexOf("v-") === 0;
  }

  // 是否是插值表达式
  isInterpolation(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }

  // 编译插值表达式
  compileText(node) {
    this.update(node, this.$vm, RegExp.$1, "text");
  }

  // 编译v-text指令
  text(node, vm, exp) {
    this.update(node, vm, exp, "text");
  }

  // 编译v-html指令
  html(node, vm, exp) {
    this.update(node, vm, exp, "html");
  }

  // 编译v-model指令
  model(node, vm, exp) {
    this.update(node, vm, exp, "model");

    node.addEventListener("input", (e) => {
      vm[exp] = e.target.value;
    });
  }

  // 更新节点
  update(node, vm, exp, dir) {
    const updaterFn = this[dir + "Updater"];
    updaterFn && updaterFn(node, vm[exp]); // 更新节点
    new Watcher(vm, exp, function (value) {
      updaterFn && updaterFn(node, value); // 创建依赖
    });
  }

  // 更新文本节点
  textUpdater(node, value) {
    node.textContent = value;
  }

  // 更新HTML节点
  htmlUpdater(node, value) {
    node.innerHTML = value;
  }

  // 更新表单节点
  modelUpdater(node, value) {
    node.value = value;
  }
}

// 观察者类
class Watcher {
  constructor(vm, key, cb) {
    this.vm = vm; // 保存MiniVue实例
    this.key = key; // 保存数据键名
    this.cb = cb; // 保存回调函数
    Dep.target = this; // 将当前观察者实例添加到Dep.target
    this.vm[this.key]; // 读取数据，触发依赖收集
    Dep.target = null; // 将Dep.target重置为null
  }

  // 更新数据
  update() {
    this.cb.call(this.vm, this.vm[this.key]);
  }
}

// 依赖类
class Dep {
  constructor() {
    this.subs = []; // 保存观察者实例
  }

  // 添加观察者
  addSub(sub) {
    this.subs.push(sub);
  }

  // 通知观察者更新
  notify() {
    this.subs.forEach((sub) => {
      sub.update();
    });
  }
}

// MiniVue的使用示例
const app = new MiniVue({
  el: "#app",
  data: {
    message: "Hello, MiniVue!",
  },
});

// 从MiniVue实例中直接访问数据属性
console.log(app.message);

// 更新数据属性，查看DOM中的变化
setTimeout(() => {
  app.message = "Hello, MiniVue updated!";
}, 2000);
