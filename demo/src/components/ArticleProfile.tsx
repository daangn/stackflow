import { LazyLoadImage } from "react-lazy-load-image-component";

import ImageProfileRating from "../assets/ImageProfileRating";
import * as css from "./ArticleProfile.css";

const ArticleProfile: React.FC = () => {
  const imageUrl = `https://picsum.photos/120/120/`;

  return (
    <div className={css.container}>
      <div className={css.avatar}>
        <LazyLoadImage
          src={imageUrl}
          effect="opacity"
          width="100%"
          height="100%"
        />
      </div>
      <div className={css.labels}>
        <div className={css.name}>Emilia</div>
        <div className={css.region}>Woolston</div>
      </div>
      <div className={css.rating}>
        <div className={css.ratingImg}>
          <ImageProfileRating />
        </div>
        <div className={css.ratingCaption}>Rating</div>
      </div>
    </div>
  );
};

export default ArticleProfile;
