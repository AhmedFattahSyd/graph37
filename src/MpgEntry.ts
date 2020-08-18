import MpgItem, { MpgItemData, MpgItemState, MpgItemPrivacy, MpgExternalItemData } from "./MpgItem";
import { MpgItemType } from "./MpgItemType";
import * as firebase from "firebase/app";

export default class MpgEntry extends MpgItem {
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
    this._type = MpgItemType.Entry;
  }

  public static getBlankEntryData = (headline: string, notes: string = "") => {
    const data: MpgEntryData = {
      headline: headline,
      notes: notes,
      priority: 0,
      createdAt: firebase.firestore.Timestamp.fromDate(new Date()),
      updatedAt: firebase.firestore.Timestamp.fromDate(new Date()),
      type: MpgItemType.Entry,
      state: MpgItemState.Active,
      parkedUntil: firebase.firestore.Timestamp.fromDate(new Date()),
      sentiment: 0,
      overrideSentiment: false,
      privacy: MpgItemPrivacy.Personal,
    };
    return data;
  };

  getEntryData = (): MpgEntryData => {
    const entryData: MpgEntryData = {
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
    return entryData;
  };

  // public get netPriority(): number {
  //   return this.priority;
  //   // + Array.from(this.tags.values())
  //   //   .map(tag => {
  //   //     return tag.netPriority;
  //   //   })
  //   //   .reduce((sum, pri) => {
  //   //     return sum + pri;
  //   //   }, 0)
  // }

  public static fromEntryData = (id: string, data: MpgEntryData): MpgEntry => {
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
    let entry = new MpgEntry(
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
      entry.overrideSentiment = data.overrideSentiment
    }else{
      entry.overrideSentiment = false
    }
    if(data.privacy !== undefined){
      entry.privacy = data.privacy
    }else{
      entry.privacy = MpgItemPrivacy.Public
    }
    return entry;
  };

  public static fromImportedItemData = (data: MpgExternalItemData): MpgEntry => {
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
    let entry = new MpgEntry(
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
      entry.overrideSentiment = data.overrideSentiment
    }else{
      entry.overrideSentiment = false
    }
    if(data.privacy !== undefined){
      entry.privacy = data.privacy
    }else{
      entry.privacy = MpgItemPrivacy.Public
    }
    return entry;
  };
}

export interface MpgEntryData extends MpgItemData {}
