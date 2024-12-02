import type { Component } from "solid-js";
import ImageProfileRating from "../assets/ImageProfileRating";
import * as css from "./ArticleProfile.css";

const ArticleProfile: Component = () => {
  const imageUrl = "https://picsum.photos/120/120/";

  return (
    <div class={css.container}>
      <div class={css.avatar}>
        <img src={imageUrl} alt="Avatar" width="100%" height="100%" />
      </div>
      <div class={css.labels}>
        <div class={css.name}>Emilia</div>
        <div class={css.region}>Woolston</div>
      </div>
      <div class={css.rating}>
        <div class={css.ratingImg}>
          <ImageProfileRating />
        </div>
        <div class={css.ratingCaption}>Rating</div>
      </div>
    </div>
  );
};

export default ArticleProfile;
