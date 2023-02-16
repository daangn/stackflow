let dt = 0;
let memt = 0;

export const time = () => {
  const t = new Date().getTime();

  if (memt === t) {
    dt += 1;
  } else {
    memt = t;
    dt = 0;
  }

  return (t * 1000 + dt) / 1000;
};
