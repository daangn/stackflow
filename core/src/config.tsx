import React from "react";

export function config() {
  function Stack() {
    return <div />;
  }

  const useFlow = () => ({
    push() {},
  });

  return {
    Stack,
    useFlow,
  };
}
