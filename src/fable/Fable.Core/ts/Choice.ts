import FSymbol from "./Symbol"
import { IEquatable, IComparable, Any } from "./Util"
import { equalsUnions, compareUnions } from "./Util"

export function choice1Of2<T1, T2>(v: T1) {
    return new Choice<T1, T2>(0, v);
}

export function choice2Of2<T1, T2>(v: T2) {
    return new Choice<T1, T2>(1, v);
}

export default class Choice<T1, T2> implements IEquatable<Choice<T1, T2>>, IComparable<Choice<T1, T2>> {
  public tag: number;
  public a: T1 | T2;

  constructor(tag: number, a: T1 | T2) {
    this.tag = tag;
    this.a = a;
  }

  get valueIfChoice1() {
    return this.tag === 0 ? <T1>this.a : null;
  }

  get valueIfChoice2() {
    return this.tag === 1 ? <T2>this.a : null;
  }

  Equals(other: Choice<T1,T2>) {
    return equalsUnions(this, other);
  }

  CompareTo(other: Choice<T1,T2>) {
    return compareUnions(this, other);
  }

  [FSymbol.reflection]() {
    return {
      type: "Microsoft.FSharp.Core.FSharpChoice",
      interfaces: ["FSharpUnion", "System.IEquatable", "System.IComparable"],
      cases: [["Choice1Of2", Any], ["Choice2Of2", Any]]
    }
  }
}
