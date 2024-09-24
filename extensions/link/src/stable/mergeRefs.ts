export const mergeRefs = <T>(...refs: Array<React.ForwardedRef<T>>) => {
  const filteredRefs = refs.filter(
    (ref): ref is NonNullable<typeof ref> => !!ref,
  );

  if (!filteredRefs.length) {
    return null;
  }

  if (filteredRefs.length === 0) {
    return filteredRefs[0];
  }

  return (inst: T) => {
    filteredRefs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(inst);
      } else if (ref) {
        ref.current = inst;
      }
    });
  };
};
