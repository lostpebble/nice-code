export type MaybePromise<T> = T | Promise<T>;

// export const resolveMaybePromiseValue = async <T>(value: MaybePromise<T>): Promise<T> => {
//   if (value instanceof Promise) {
//     return await value;
//   } else {
//     return value;
//   }
// };
