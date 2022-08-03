import React, { useEffect, useRef } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";

import { useFlow } from "../stackflow";
import * as css from "./FeedCard.css";

interface FeedCardProps {
  articleId: string;
  title: string;
  region: string;
  price: number;
  daysAgo: number;
}
const FeedCard: React.FC<FeedCardProps> = ({
  articleId,
  title,
  price,
  region,
  daysAgo,
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const { push } = useFlow();

  const imageUrl = `https://picsum.photos/800/800/?id=${articleId}`;

  const onClick = () => {
    push("Article", {
      articleId: String(articleId),
      title,
    });
  };

  useEffect(() => {
    if (!btnRef.current) {
      return () => {};
    }

    const $btn = btnRef.current;

    const observer = new IntersectionObserver((e) => {
      console.log("intersect!", title, e[0].isIntersecting);
    });

    observer.observe($btn);

    return () => {
      observer.unobserve($btn);
    };
  }, []);

  return (
    <div className={css.container}>
      <button
        ref={btnRef}
        type="button"
        className={css.button}
        onClick={onClick}
      >
        <div className={css.thumbnail}>
          <LazyLoadImage
            src={imageUrl}
            effect="opacity"
            width={108}
            height={108}
          />
        </div>
        <div className={css.right}>
          <div className={css.title}>{title}</div>
          <div className={css.subtitle}>
            {region} · {daysAgo} day ago
          </div>
          <div className={css.price}>£{price}.00</div>
        </div>
      </button>
    </div>
  );
};

export default FeedCard;
