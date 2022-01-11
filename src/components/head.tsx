import { gql } from "@apollo/client";
import { Helmet } from "react-helmet-async";
import { renderMetaTags, SeoMetaTagType } from "react-datocms";
import useDato from "../lib/datocms";
const query = gql`
  query Seo {
    seo {
      _seoMetaTags {
        attributes
        content
        tag
      }
    }
  }
`;

type Response = { seo: { _seoMetaTags: SeoMetaTagType[] } };

const Head = () => {
  const metaTags = useDato<Response>({ query }).data?.seo._seoMetaTags;

  return <Helmet >{metaTags && renderMetaTags(metaTags)}</Helmet>;
};

export default Head;
