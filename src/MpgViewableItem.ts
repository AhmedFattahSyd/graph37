import MpgRootItem from "./MpgRootItem";
import { MpgItemType } from "./MpgItemType";

export default class MpgViewableItem extends MpgRootItem {
  private _headline: string;
  public get headline(): string {
    return this._headline;
  }
  public set headline(value: string) {
    this._headline = value;
  }
  constructor(
    type: MpgItemType,
    id: string,
    headline: string,
  ) {
    super(id);
    this._type = type
    this._headline = headline;
  }
}
