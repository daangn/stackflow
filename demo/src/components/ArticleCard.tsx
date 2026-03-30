import { Link } from "@stackflow/link/future";
import { LazyLoadImage } from "react-lazy-load-image-component";
import * as css from "./ArticleCard.css";

interface ArticleCardProps {
  articleId: number;
  title: string;
  price: number;
}
const ArticleCard: React.FC<ArticleCardProps> = ({
  articleId,
  title,
  price,
}) => {
  const imageUrl = `https://picsum.photos/800/800/?id=${articleId}`;

  return (
    <Link
      activityName="Article"
      activityParams={{ articleId, title }}
      className={css.container}
    >
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
    </Link>
  );
};

export default ArticleCard;
