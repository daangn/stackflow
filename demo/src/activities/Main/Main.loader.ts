function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem<T>(arr: T[]): T {
  return arr[getRandomInt(0, arr.length - 1)];
}

const TITLES = [
  "Master",
  "Wild",
  "Universe",
  "Private",
  "Harbor",
  "Valuable",
  "Also",
  "Ever",
  "Production",
  "Chest",
  "Dream",
  "Cloud",
  "Star",
  "Moon",
  "River",
];

const REGIONS = [
  "Nagevan",
  "Inguima",
  "Litenego",
  "Umumtaw",
  "Gubdidgi",
  "Jumjelewu",
  "Salhega",
  "Jaifuup",
  "Idcipwel",
  "Ajapaktar",
  "Vamtoro",
  "Solgude",
  "Pilnaga",
  "Faldimor",
];

export function mainLoader() {
  const cards = Array.from({ length: 10 }).map(() => ({
    articleId: getRandomInt(1000000, 99999999),
    price: getRandomInt(1, 50),
    title: getRandomItem(TITLES),
    region: getRandomItem(REGIONS),
    daysAgo: getRandomInt(1, 10),
  }));

  return { cards };
}
