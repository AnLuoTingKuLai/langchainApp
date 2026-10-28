/**
 * 浏览器替身：langsmith / langchain 会 `new AsyncLocalStorage()`。
 * Vite 对 `node:async_hooks` 的空 stub 会让 AsyncLocalStorage 不是构造函数。
 * 本 shim 提供可运行的轻量实现（单线程浏览器，不模拟真正的异步上下文隔离）。
 */

// ====== AsyncLocalStorage 替身 ======

export class AsyncLocalStorage<T = unknown> {
  #store: T | undefined;

  /**
   * 读取当前“上下文”存储；无上下文时为 undefined。
   */
  getStore (): T | undefined {
    return this.#store;
  }

  /**
   * 在给定 store 下同步执行 callback，结束后恢复原 store。
   */
  run<R> (store: T, callback: (...args: never[]) => R, ...args: never[]): R {
    const previousStore = this.#store;
    this.#store = store;

    try {
      return callback(...args);
    } finally {
      this.#store = previousStore;
    }
  }

  /**
   * 进入上下文（不自动退出），供部分 tracing 包装使用。
   */
  enterWith (store: T): void {
    this.#store = store;
  }

  /**
   * 清空当前上下文。
   */
  disable (): void {
    this.#store = undefined;
  }

  /**
   * Node 的 snapshot API 替身：浏览器里直接执行传入函数。
   */
  static snapshot () {
    return <R>(fn: (...args: never[]) => R, ...args: never[]): R => {
      return fn(...args);
    };
  }
}

export default {
  AsyncLocalStorage
};
