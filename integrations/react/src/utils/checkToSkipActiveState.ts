export function checkToSkipActiveState (options?: {
  animate?: boolean;
}) {
  if(!options) return false;

  const isNullableAnimateOption = options.animate === undefined || options.animate == null
  if(isNullableAnimateOption) return false;

  return !options.animate
}
