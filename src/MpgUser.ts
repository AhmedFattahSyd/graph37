import MpgItem, { MpgItemData, MpgItemState, MpgItemPrivacy } from "./MpgItem";
import * as firebase from 'firebase/app';
import { MpgItemType } from "./MpgItemType";

export default class MpgUser extends MpgItem {
  private _userSignedOn = false;
  public get userSignedOn() {
    return this._userSignedOn;
  }
  public set userSignedOn(value) {
    this._userSignedOn = value;
  }

  public static fromData = (id: string, data: MpgUserData): MpgUser => {
    let state = MpgItemState.Active
    let parkUntil: Date = new Date() 
    if(data.state !== undefined){
      state = data.state
    }
    if(data.parkedUntil !== undefined){
      parkUntil = data.parkedUntil.toDate()
    }
    const user = new MpgUser(
      id,
      data.headline,
      data.notes,
      data.createdAt.toDate(),
      data.updatedAt.toDate(),
      state,
      parkUntil,
    );
    if(data.overrideSentiment !== undefined){
      user.overrideSentiment = data.overrideSentiment
    }else{
      user.overrideSentiment = false
    }
    if(data.privacy !== undefined){
      user.privacy = data.privacy
    }else{
      user.privacy = MpgItemPrivacy.Public
    }
    return user
  };

  constructor(
    id: string,
    headline: string,
    notes: string = "",
    createAt: Date = new Date(),
    updatedAt: Date = new Date(),
    state: MpgItemState = MpgItemState.Active,
    parkedUntil: Date = new Date(),
  ) {
    super(id, headline, notes, createAt, updatedAt, 0,state,parkedUntil );
    this._type = MpgItemType.User;
  }

  public getData = (): MpgUserData =>{
    const data: MpgUserData ={
      headline: this.headline,
      notes: "",
      priority: 0,
      createdAt: firebase.firestore.Timestamp.fromDate(this.createdAt),
      updatedAt: firebase.firestore.Timestamp.fromDate(this.updatedAt),
      type: MpgItemType.User,
      state: this.state,
      parkedUntil: firebase.firestore.Timestamp.fromDate(this.parkedUntil),
      sentiment: this.sentiment,
      overrideSentiment: this.overrideSentiment,
      privacy: this.privacy,
    }
    return data
  }
}

export interface MpgUserData extends MpgItemData {}

