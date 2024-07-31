import { type Component, createMemo } from "solid-js";
import { useFlow } from "../useFlow";
import * as css from "./ArticleCard.css";

interface ArticleCardProps {
  articleId: string;
  title: string;
  price: number;
}
const ArticleCard: Component<ArticleCardProps> = (props) => {
  const { push } = useFlow();

  const imageUrl = createMemo(
    () => `https://picsum.photos/800/800/?id=${props.articleId}`,
  );

  const onClick = () => {
    push("Article", {
      articleId: String(props.articleId),
      title: props.title,
    });
  };

  return (
    <button type="button" class={css.container} onClick={onClick}>
      <div class={css.thumbnail}>
        <div class={css.innerImage}>
          <img src={imageUrl()} alt={props.title} width="100%" height="100%" />
        </div>
      </div>
      <div class={css.title}>{props.title}</div>
      <div class={css.price}>£{props.price}.00</div>
    </button>
  );
};

export default ArticleCard;
