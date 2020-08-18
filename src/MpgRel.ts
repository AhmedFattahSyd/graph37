import MpgRootItem from "./MpgRootItem";
import MpgItem from "./MpgItem";

export enum MpgRelType{
    "Tag" = "tag",
    "Parent" = "parent",
}
export default class MpgRel extends MpgRootItem{

    public get tag(): MpgItem {
        return this.item2
    }

    public get item(): MpgItem {
        return this.item1
    }

    public get parent(){
        return this.item1
    }

    public get child(){
        return this.item2
    }


    private _relType: MpgRelType = MpgRelType.Tag;
    public get relType(): MpgRelType {
        return this._relType;
    }
    public set relType(value: MpgRelType) {
        this._relType = value;
    }

    private _item1: MpgItem;
    public get item1(): MpgItem {
        return this._item1;
    }
    public set item1(value: MpgItem) {
        this._item1 = value;
    }

    private _item2: MpgItem;
    public get item2(): MpgItem {
        return this._item2;
    }
    public set item2(value: MpgItem) {
        this._item2 = value;
    }

    constructor(id: string, item1: MpgItem, item2: MpgItem, type: MpgRelType){
        super(id,)
        this._item1 = item1
        this._item2 = item2
        this._relType = type
    }

    public static getBlankRelData = (type: MpgRelType, item1Id: string, item2Id: string): MpgRelData =>{
        const relData: MpgRelData = {
            type: type,
            item1Id: item1Id,
            item2Id: item2Id,
        }
        return relData
    }

    public getRelData = ()=>{
        const relData: MpgRelData = {
            type: this.relType,
            item1Id: this.item1.id,
            item2Id: this.item2.id,
        }
        return relData
    }

    public getExternalRelData = ()=>{
        const relData: MpgExternalRelData = {
            id: this.id,
            type: this.relType,
            item1Id: this.item1.id,
            item2Id: this.item2.id,
        }
        return relData
    }

}

export interface MpgRelData {
    type: MpgRelType,
    item1Id: string,
    item2Id: string,
  }

  export interface MpgExternalRelData extends MpgRelData{
    id: string,
  }
