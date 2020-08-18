import MpgViewableItem from "./MpgViewableItem";
import * as firebase from "firebase/app";
import { MpgItemType } from "./MpgItemType";
import MpgEntry from "./MpgEntry";
import MpgTagRel from "./MpgTagRel";
import MpgParentRel from "./MpgParentRel";

export enum MpgItemState {
  Active = "Active",
  Parked = "Parked",
  Archived = "Archived",
  Done = "Done",
}

export enum MpgItemPrivacy {
  Public = "Public",
  Community = "Community",
  Personal = "Personal",
  Private = "Private",
}

export default class MpgItem extends MpgViewableItem {
  hasAllTags = (tagRels: Map<string, MpgTagRel>): boolean => {
    let hasAllTags = true;
    tagRels.forEach((tagRel) => {
      // console.log("hasAllTags: item:",this.headline,"tag:",tagRel.tag.headline)
      if (!this.hasTag(tagRel.tag)) {
        hasAllTags = false;
      }
    });
    // console.log("hasAlltags: ",hasAllTags)
    return hasAllTags;
    // return Array.from(tagRels.values())
    //   .map((tagRel) => this.hasTag(tagRel.tag))
    //   .reduce((acc, hasTag) => {
    //     return acc && hasTag;
    //   }, true);
  };

  private _privacy = MpgItemPrivacy.Personal;
  public get privacy() {
    return this._privacy;
  }
  public set privacy(value) {
    this._privacy = value;
  }

  private _overrideSentiment = false;
  public get overrideSentiment() {
    return this._overrideSentiment;
  }
  public set overrideSentiment(value) {
    this._overrideSentiment = value;
  }

  private _sentiment = 0;
  public get sentiment() {
    return this._sentiment;
  }
  public set sentiment(value) {
    this._sentiment = value;
  }

  archive = () => {
    this.state = MpgItemState.Archived;
  };

  makeActive = () => {
    this.state = MpgItemState.Active;
  };

  private _parentRels = new Map<string, MpgParentRel>();
  public get parentRels() {
    return this._parentRels;
  }
  public set parentRels(value) {
    this._parentRels = value;
  }
  // private _parents = new Map<string, MpgItem>();
  // public get parents() {
  //   return this._parents;
  // }
  // public set parents(value) {
  //   this._parents = value;
  // }

  private _childRels = new Map<string, MpgParentRel>();
  public get childRels() {
    return this._childRels;
  }
  public set childRels(value) {
    this._childRels = value;
  }

  // private _children = new Map<string, MpgItem>();
  // public get children() {
  //   return this._children;
  // }
  // public set children(value) {
  //   this._children = value;
  // }

  hasTag = (tag: MpgItem): boolean => {
    // this is the simple implementation
    // later on we will enhace to take into account the heirarchy of tags
    // return this.tagRels.has(tagItem.id);
    let hasTag = false;
    if (this.tagRels.size === 0) {
      return hasTag;
    } else {
      // console.log("hasTag: item:",this.headline,"tag:",tag.headline," decsendents:",tag.getDescendents())
      this.tagRels.forEach((tagRel) => {
        if (tagRel.tag.id === tag.id) {
          hasTag = true;
          // console.log("hasTag: hasTag:",hasTag)
          return;
        } else {
          // check descendents
          tag.getDescendents().forEach((descendent) => {
            if (tagRel.tag.id === descendent.id) {
              hasTag = true;
              // console.log("hasTag: hasTag:",hasTag)
              return;
            }
          });
        }
      });
    }
    // console.log("hasTag: hasTag:",hasTag)
    return hasTag;
  };

  // entries are the entries that are tagged with all tags in this entry
  // we will introduce entries that tagged by this particular entry
  // we shouldn't refer to subclasses
  // private _entries = new Map<string, MpgEntry>();
  // public get entries() {
  //   return this._entries;
  // }
  // public set entries(value) {
  //   this._entries = value;
  // }

  private _entryRels = new Map<string, MpgTagRel>();
  public get itemRels() {
    return this._entryRels;
  }
  public set itemRels(value) {
    this._entryRels = value;
  }

  private _tagRels = new Map<string, MpgTagRel>();
  public get tagRels() {
    return this._tagRels;
  }
  public set tagRels(value) {
    this._tagRels = value;
  }

  // private _tags = new Map<string, MpgTag>();
  // public get tags() {
  //   return this._tags;
  // }
  // public set tags(value) {
  //   this._tags = value;
  // }

