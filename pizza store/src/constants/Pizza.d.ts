import type Toping from "./Toping";

export default interface Pizza {
  /** The name of pizza */
  name: string;
  /** The discount prize */
  discountPrice: number;
  /** The real prize */
  price: number;
  /** The image of pizza */
  img: string;

  //  Data used for cart
  /** The topings of pizza */
  topings?: Array<Toping>;
  /** The topings of pizza */
  amount?: number;
}
