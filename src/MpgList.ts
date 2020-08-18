import MpgItem, { MpgItemData, MpgItemState, MpgItemPrivacy, MpgExternalItemData } from "./MpgItem";
import { MpgItemType } from "./MpgItemType";
import * as firebase from 'firebase/app';

export default class MpgList extends MpgItem {
  constructor(
    id: string,
    headline: string,
    notes: string = "",
    createAt: Date = new Date(),
    updatedAt: Date = new Date(),
    priority: number,
    state: MpgItemState,
    parkedUntil: Date,
    sentiment: number
  ) {
    super(id, headline, notes, createAt, updatedAt, priority,state,parkedUntil,sentiment);
    this._type = MpgItemType.List;
  }

  public static getBlankListData = (headline: string, notes: string = "")=>{
    const data: MpgListData = {
      headline: headline,
      notes: notes,
      priority: 0,
      createdAt: firebase.firestore.Timestamp.fromDate(new Date()),
      updatedAt: firebase.firestore.Timestamp.fromDate(new Date()),
      type: MpgItemType.List,
      state: MpgItemState.Active,
      parkedUntil: firebase.firestore.Timestamp.fromDate(new Date()),
      sentiment: 0,
      overrideSentiment: false,
      privacy: MpgItemPrivacy.Public,
    }
    return data
  }
  

  public get netPriority(): number {
    return (
      this.priority 
    //    + Array.from(this.parentMap.values())
    //     .map(tag => {
    //       return tag.netPriority;
    //     })
    //     .reduce((sum, pri) => {
    //       return sum + pri;
    //     }, 0)
    );
  }

  public static fromListData = (id: string, data: MpgListData): MpgList => {
    let state = MpgItemState.Active
    let parkUntil: Date = new Date()
    if(data.state !== undefined){
      state = data.state
    }
    if(data.parkedUntil !== undefined){
      parkUntil = data.parkedUntil.toDate()
    }
    let sentiment = 0
    if(data.sentiment !== undefined){
      sentiment = data.sentiment
    }
    let list = new MpgList(
      id,
      data.headline,
      data.notes,
      data.createdAt.toDate(),
      data.updatedAt.toDate(),
      data.priority,
      state,
      parkUntil,
      sentiment,
    );
    if(data.overrideSentiment !== undefined){
      list.overrideSentiment = data.overrideSentiment
    }else{
      list.overrideSentiment = false
    }
    if(data.privacy !== undefined){
      list.privacy = data.privacy
    }else{
      list.privacy = MpgItemPrivacy.Public
    }
    return list
  };

  public static fromExternalItemData = (data: MpgExternalItemData): MpgList => {
    let state = MpgItemState.Active
    let parkUntil: Date = new Date()
    if(data.state !== undefined){
      state = data.state
    }
    if(data.parkedUntil !== undefined){
      parkUntil = data.parkedUntil
    }
    let sentiment = 0
    if(data.sentiment !== undefined){
      sentiment = data.sentiment
    }
    let list = new MpgList(
      data.id,
      data.headline,
      data.notes,
      data.createdAt,
      data.updatedAt,
      data.priority,
      state,
      parkUntil,
      sentiment,
    );
    if(data.overrideSentiment !== undefined){
      list.overrideSentiment = data.overrideSentiment
    }else{
      list.overrideSentiment = false
    }
    if(data.privacy !== undefined){
      list.privacy = data.privacy
    }else{
      list.privacy = MpgItemPrivacy.Public
    }
    return list
  };

  getListData = (): MpgListData => {
    const listData: MpgListData = {
      headline: this.headline,
      notes: this.notes,
      type: this.type,
      priority: this.priority,
      createdAt: firebase.firestore.Timestamp.fromDate(this.createdAt),
      updatedAt: firebase.firestore.Timestamp.fromDate(this.updatedAt),
      state: this.state,
      parkedUntil: firebase.firestore.Timestamp.fromDate(this.parkedUntil),
      sentiment: this.sentiment,
      overrideSentiment: this.overrideSentiment,
      privacy: this.privacy,
    };
    return listData;
  };

}

export interface MpgListData extends MpgItemData {
}