  private _entriesWithAllTags = new Map<string, MpgEntry>();
  public get entriesWithAllTags() {
    return this._entriesWithAllTags;
  }
  public set entriesWithAllTags(value) {
    this._entriesWithAllTags = value;
  }

  // itemsHaveEntryInThierEntriesWithhAllTags
  // this the reverse of entriesWithhAllTags
  // items in this map can be entries or lists
  
  private _itemsHaveEntryInThierEntriesWithhAllTags = new Map<
    string,
    MpgItem
  >();
  public get itemsHaveEntryInTheirEntriesWithhAllTags() {
    return this._itemsHaveEntryInThierEntriesWithhAllTags;
  }
  public set itemsHaveEntryInTheirEntriesWithhAllTags(value) {
    this._itemsHaveEntryInThierEntriesWithhAllTags = value;
  }

  private _parkUntil: Date = new Date();
  public get parkedUntil(): Date {
    return this._parkUntil;
  }
  public set parkedUntil(value: Date) {
    this._parkUntil = value;
  }

  private _priority: number = 0;
  public get priority(): number {
    return this._priority;
  }
  public set priority(value: number) {
    this._priority = value;
  }
  private _cardExpanded = false;
  public get cardExpanded() {
    return this._cardExpanded;
  }
  public set cardExpanded(value) {
    this._cardExpanded = value;
  }

  private _childrenExpended = false;
  public get childrenExpended() {
    return this._childrenExpended;
  }
  public set childrenExpended(value) {
    this._childrenExpended = value;
  }

  public park = (numberOfHours: number = 1) => {
    this.state = MpgItemState.Parked;
    this.parkedUntil = new Date();
    this.parkedUntil.setHours(this.parkedUntil.getHours() + numberOfHours);
  };

  public parkOneDay = () => {
    this.state = MpgItemState.Parked;
    this.parkedUntil = new Date();
    this.parkedUntil.setHours(this.parkedUntil.getHours() + 24);
  };

  private _state = MpgItemState.Active;

  public get state() {
    // check date and change parked state if time is out
    if (this._state === MpgItemState.Parked) {
      const now = new Date();
      if (this.parkedUntil < now) {
        this._state = MpgItemState.Active;
      }
    }
    return this._state;
  }

  public set state(newState: MpgItemState) {
    this._state = newState;
  }

  private _notes: string;
  public get notes(): string {
    return this._notes;
  }
  public set notes(value: string) {
    this._notes = value;
  }

  private _createdAt: Date;
  public get createdAt(): Date {
    return this._createdAt;
  }
  public set createdAt(value: Date) {
    this._createdAt = value;
  }

  private _updateAt: Date;
  public get updatedAt(): Date {
    return this._updateAt;
  }
  public set updatedAt(value: Date) {
    this._updateAt = value;
  }

  static readonly postiveEmoji = "😀";
  static readonly negativeEmoji = "🙁";
  static readonly neutralEmoji = "😐";

  getSentimentEmoji = (): string => {
    let sentimentEmoji = MpgItem.neutralEmoji;
    if (this.sentiment > 0) {
      sentimentEmoji = MpgItem.postiveEmoji;
    }
    if (this.sentiment < 0) {
      sentimentEmoji = MpgItem.negativeEmoji;
    }
    return sentimentEmoji;
  };

  static getSentimentEmojiOfSentiment = (sentiment: number): string => {
    let sentimentEmoji = MpgItem.neutralEmoji;
    if (sentiment > 0) {
      sentimentEmoji = MpgItem.postiveEmoji;
    }
    if (sentiment < 0) {
      sentimentEmoji = MpgItem.negativeEmoji;
    }
    return sentimentEmoji;
  };

  static getSentimentTextOfSentiment = (sentiment: number): string => {
    return sentiment > 0
      ? "+" +
          sentiment.toFixed(2) +
          " " +
          MpgItem.getSentimentEmojiOfSentiment(sentiment)
      : sentiment.toFixed(2) +
          " " +
          MpgItem.getSentimentEmojiOfSentiment(sentiment);
  };

  getNetSentimentEmoji = (): string => {
    let netSentimentEmoji = MpgItem.neutralEmoji;
    if (this.netSentiment > 0) {
      netSentimentEmoji = MpgItem.postiveEmoji;
    }
    if (this.netSentiment < 0) {
      netSentimentEmoji = MpgItem.negativeEmoji;
    }
    return netSentimentEmoji;
  };

  getSentimentText = (): string => {
    return this.sentiment > 0
      ? "+" + this.sentiment.toFixed(2) + this.getSentimentEmoji()
      : this.sentiment.toFixed(2) + this.getSentimentEmoji();
  };

