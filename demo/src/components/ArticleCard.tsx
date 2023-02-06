import { LazyLoadImage } from "react-lazy-load-image-component";

import { useFlow } from "../useFlow";
import * as css from "./ArticleCard.css";

interface ArticleCardProps {
  articleId: string;
  title: string;
  price: number;
}
const ArticleCard: React.FC<ArticleCardProps> = ({
  articleId,
  title,
  price,
}) => {
  const { push } = useFlow();

  const imageUrl = `https://picsum.photos/800/800/?id=${articleId}`;

  const onClick = () => {
    push("Article", {
      articleId: String(articleId),
      title,
    });
  };

  return (
    <button type="button" className={css.container} onClick={onClick}>
      <div className={css.thumbnail}>
        <div className={css.innerImage}>
          <LazyLoadImage
            src={imageUrl}
            effect="opacity"
            width="100%"
            height="100%"
          />
        </div>
      </div>
      <div className={css.title}>{title}</div>
      <div className={css.price}>£{price}.00</div>
    </button>
  );
};

export default ArticleCard;
