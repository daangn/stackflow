import type { ActivityLoaderArgs } from "@stackflow/config";

export async function articleLoader({ params }: ActivityLoaderArgs<"Article">) {
  const imageUrl = `https://picsum.photos/800/800/?id=${params.articleId}`;

  const recommenderCards = [
    {
      articleId: 25140667,
      price: 41,
      title: "Ran",
    },
    {
      articleId: 60547101,
      price: 24,
      title: "Rest",
    },
    {
      articleId: 34751776,
      price: 42,
      title: "Those",
    },
    {
      articleId: 4114554,
      price: 12,
      title: "Beauty",
    },
    {
      articleId: 81339443,
      price: 3,
      title: "Mighty",
    },
    {
      articleId: 44738871,
      price: 1,
      title: "Afternoon",
    },
    {
      articleId: 57388513,
      price: 31,
      title: "Brown",
    },
    {
      articleId: 60883443,
      price: 49,
      title: "Musical",
    },
    {
      articleId: 932094,
      price: 26,
      title: "Occasionally",
    },
    {
      articleId: 10749683,
      price: 35,
      title: "Having",
    },
  ];

  return {
    imageUrl,
    recommenderCards,
  };
}
