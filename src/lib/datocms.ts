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
    .finally(()=>setLoading(false));
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
query Cars{
	allCarModels {
    name
    price
    image {
				${responsiveImage}
    }
    validEngines {
      price
      name
      validGearboxes {
        price
        name
      }
    }
  }
	allColors {
    color {
      hex
    }
  }
}`;
// #endregion

//#region types

export interface DatoQuery<T = string> {
  __typename: T;
}
export type DatoImg = { responsiveImage: ResponsiveImageType };
export interface Gearbox extends DatoQuery<"GearboxRecord"> {
  name: string;
  price: number;
}
export interface Engine extends DatoQuery<"EngineRecord"> {
  name: string;
  price: number;
  validGearBoxes: Gearbox[];
}
export interface Model extends DatoQuery<"CarModelRecord"> {
  name: string;
  price: number;
  validEngines: Engine[];
  image?: DatoImg;
}
export interface Color extends DatoQuery<"ColorRecord"> {
  color: { hex: string };
}
export interface CarsQuery {
  allCarModels: Model[];
  allColors: Color[];
}
// #endregion
