/**
 * 枚举标签映射：把 { key, name } 列表收成 key -> 项，并提供按 key 取展示名。
 *
 * 对外：export createLabelMapper。
 * 约束：列表需带 as const，key 为 string 或 number。
 */

/**
 * 由静态枚举列表生成映射表。
 * @param arr 含 key、name 的只读列表
 * @returns map 为 key 到原项；getLabel 在 key 为空时返回 undefined
 */
export function createLabelMapper<
  T extends readonly { key: string | number; name: string }[]
> (arr: T) {
  type Item = T[number];
  type Key = Item['key'];
  type Name = Item['name'];

  const map: Record<Key, Item> = {} as Record<Key, Item>;

  arr.forEach((item) => {
    map[item.key as Key] = item;
  });

  return {
    map,
    getLabel: (key?: Key | null): Name | undefined => (key == null ? undefined : map[key]?.name)
  };
}
