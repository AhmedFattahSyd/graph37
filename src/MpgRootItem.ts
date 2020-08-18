import { MpgItemType } from "./MpgItemType";

export default class MpgRootItem {

  protected _type: MpgItemType;
  public get type(): MpgItemType {
    return this._type;
  }

  private _id: string;
  public get id(): string {
    return this._id;
  }

  constructor(
    id: string,
  ) {
    this._id = id;
    this._type = MpgItemType.Root;
  }
}