  getNetSentimentText = (): string => {
    return this.netSentiment > 0
      ? "+" + this.netSentiment.toFixed(2) + this.getNetSentimentEmoji()
      : this.netSentiment.toFixed(2) + this.getNetSentimentEmoji();
  };

  getFullSentimentText = (): string => {
    return this.getSentimentText() + "(" + this.getNetSentimentText() + ")";
  };

  constructor(
    id: string,
    headline: string,
    notes: string = "",
    createAt: Date = new Date(),
    updatedAt: Date = new Date(),
    priority: number,
    state: MpgItemState,
    parkedUntil: Date,
    sentiment: number = 0
  ) {
    super(MpgItemType.Item, id, headline);
    this._type = MpgItemType.Item;
    this._priority = priority;
    this._notes = notes;
    this._createdAt = createAt;
    this._updateAt = updatedAt;
    this.state = state;
    this.parkedUntil = parkedUntil;
    this.sentiment = sentiment;
  }

  getItemData = (): MpgItemData => {
    const itemData: MpgItemData = {
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
    return itemData;
  };

  public get netPriority(): number {
    let netPriority = this.priority;
    this.tagRels.forEach((tagRel) => {
      netPriority += tagRel.tag.priority;
    });
    return netPriority;
  }

  public get netSentiment(): number {
    // net setiment = item's sentiment + sum of its tags' sentimet
    let netSentiment = this.sentiment;
    // add parent's entiment
    // we can here use net sentiment
    // it should not be infinitly recursive because we don't allow circular graphs
    // we should limit this to tags
    // if (this.type === MpgItemType.Tag) {
    //   if (this.parentRels.size > 0) {
    //     //   let sumOfParentsSentiment = 0;
    //     //   this.parentRels.forEach((parentRel) => {
    //     //     sumOfParentsSentiment += parentRel.parent.netSentiment;
    //     //   });
    //     //   const averageOfParentSentiment =
    //     //     sumOfParentsSentiment / this.parentRels.size;
    //     //   netSentiment = (netSentiment + averageOfParentSentiment) / 2

    //     // try an additive formula
    //     this.parentRels.forEach((parentRel) => {
    //       netSentiment += parentRel.parent.netSentiment;
    //     });
    //   }
    // }
    // add tag's netSentiment
    // it should not be recursive
    if (this.tagRels.size > 0) {
      this.tagRels.forEach((tagRel) => {
        // let sumOfTagsSentiment = 0;
        // sumOfTagsSentiment += tagRel.tag.netSentiment;
        // const averageOfTagsSentiment = sumOfTagsSentiment / this.tagRels.size;
        // netSentiment = (netSentiment + averageOfTagsSentiment) / 2;
        netSentiment += tagRel.tag.netSentiment;
      });
    }
    // add average of all entriries with tags
    // we cannot use netSentiment here becuase it can be infinitly recursive
    // perhapse we should limit this to lists
    if (this.type === MpgItemType.List) {
      if (this.entriesWithAllTags.size > 0) {
        let sumOfEntriesSentiment = 0;
        this.entriesWithAllTags.forEach((entry) => {
          sumOfEntriesSentiment += entry.sentiment;
          entry.tagRels.forEach((tagRel) => {
            sumOfEntriesSentiment += tagRel.tag.netSentiment;
          });
        });
        netSentiment += sumOfEntriesSentiment / this.entriesWithAllTags.size;
      }
    }
    return netSentiment;
  }

  public updateFromItemData = (itemData: MpgItemData) => {
    this.headline = itemData.headline;
    this.notes = itemData.notes;
    this.updatedAt = itemData.updatedAt.toDate();
    this.priority = itemData.priority;
    if (itemData.state !== undefined) {
      this.state = itemData.state;
    } else {
      this.state = MpgItemState.Active;
    }
    if (itemData.parkedUntil !== undefined) {
      this.parkedUntil = itemData.parkedUntil.toDate();
    } else {
      this.parkedUntil = new Date();
    }
    if (itemData.sentiment !== undefined) {
      this.sentiment = itemData.sentiment;
    } else {
      this.sentiment = 0;
    }
    if (itemData.overrideSentiment !== undefined) {
      this.overrideSentiment = itemData.overrideSentiment;
    } else {
      this.overrideSentiment = false;
    }
    if (itemData.privacy !== undefined) {
      this.privacy = itemData.privacy;
    } else {
      this.privacy = MpgItemPrivacy.Public;
    }
  };

  // archive = ()=>{
  //   this.state = MpgItemState.Archived
  // }

  getShortHeadline = () => {
    let shortHeadline = this.headline.substring(0, 20);
    if (shortHeadline.length < this.headline.length) {
      shortHeadline += "...";
    }
    return shortHeadline;
  };

  getAgeFormatted = (): string => {
    var now = new Date();
    // var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    var yearNow = now.getFullYear();
    var monthNow = now.getMonth();
    var dateNow = now.getDate();

    let creationDate = this._createdAt;

    var yearDob = creationDate.getFullYear();
    var monthDob = creationDate.getMonth();
    var dateDob = creationDate.getDate();

    var ageString = "";
    var yearString = "";
    var monthString = "";
    var dayString = "";

    let yearAge = yearNow - yearDob;

    if (monthNow >= monthDob) var monthAge = monthNow - monthDob;
    else {
      yearAge--;
      monthAge = 12 + monthNow - monthDob;
    }

    if (dateNow >= dateDob) var dateAge = dateNow - dateDob;
    else {
      monthAge--;
      dateAge = 31 + dateNow - dateDob;

      if (monthAge < 0) {
        monthAge = 11;
        yearAge--;
      }
    }

    const age = {
      years: yearAge,
      months: monthAge,
      days: dateAge,
    };

    if (age.years > 1) yearString = " years";
    else yearString = " year";
    if (age.months > 1) monthString = " months";
    else monthString = " month";
    if (age.days > 1) dayString = " days";
    else dayString = " day";

    if (age.years > 0 && age.months > 0 && age.days > 0)
      ageString =
        age.years +
        yearString +
        ", " +
        age.months +
        monthString +
        ", and " +
        age.days +
        dayString +
        " old.";
    else if (age.years === 0 && age.months === 0 && age.days >= 0)
      ageString = "" + age.days + dayString + "";
    else if (age.years > 0 && age.months === 0 && age.days === 0)
      ageString = age.years + yearString + "";
    else if (age.years > 0 && age.months > 0 && age.days === 0)
      ageString = age.years + yearString + ", " + age.months + monthString + "";
    else if (age.years === 0 && age.months > 0 && age.days > 0)
      ageString = age.months + monthString + ", " + age.days + dayString + "";
    else if (age.years > 0 && age.months === 0 && age.days > 0)
      ageString = age.years + yearString + ", " + age.days + dayString + "";
    else if (age.years === 0 && age.months > 0 && age.days === 0)
      ageString = age.months + monthString + "";
    else ageString = "";

    return ageString;
  };

  getExternalItemData = (): MpgExternalItemData => {
    const exportedItemData: MpgExternalItemData = {
      id: this.id,
      headline: this.headline,
      notes: this.notes,
      type: this.type,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      state: this.state,
      parkedUntil: this.parkedUntil,
      sentiment: this.sentiment,
      overrideSentiment: this.overrideSentiment,
      privacy: this.privacy,
    };
    return exportedItemData;
  };

  public getAncestors = (
    ancestors: Map<string, MpgItem> = new Map()
  ): Map<string, MpgItem> => {
    this.parentRels.forEach((parentRel) => {
      if (!ancestors.has(parentRel.parent.id))
        ancestors.set(parentRel.parent.id, parentRel.parent);
      parentRel.parent.getAncestors(ancestors);
    });
    return ancestors;
  };

  public getDescendents = (
    descendents: Map<string, MpgItem> = new Map()
  ): Map<string, MpgItem> => {
    this.childRels.forEach((parentRel) => {
      if (!descendents.has(parentRel.child.id))
        descendents.set(parentRel.id, parentRel.child);
      parentRel.child.getDescendents(descendents);
    });
    return descendents;
  };
}

export interface MpgItemData {
  headline: string;
  notes: string;
  type: MpgItemType;
  createdAt: firebase.firestore.Timestamp;
  updatedAt: firebase.firestore.Timestamp;
  priority: number;
  // add state and parked until
  state: MpgItemState;
  parkedUntil: firebase.firestore.Timestamp;
  sentiment: number;
  overrideSentiment: boolean;
  privacy: MpgItemPrivacy;
}

export interface MpgExternalItemData {
  id: string,
  headline: string;
  notes: string;
  type: MpgItemType;
  createdAt: Date;
  updatedAt: Date;
  priority: number;
  state: MpgItemState;
  parkedUntil: Date;
  sentiment: number;
  overrideSentiment: boolean;
  privacy: MpgItemPrivacy;
}
