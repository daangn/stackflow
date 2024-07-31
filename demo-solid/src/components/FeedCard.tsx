import { type Component, createMemo } from "solid-js";
import { useFlow } from "../useFlow";
import * as css from "./FeedCard.css";

interface FeedCardProps {
  articleId: string;
  title: string;
  region: string;
  price: number;
  daysAgo: number;
}
const FeedCard: Component<FeedCardProps> = (props) => {
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
    <div class={css.container}>
      <button type="button" class={css.button} onClick={onClick}>
        <div class={css.thumbnail}>
          <img src={imageUrl()} alt={props.title} width={108} height={108} />
        </div>
        <div class={css.right}>
          <div class={css.title}>{props.title}</div>
          <div class={css.subtitle}>
            {props.region} · {props.daysAgo} day ago
          </div>
          <div class={css.price}>£{props.price}.00</div>
        </div>
      </button>
    </div>
  );
};

export default FeedCard;
