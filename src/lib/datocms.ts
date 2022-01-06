/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApolloClient,
  InMemoryCache,
  gql,
  OperationVariables,
  QueryOptions,
} from "@apollo/client";
import { isDocumentNode } from "@apollo/client/utilities";
import { useState } from "react";
import { ResponsiveImageType } from "react-datocms";
import { ObjectWithId } from "../utils/array";
import handleError from "../utils/handleError";

//#region Client

const API_TOKEN = process.env.REACT_APP_DATOCMS;
const uri = "https://graphql.datocms.com";
const client = new ApolloClient({
  uri,
  cache: new InMemoryCache(),
  headers: { authorization: `Bearer ${API_TOKEN}` },
});
//#endregion

// #region Hooks

const useDato = <T = any, TVariables = OperationVariables>(
  optionsOrQuery: QueryOptions<TVariables, any> | ReturnType<typeof gql>
): { data: T | null; isLoading: boolean } => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setLoading] = useState(true);
  const options: QueryOptions<TVariables, any> = isDocumentNode(optionsOrQuery)
    ? { query: optionsOrQuery }
    : optionsOrQuery;

  client
    .query<T, TVariables>(options)
    .then(({ data: response }) => {
      setData(response);
    })
    .catch((e) => handleError(e, "Failed to get data"))
    .finally(() => setLoading(false));
  return { data, isLoading };
};

export default useDato;
//#endregion

// #region queries

export const responsiveImage = `
responsiveImage{
  srcSet
  webpSrcSet
  sizes
  src
  width
  height
  aspectRatio
  alt
  title
  bgColor
  base64
}
`;

export const primaryQuery = gql`
  query Parts {
    allCarModels {
      price
      name
      id
      validEngines {
        id
      }
      image {
        ${responsiveImage}
      }
    }
    allEngines {
      id
      name
      price
      validGearboxes {
        id
      }
    }
    allGearboxes {
      id
      name
      price
    }
    allColors {
			id
      color {
        hex
      }
    }
  }
`;
// #endregion

//#region types

export interface DatoQuery<T = string> {
  __typename: T;
}
type CommonProps<ValidProp extends string | never = never> = {
  id: string;
  name: string;
  price: number;
} & Record<ValidProp, ObjectWithId[]>;

export type DatoImg = { responsiveImage: ResponsiveImageType };
export interface Gearbox extends DatoQuery, CommonProps {}
export interface Engine extends DatoQuery, CommonProps<"validGearboxes"> {}
export interface Model extends DatoQuery, CommonProps<"validEngines"> {
  image?: DatoImg;
}
export interface Color extends DatoQuery {
  id: string;
  color: { hex: string };
}
export interface PartsQuery {
  allCarModels: Model[];
	allGearboxes: Gearbox[];
	allEngines: Engine[];
  allColors: Color[];
}

type PartExtends<P extends keyof PartsQuery, T> = P extends never
  ? never
  : PartsQuery[P] extends T
  ? P
  : never;

export type PartsWithPrice<P extends keyof PartsQuery = keyof PartsQuery> =
  NonNullable<PartExtends<P,{price:number}[]>>;

// #endregion
