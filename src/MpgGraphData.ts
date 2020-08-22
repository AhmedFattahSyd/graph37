import { FirebaseConfig } from './FirebaseConfig';
import { MpgItemType } from "./MpgItemType";
import MpgRel, { MpgRelType, MpgRelData, MpgExternalRelData } from "./MpgRel";
import MpgUser, { MpgUserData } from "./MpgUser";
import * as firebase from "firebase/app";
import "firebase/app";
import "firebase/firebase-firestore";
import "firebase/auth";
import "firebase/storage";
import MpgItem, { MpgItemData, MpgExternalItemData } from "./MpgItem";
import MpgTag from "./MpgTag";
import MpgEntry from "./MpgEntry";
import MpgList from "./MpgList";
import MpgTagRel from "./MpgTagRel";
import MpgParentRel from "./MpgParentRel";
// import * as sentiment from "sentiment"
const sentiment = require("sentiment");

export enum MessageType {
  Information = "Information",
  Error = "Error",
}

export enum MpgTimelineRange {
  Day = "Day",
  Week = "Week",
  Month = "Month",
  All = "All",
}

interface MpgExternalData {
  dataVerionNumber: number;
  dataVersionText: string;
  exportedAt: Date;
  user: MpgExternalItemData;
  graphData: {
    entries: MpgExternalItemData[];
    tags: MpgExternalItemData[];
    lists: MpgExternalItemData[];
    rels: MpgExternalRelData[];
  };
}

interface MpgImportedItems {
  entries: Map<string, MpgEntry>;
  tags: Map<string, MpgTag>;
  lists: Map<string, MpgList>;
  items: Map<string, MpgItem>;
}

export default class MpgGraphData {
  private dataVersionNumber = 1;
  private dataVersionText = "V1 - 11 June 2020";
  private auth: firebase.auth.Auth | null = null;
  private db: firebase.firestore.Firestore | null = null;
  private authUser: firebase.User | null = null;
  private refreshData: Function;
  private user: MpgUser | null;
  private entries: Map<string, MpgEntry> = new Map();
  private tags: Map<string, MpgTag> = new Map();
  private items: Map<string, MpgItem> = new Map();
  private initialLoadInProgress = true;
  private rels: Map<string, MpgRel> = new Map();
  private lists: Map<string, MpgList> = new Map();
  private itemsLoaded = 0;
  private relsLoaded = 0;
  private sentiment = new sentiment();
  private importedRawData: MpgExternalData | null = null;
  private importedItems: MpgImportedItems | null = null;
  private dateEntryMap: Map<number, Map<string, MpgEntry>> = new Map();
  private earlistEntryDate: number = 0;
  private timelineRange: MpgTimelineRange = MpgTimelineRange.All;
  readonly dayInMilliseconds = 1000 * 60 * 60 * 24;
  
  constructor(user: MpgUser | null, refreshData: Function) {
    this.refreshData = refreshData;
    this.user = user;
  }

  initialise = async () => {
    await this.initialiseFirebase();
  };

  updateDateEntryMap = () => {
    this.dateEntryMap = new Map();
    // insert as created at
    const entryArray = Array.from(this.entries.values());
    let sortedEntries = entryArray.sort((item1, item2) => {
      return item2.createdAt.getTime() - item1.createdAt.getTime();
    });
    this.earlistEntryDate = entryArray[0].createdAt.getDate()
    sortedEntries.forEach((entry) => {
      // add element for createdAt and updatedAt
      this.addEntryToDateEntryMap(entry, entry.createdAt);
    });
    // updatedAt
    sortedEntries = entryArray.sort((item1, item2) => {
      return item2.updatedAt.getTime() - item1.updatedAt.getTime();
    });
    sortedEntries.forEach((entry) => {
      // add element for createdAt and updatedAt
      this.addEntryToDateEntryMap(entry, entry.updatedAt);
    });
  };

  updateTimelineRange = (timelineRange: MpgTimelineRange) => {
    this.timelineRange = timelineRange;
    this.updateDateEntryMap();
    this.invokeRefreshData();
  };

  addEntryToDateEntryMap = (entry: MpgEntry, date: Date) => {
    const dateCopy = new Date(date.getTime())
    const dateAtMidnight = dateCopy.setHours(24, 0, 0, 0);
    let numberOfDaysSinceStart = Math.floor(
      (dateAtMidnight - this.earlistEntryDate) / this.dayInMilliseconds
    );
    let entriesDate = this.dateEntryMap.get(numberOfDaysSinceStart);
    if (entriesDate === undefined) {
      entriesDate = new Map<string, MpgEntry>();
    }
    entriesDate.set(entry.id, entry);
    this.dateEntryMap.set(numberOfDaysSinceStart, entriesDate);
  };

  getTimelineRangeDate = (): Date => {
    switch (this.timelineRange) {
      case MpgTimelineRange.Day:
        return new Date();
      case MpgTimelineRange.Week:
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
      default:
        return new Date(this.earlistEntryDate);
    }
  };

  initialiseFirebase = async () => {
    try {
      // need to understand how not put these values in the source file
      // documentation states that:
      // The Firebase config object contains unique, but non-secret identifiers for your Firebase project.
      // const firebaseConfig = {
      //   apiKey: "AIzaSyBmL90LnwnHO2CJ4xRKV9dttX_-SCGD-aA",
      //   authDomain: "ahmedfattahsydgraph37.firebaseapp.com",
      //   databaseURL: "https://ahmedfattahsydgraph37.firebaseio.com",
      //   projectId: "ahmedfattahsydgraph37",
      //   storageBucket: "ahmedfattahsydgraph37.appspot.com",
      //   messagingSenderId: "363893096993",
      //   appId: "1:363893096993:web:ebd283d828838483cb1960",
      // };
      firebase.initializeApp(FirebaseConfig);
      // this enable local persistence
      await firebase.firestore().enablePersistence();
      this.auth = firebase.auth();
      this.db = firebase.firestore();
      if (this.auth !== null) {
        this.auth.onAuthStateChanged((authUser) => {
          authUser
            ? this.initUserAndLoadData(authUser)
            : (this.authUser = null);
          this.invokeRefreshData();
        });
      } else {
        throw new Error(
          "MpgGraphData: initFirebase: Cannot set listener on auth. auth is null"
        );
      }
    } catch (error) {
      throw error;
    }
  };

  invokeRefreshData = async () => {
    await this.refreshData(
      this.user,
      this.entries,
      this.tags,
      this.items,
      this.lists,
      this.initialLoadInProgress,
      this.itemsLoaded,
      this.relsLoaded,
      this.rels,
      this.earlistEntryDate,
      this.dateEntryMap
    );
  };

  initUserAndLoadData = async (authUser: firebase.User) => {
    this.authUser = authUser;
    await this.checkUserAndCreateIfNew();
    await this.invokeRefreshData();
  };

  createNewItem = async (
    itemType: MpgItemType,
    headline: string,
    notes: string = ""
  ): Promise<string | undefined> => {
    try {
      let collectionName = "";
      let itemData: MpgItemData;
      switch (itemType) {
        case MpgItemType.Entry:
          collectionName = "entries";
          itemData = MpgEntry.getBlankEntryData(headline, notes);
          const sentimentResult = this.sentiment.analyze(headline);
          itemData.sentiment = sentimentResult.comparative;
          // console.log("createNewItem: sentimentResult:",sentimentResult)
          break;
        case MpgItemType.Tag:
          collectionName = "tags";
          itemData = MpgTag.getBlankTagData(headline, notes);
          break;
        case MpgItemType.List:
          collectionName = "lists";
          itemData = MpgList.getBlankListData(headline, notes);
          break;
        default:
          throw new Error(
            `MpgGraphData: createNewItem: invalid type: ${itemType}`
          );
      }
      if (this.db !== null) {
        if (this.authUser !== null) {
          if (this.authUser !== null) {
            if (this.authUser.uid !== null) {
              const docRef = await this.db
                .collection("users")
                .doc(this.authUser.uid)
                .collection(collectionName)
                .add(itemData);
              // await this.onItemAdded(docRef.id, itemData);
              return docRef.id;
            } else {
              throw new Error("createNewItem: user uid is null");
            }
          } else {
            throw new Error("createNewItem: auth user is null");
          }
        } else {
          throw new Error("createNewItem: db is null");
        }
      }
    } catch (error) {
      throw error;
    }
  };

  onItemAdded = (itemId: string, itemData: MpgItemData) => {
    switch (itemData.type) {
      case MpgItemType.Entry:
        const newEntry = MpgEntry.fromEntryData(itemId, itemData);
        this.entries.set(itemId, newEntry);
        this.items.set(itemId, newEntry);
        this.updateDateEntryMap();
        break;
      case MpgItemType.Tag:
        const newTag = MpgTag.fromTagData(itemId, itemData);
        this.tags.set(itemId, newTag);
        this.items.set(itemId, newTag);
        break;
      case MpgItemType.List:
        const newList = MpgList.fromListData(itemId, itemData);
        this.lists.set(itemId, newList);
        this.items.set(itemId, newList);
        break;
      default:
        throw new Error(
          `MpgGraphData: onItemAdded: invalid type: ${itemData.type}`
        );
    }
    this.invokeRefreshData();
  };

  onRelAdded = async (relId: string, relData: MpgRelData) => {
    try {
      const item1 = this.items.get(relData.item1Id);
      if (item1 !== undefined) {
        const item2 = this.items.get(relData.item2Id);
        if (item2 !== undefined) {
          const newRel = new MpgRel(relId, item1, item2, relData.type);
          this.rels.set(relId, newRel);
          // console.log("onRelAdded: rels:", this.rels);
          this.handleRelAdded(newRel);
        } else {
          throw new Error(
            `GraphData: onRelAdded: item2 was not found. id:${relData.item2Id}`
          );
        }
        this.invokeRefreshData();
      } else {
        throw new Error(
          `GraphData: onRelAdded: item1 was not found. id:${relData.item1Id}`
        );
      }
    } catch (error) {
      throw error;
    }
  };

  onItemRemoved = async (itemId: string, itemData: MpgItemData) => {
    this.items.delete(itemId);
    switch (itemData.type) {
      case MpgItemType.Entry:
        this.entries.delete(itemId);
        this.updateDateEntryMap();
        break;
      case MpgItemType.Tag:
        this.tags.delete(itemId);
        break;
      case MpgItemType.List:
        this.lists.delete(itemId);
        break;
      default:
        throw new Error(
          `MpgGraphData: onItemAdded: invalid type: ${itemData.type}`
        );
    }
    this.invokeRefreshData();
  };

  onRelRemoved = async (relId: string, relData: MpgRelData) => {
    try {
      // remove the rel from where it is been used
      const rel = this.rels.get(relId);
      // console.log("onRelRemoved: relId:",relId,", relData:",relData)
      if (rel !== undefined) {
        // handle removal of rel
        switch (relData.type) {
          case MpgRelType.Tag:
            this.handleTagRelRemoved(rel);
            break;
          case MpgRelType.Parent:
            this.handleParentRelRemoved(rel);
            break;
          default:
            throw new Error(
              `MpgGraphData: onRelRemoved: invalid relType:${relData.type}`
            );
        }
        this.invokeRefreshData();
      } else {
        throw new Error(`MpgGraphData: onRelRemoved: rel was not found`);
      }
      // should consider removing rels as it's not used
      // const relDeleted = this.rels.delete(relId);
      // if (!relDeleted) {
      //   throw new Error(`GraphData: onRelremoved: rel was not found`);
      // }
      // const entry = this.entries.get(relData.item1Id);
      // if (entry !== undefined) {
      //   const tag = this.tags.get(relData.item2Id);
      //   if (tag !== undefined) {
      //     entry.tags.delete(relData.item2Id);
      //     this.rels.delete(relId);
      //     this.populateEntriesForItem(entry);
      //     this.populateEntriesForItem(tag);
      //   } else {
      //     throw new Error(`MpgGraphData: onRelRemoved: item2 was not found`);
      //   }
      // } else {
      //   throw new Error(`MpgGraphData: onRelRemoved: item1 was not found`);
      // }
    } catch (error) {
      throw error;
    }
  };

  handleTagRelRemoved = (tagRel: MpgTagRel) => {
    try {
      // this.updateEntriesWithAllTagsOnRelRemoved(
      //   tagRel.item1,
      //   tagRel.item2 as MpgTag
      // );
      // get current entryRels
      // const currentEntryRels = tagRel.item2.entryRels
      // get item1
      const item1 = tagRel.item1;
      // console.log("handleTagRelRemoved: tagRel:",tagRel)
      // remove tagRel from item
      if (item1.tagRels.delete(tagRel.id)) {
        // tagRel removed
        // now remove from tag
        const tag = tagRel.item2;
        if (tag.itemRels.delete(tagRel.id)) {
          // tagRel removed successfully
          // now repopulate entriesWithAllTags
          // currentEntryRels.forEach(entryRel=>{
          //   this.populateItemEntriesWithAllTags(entryRel.item1);
          // })
          // this.removeEntriesWithTagOfItem(tagRel.item1, tagRel.item2 as MpgTag);
          // this.populateEntriesWithAllTagsForAllItems();
        } else {
          throw new Error(
            `MpgGraphData: handleTagRelRemoved: entryRel was not found in tag:${tag.headline}`
          );
        }
      } else {
        // tagRel was not found
        throw new Error(
          `MpgGraphData: handleTagRelRemoved: tagRel was not found in item:${item1.headline}`
        );
      }
    } catch (error) {
      throw error;
    }
  };

  handleParentRelRemoved = (parentRel: MpgParentRel) => {};

  addNewEntryToEntriesOfItem = async (
    mainEntryId: string,
    newEntryHeadline: string
  ) => {
    try {
      // create the new entry
      const newItemId = await this.createNewItem(
        MpgItemType.Entry,
        newEntryHeadline
      );
      if (newItemId !== undefined) {
        // this may create duplicate tags
        // I have not been able to fix due to the async nature of firebase
        // when I'm adding tags later, the item has not been populated with tags
        await this.detectTagsAndAddThemToItem(newItemId);
        await this.addExistingEntryToEntriesOfItem(mainEntryId, newItemId);
      } else {
        throw new Error(
          `MpgGraphData: tagItemWithNewItem: newItemId is undefined`
        );
      }
    } catch (error) {
      throw error;
    }
  };

  detectTagsAndAddThemToItem = async (itemId: string) => {
    const item = this.items.get(itemId);
    if (item !== undefined) {
      if (item.type !== MpgItemType.Tag) {
        this.tags.forEach(async (tag) => {
          if (
            // consider adding notes
            item.headline.toLowerCase().includes(tag.headline.toLowerCase())
          ) {
            await this.tagItemWithExistingTag(item.id, tag.id);
          }
        });
      } else {
        // we don't add tags to tags
      }
    } else {
      throw new Error(`detectTagsAndAddThemToItem: item was not found`);
    }
  };

  getMatchedEntries = (searchText: string): Map<string, MpgEntry> => {
    const foundEntries = new Map<string, MpgEntry>();
    this.entries.forEach((entry) => {
      if (
        (entry.headline.toLowerCase() + entry.notes.toLowerCase()).includes(
          searchText.toLowerCase()
        )
      ) {
        foundEntries.set(entry.id, entry);
      }
    });
    return foundEntries;
  };

  getMatchedLists = (searchText: string): Map<string, MpgList> => {
    const foundLists = new Map<string, MpgList>();
    this.lists.forEach((list) => {
      if (
        (list.headline.toLowerCase() + list.notes.toLowerCase()).includes(
          searchText.toLowerCase()
        )
      ) {
        foundLists.set(list.id, list);
      }
    });
    return foundLists;
  };

  getMatchedTags = (searchText: string): Map<string, MpgTag> => {
    const foundTags = new Map<string, MpgTag>();
    this.tags.forEach((tag) => {
      if (
        (tag.headline.toLowerCase() + tag.notes.toLowerCase()).includes(
          searchText.toLowerCase()
        )
      ) {
        foundTags.set(tag.id, tag);
      }
    });
    return foundTags;
  };

  removeEntryFromItem = async (mainEntry: MpgItem, entryToRemove: MpgItem) => {
    //remove all tags of mainEntry from entryToRemove
    mainEntry.tagRels.forEach(async (tagRel) => {
      await this.removeTagFromItem(entryToRemove, tagRel.tag.id);
    });
    //repopulate entries of mainEntry
    // this.populateEntriesWithAllTagsForItem(mainEntry);
  };

  addExistingEntryToEntriesOfItem = async (
    mainEntryId: string,
    entryToAdd: string
  ) => {
    try {
      // add mainEntry tags to the entryToAdd
      const newEntry = this.entries.get(entryToAdd);
      if (newEntry !== undefined) {
        const mainItem = this.items.get(mainEntryId);
        if (mainItem !== undefined) {
          if (mainItem.type === MpgItemType.Tag) {
            await this.tagItemWithExistingTag(entryToAdd, mainItem.id);
          } else {
            // for entries and lists add all tags
            mainItem.tagRels.forEach(async (tagRel) => {
              await this.tagItemWithExistingTag(entryToAdd, tagRel.tag.id);
            });
            // this.populateEntriesWithAllTagsForItem(mainItem);
          }
        } else {
          throw new Error(
            `GraphData: addExistingEntryToEntriesOfEntry main entry was not found`
          );
        }
      } else {
        throw new Error(
          `GraphData: addExistingEntryToEntriesOfEntry new entry was not found`
        );
      }
    } catch (error) {
      throw error;
    }
  };

  tagItemWithNewTag = async (taggedItemId: string, newTagHeadline: string) => {
    try {
      // create the new tag
      const newTagId = await this.createNewItem(
        MpgItemType.Tag,
        newTagHeadline
      );
      if (newTagId !== undefined) {
        this.tagItemWithExistingTag(taggedItemId, newTagId);
      } else {
        throw new Error(
          `MpgGraphData: tagItemWithNewItem: newItemId is undefined`
        );
      }
    } catch (error) {
      throw error;
    }
  };

  addNewChildFromNewItem = async (item: MpgItem, newItemHeadline: string) => {
    try {
      // create the new item
      const newItemId = await this.createNewItem(item.type, newItemHeadline);
      if (newItemId !== undefined) {
        this.addChildFromExistingItem(item, newItemId);
      } else {
        throw new Error(
          `MpgGraphData: addNewChildFromNewItem: newItemId is undefined`
        );
      }
    } catch (error) {
      throw error;
    }
  };

  addNewParentFromNewItem = async (item: MpgItem, newItemHeadline: string) => {
    try {
      // create the new item
      const newItemId = await this.createNewItem(item.type, newItemHeadline);
      if (newItemId !== undefined) {
        this.addParentFromExistingItem(item, newItemId);
      } else {
        throw new Error(
          `MpgGraphData: addNewChildFromNewItem: newItemId is undefined`
        );
      }
    } catch (error) {
      throw error;
    }
  };

  public tagItemWithExistingTag = async (
    taggedItemId: string,
    tagId: string
  ) => {
    try {
      // create a rel between the two items
      // make sure you don't include a tag twice
      const item = this.items.get(taggedItemId);
      if (item !== undefined) {
        const tag = this.tags.get(tagId);
        if (tag !== undefined) {
          if (!item.hasTag(tag)) {
            await this.createNewRel(MpgRelType.Tag, taggedItemId, tagId);
          } else {
            // do nothing. tag is already there
          }
        } else {
          throw new Error(
            `MpgGraphData: tagItemWithExistingTag: tag was not found`
          );
        }
      } else {
        throw new Error(
          `MpgGraphData: tagItemWithExistingTag: item was not found`
        );
      }
    } catch (error) {
      throw error;
    }
  };

  addChildFromExistingItem = async (item: MpgItem, childId: string) => {
    try {
      // create a rel between the two items
      await this.createNewRel(MpgRelType.Parent, item.id, childId);
      // add parent's tags to child
      item.tagRels.forEach(async (tagRel) => {
        await this.tagItemWithExistingTag(childId, tagRel.tag.id);
      });
    } catch (error) {
      throw error;
    }
  };

  addParentFromExistingItem = async (item: MpgItem, parentId: string) => {
    try {
      // create a rel between the two items
      await this.createNewRel(MpgRelType.Parent, parentId, item.id);
      // add parent's tags to child
      const parent = this.items.get(parentId);
      if (parent !== undefined) {
        parent.tagRels.forEach(async (tagRel) => {
          await this.tagItemWithExistingTag(item.id, tagRel.tag.id);
        });
      } else {
        throw new Error(
          `GraphData: addParentFromExistingItem: parent was not found`
        );
      }
    } catch (error) {
      throw error;
    }
  };

  public removeTagFromItem = async (item: MpgItem, tagItemId: string) => {
    try {
      item.tagRels.forEach(async (tagRel) => {
        if (tagRel.tag.id === tagItemId) {
          await this.removeTagAndEntryOfTagRel(tagRel);
        }
      });
    } catch (error) {
      throw error;
    }
  };

  createNewRel = async (type: MpgRelType, item1Id: string, item2Id: string) => {
    try {
      let relData = MpgRel.getBlankRelData(type, item1Id, item2Id);
      if (this.db !== null) {
        if (this.authUser !== null) {
          if (this.authUser !== null) {
            if (this.authUser.uid !== null) {
              const docRef = await this.db
                .collection("users")
                .doc(this.authUser.uid)
                .collection("rels")
                .add(relData);
              // await this.onRelAdded(docRef.id, relData);
              return docRef.id;
            } else {
              throw new Error("createNewRel: user uid is null");
            }
          } else {
            throw new Error("createNewRel: auth user is null");
          }
        } else {
          throw new Error("createNewRel: db is null");
        }
      }
    } catch (error) {
      throw error;
    }
  };

  updateLocalItems = async (
    itemSnapshot: firebase.firestore.QuerySnapshot<
      firebase.firestore.DocumentData
    >
  ) => {
    if (!this.initialLoadInProgress) {
      itemSnapshot.docChanges().forEach(async (docChange) => {
        // if change is local do nothing
        // if (!docChange.doc.metadata.hasPendingWrites) {
        // var source = docChange.doc.metadata.hasPendingWrites ? "Local" : "Server";
        // console.log(source, " doc: ", docChange.doc)
        const itemData = docChange.doc.data() as MpgItemData;
        const itemId = docChange.doc.id;
        switch (docChange.type) {
          case "added":
            this.onItemAdded(itemId, itemData);
            break;
          case "removed":
            this.onItemRemoved(itemId, itemData);
            break;
          case "modified":
            this.onItemModified(itemId, itemData);
            break;
          default:
            throw new Error(
              `MpgGraphData: updateLocalItems: unsupported change type: ${docChange.type}`
            );
        }
        // await this.invokeRefreshData();
        // } else {
        //   // do nothing as the change is local and has been updated
        // }
        await this.invokeRefreshData();
      });
    }
  };

  updateLocalRels = async (
    itemSnapshot: firebase.firestore.QuerySnapshot<
      firebase.firestore.DocumentData
    >
  ) => {
    // console.log("updateLocalRels")
    if (!this.initialLoadInProgress) {
      itemSnapshot.docChanges().forEach(async (docChange) => {
        // if (!docChange.doc.metadata.hasPendingWrites) {
        // console.log("updateLoacalRels: change is remote, update memory")
        const relData = docChange.doc.data() as MpgRelData;
        const relId = docChange.doc.id;
        switch (docChange.type) {
          case "added":
            this.onRelAdded(relId, relData);
            break;
          case "removed":
            this.onRelRemoved(relId, relData);
            break;
          // there is no modify operation for rel
          // case "modified":
          //   break;
          default:
            throw new Error(
              `MpgGraphData: updateLocalRels: unsupported change type: ${docChange.type}`
            );
        }
        // await this.invokeRefreshData();
        // } else {
        //   console.log("updateLoacalRels: change is local, don't do anthing")
        //   // do nothing, change is local and has been updated
        // }
        // console.log("Rfreshing data");
        await this.invokeRefreshData();
      });
    }
  };

  removeTagAndEntryOfTagRel = async (tagRel: MpgTagRel) => {
    try {
      // we handle removing tag in app data in the onRelRemoved
      // // remove from the tag
      // const entryDeleted = tagRel.tag.entryRels.delete(tagRel.id);
      // if (!entryDeleted) {
      //   throw new Error(`GraphData: removeTagAndEntryOfTagRel: tag:${tagRel.tag.headline} does not have
      //   entry:${tagRel.item.headline}`);
      // }
      // // remove from this item itself
      // const tagDeleted = tagRel.item.tagRels.delete(tagRel.id);
      // if (!tagDeleted) {
      //   throw new Error(`GraphData: removeTagAndEntryOfTagRel: item:${tagRel.item.headline} does not have
      //     tag:${tagRel.tag.headline}`);
      // }
      // console.log("removeTagAndEntryOfTagRel: tegRel:",tagRel)
      await this.deleteRel(tagRel);
    } catch (error) {
      throw error;
    }
  };

  removeParentAndChildOfParentRel = async (parentRel: MpgParentRel) => {
    try {
      const childDeleted = parentRel.parent.childRels.delete(parentRel.id);
      if (!childDeleted) {
        throw new Error(`GraphData: removeParentAndChildOfParentRel: parent:${parentRel.parent.headline} does not have
        cild:${parentRel.child.headline}`);
      }
      const parentDeleted = parentRel.child.parentRels.delete(parentRel.id);
      if (!parentDeleted) {
        throw new Error(`GraphData: removeParentAndChildOfParentRel: child:${parentRel.child.headline} does not have
        parent:${parentRel.parent.headline}`);
      }
      await this.deleteRel(parentRel);
    } catch (error) {
      throw error;
    }
  };

  removeAllRelsForItem = async (item: MpgItem) => {
    // delete tag rels
    // console.log("removeAllRelsForItem: item:",item)
    item.tagRels.forEach(async (tagRel) => {
      await this.removeTagAndEntryOfTagRel(tagRel);
    });
    // delete entry rel
    item.itemRels.forEach(async (tagRel) => {
      await this.removeTagAndEntryOfTagRel(tagRel);
    });
    item.parentRels.forEach(async (parentRel) => {
      await this.removeParentAndChildOfParentRel(parentRel);
    });
    item.childRels.forEach(async (parentRel) => {
      await this.removeParentAndChildOfParentRel(parentRel);
    });
    // this.rels.forEach(async (rel) => {
    //   if (rel.item1.id === item.id || rel.item2.id === item.id) {
    //     switch (rel.relType) {
    //       case MpgRelType.Tag:
    //         this.removeTagsOfRel(rel);
    //         break;
    //       case MpgRelType.Parent:
    //         await this.removeParentsOfRel(rel);
    //         break;
    //       default:
    //         throw new Error(
    //           `GraphData: reloveAllRelsForItem. invalid rel.typr:${rel.type}`
    //         );
    //     }
    //     await this.deleteRel(rel);
    //   }
    // });
  };

  // removeTagsOfRel = async (rel: MpgRel) => {
  //   // this is used when an item is deleted
  //   // I think we can do it much better
  //   // const tagDeleted = rel.item1.tags.delete(rel.item2.id);
  //   const tagDeleted = rel.item1.tagRels.delete(rel.id);
  //   if (!tagDeleted) {
  //     throw new Error(
  //       `GraphData: removeTagsOfRel item:${rel.item1.headline} has not tag:${rel.item2.headline}`
  //     );
  //   }
  //   // this.populateEntriesWithAllTagsForItem(rel.item2);
  // };

  // removeTagRelForItem = (item:MpgItem, rel:MpgRel)=>{
  //   // this could be simplified
  //   if(item.id === rel.item1Id){
  //     if(item.type === MpgItemType.Entry){
  //       const tagDeleted = item.tags.delete(rel.item2Id)
  //       if(tagDeleted){
  //         const item2 = this.items.get(rel.item2Id)
  //         if(item2 !== undefined){
  //           if(item2.type === MpgItemType.Tag){
  //             const entryDeleted = item2.entries.delete(rel.item1Id)
  //             if(!entryDeleted){
  //               throw new Error(`GraphData: removeTagRelForItem: item was has no such entry`)
  //             }
  //           }else{
  //             throw new Error(`GraphData: removeTagRelForItem: item2 of TagRel is not Tag`)
  //           }
  //         }else{
  //           throw new Error(`GraphData: removeTagRelForItem: item2 was not found`)
  //         }
  //       }else{
  //         throw new Error(`GraphData: removeTagRelForItem: item was has no such tag`)
  //       }
  //     }else{
  //       throw new Error(`GraphData: removeTagRelForItem: item1 of TagRel is not Entry`)
  //     }
  //   }else{
  //     // item is rel.Item2Id
  //     if(item.type === MpgItemType.Tag){
  //       const entryDeleted = item.entries.delete(rel.item1Id)
  //       if(! entryDeleted){
  //         throw new Error(`GraphData: removeTagRelForItem: item was has no such entry`)
  //       }
  //       const item1 = this.items.get(rel.item1Id)
  //       if(item1 !== undefined){
  //         if(item1.type === MpgItemType.Entry){
  //           const tagDeleted = item1.tags.delete(rel.item2Id)
  //           if(!tagDeleted){
  //             throw new Error(`GraphData: removeTagRelForItem: item was has no such tag`)
  //           }
  //         }else{
  //           throw new Error(`GraphData: removeTagRelForItem: item1 of TagRel is not Entry`)
  //         }
  //       }else{
  //         throw new Error(`GraphData: removeTagRelForItem: item1 was not found`)
  //       }
  //     }else{
  //       throw new Error(`GraphData: removeTagRelForItem: item2 of TagRel is not Tag`)
  //     }
  //   }
  // }

  // removeParentsOfRel = (rel: MpgParentRel) => {
  //   const childDeleted = rel.item1.children.delete(rel.item2.id);
  //   if (!childDeleted) {
  //     throw new Error(
  //       `GraphData: removePraentsOfRel item:${rel.item1.headline} has not child:${rel.item2.headline}`
  //     );
  //   }
  //   const parentDeleted = rel.item2.parents.delete(rel.item1.id);
  //   if (!parentDeleted) {
  //     throw new Error(
  //       `GraphData: removePraentsOfRel item:${rel.item2.headline} has not parent:${rel.item1.headline}`
  //     );
  //   }
  // };

  //   removePranteRelForItem = async(item: MpgItem, rel:MpgRel)=>{
  //     if(item.id === rel.item1Id){
  //       const childDeleted = item.children.delete(rel.item2Id)
  //       if(!childDeleted){
  //         throw new Error(`GraphData: removeParentRelForItem: item:${item.headline} was has no such child`)
  //       }
  //       const item2 = this.items.get(rel.item2Id)
  //       if(item2 !== undefined){
  //         const parentDeleted = item2.parents.delete(rel.item1Id)
  //         if(!parentDeleted){
  //           throw new Error(`GraphData: removeTagRelForItem: item2:${item2.headline} has not such parent${item.headline}`)
  //         }
  //       }else{
  //         throw new Error(`GraphData: removeTagRelForItem: item2 was not found`)
  //       }
  //     }else{
  //       // item is rel.item2
  //       const parentDeleted = item.parents.delete(rel.item2Id)
  //       if(!parentDeleted){
  //         throw new Error(`GraphData: removeParentRelForItem: item2:${item.headline} was has no such parent`)
  //       }
  //       const item1 = this.items.get(rel.item1Id)
  //       if(item1 !== undefined){
  //         const childDeleted = item1.children.delete(rel.item1Id)
  //         if(!childDeleted){
  //           throw new Error(`GraphData: removeTagRelForItem: item1:${item1.headline} has not such child`)
  //         }
  //       }else{
  //         throw new Error(`GraphData: removeTagRelForItem: item1 was not found`)
  //       }
  //   }
  // }

  deleteItem = async (item: MpgItem) => {
    try {
      // let itemData = item.getItemData();
      // console.log("deleteItem: item:",item)
      await this.removeAllRelsForItem(item);
      let collectionName = "";
      switch (item.type) {
        case MpgItemType.Entry:
          collectionName = "entries";
          break;
        case MpgItemType.Tag:
          collectionName = "tags";
          break;
        case MpgItemType.List:
          collectionName = "lists";
          break;
        default:
          throw new Error(
            `MpgGraphData: createNewItem: invalid type: ${item.type}`
          );
      }
      if (this.db !== null) {
        if (this.authUser !== null) {
          if (this.authUser.uid !== null) {
            await this.db
              .collection("users")
              .doc(this.authUser.uid)
              .collection(collectionName)
              .doc(item.id)
              .delete();
            // this.onItemRemoved(item.id, itemData);
          } else {
            throw new Error("deleteItem: user uid is null");
          }
        } else {
          throw new Error("deleteItem: auth user is null");
        }
      } else {
        throw new Error("deleteRItem: db is null");
      }
    } catch (error) {
      throw error;
    }
  };

  deleteRel = async (rel: MpgRel) => {
    try {
      if (this.db !== null) {
        if (this.authUser !== null) {
          if (this.authUser.uid !== null) {
            await this.db
              .collection("users")
              .doc(this.authUser.uid)
              .collection("rels")
              .doc(rel.id)
              .delete();
            // console.log("deleteRel: rel:",rel)
            // this.onRelRemoved(rel.id, rel.getRelData());
          } else {
            throw new Error("deleteRel: user uid is null");
          }
        } else {
          throw new Error("deleteRel: auth user is null");
        }
      } else {
        throw new Error("deleteRel: db is null");
      }
    } catch (error) {
      throw error;
    }
  };

  private setListnerOnCollections = async () => {
    await this.setListenerOnItemCollection("entries");
    await this.setListenerOnItemCollection("tags");
    await this.setListenerOnItemCollection("lists");
    await this.setListenerOnRelsCollection();
  };

  setListenerOnItemCollection = async (collectionName: string) => {
    try {
      if (this.db !== null) {
        if (this.authUser !== null) {
          if (this.authUser.uid !== null) {
            let query = await this.db
              .collection("users")
              .doc(this.authUser.uid)
              .collection(collectionName);
            query.onSnapshot((querySnapshot) => {
              this.updateLocalItems(querySnapshot);
            });
          } else {
            throw new Error(
              "MpgGraphData: serLisenerOnItemCollection: user uid is null"
            );
          }
        } else {
          throw new Error(
            "MpgGraphData: serLisenerOnItemCollection: auth user is null"
          );
        }
      } else {
        throw new Error("MpgGraphData: serLisenerOnItemCollection: db is null");
      }
    } catch (error) {
      throw error;
    }
  };

  setListenerOnRelsCollection = async () => {
    try {
      if (this.db !== null) {
        if (this.authUser !== null) {
          if (this.authUser.uid !== null) {
            let query = await this.db
              .collection("users")
              .doc(this.authUser.uid)
              .collection("rels");
            query.onSnapshot((querySnapshot) => {
              this.updateLocalRels(querySnapshot);
            });
          } else {
            throw new Error(
              "MpgGraphData: serLisenerOnItemCollection: user uid is null"
            );
          }
        } else {
          throw new Error(
            "MpgGraphData: serLisenerOnItemCollection: auth user is null"
          );
        }
      } else {
        throw new Error("MpgGraphData: serLisenerOnItemCollection: db is null");
      }
    } catch (error) {
      throw error;
    }
  };

  signinUser = async () => {
    if (this.auth !== null) {
      const provider = new firebase.auth.GoogleAuthProvider();
      await this.auth.signInWithPopup(provider);
    } else {
      throw new Error(
        "MpgGraphData: signinUser: Signing in. Cannot signin: auth is null"
      );
    }
  };

  signOutUser = async () => {
    this.authUser = null;
    this.user = null;
    this.entries = new Map();
    this.tags = new Map();
    this.lists = new Map();
    this.items = new Map();
    await this.invokeRefreshData();
  };

  importDataFromGoogleStorage = () => {
    const storageRef = firebase.storage().ref();
    const graphDataRef = storageRef.child("graphdata");
    if (this.authUser !== null) {
      const userFolderRef = graphDataRef.child(this.authUser.uid);
      const filename = "data.graphdata";
      const currentDataRef = userFolderRef.child(filename);
      currentDataRef
        .getDownloadURL()
        .then(function (url) {
          // `url` is the download URL for 'images/stars.jpg'
          // This can be downloaded directly:
          var xhr = new XMLHttpRequest();
          xhr.responseType = "json";
          xhr.onload = function (event) {
            var text = xhr.response;
            console.log("Data downloaded: ", text);
          };
          xhr.open("GET", url);
          xhr.send();
        })
        .catch(function (error) {
          console.log("Errors occured while downloading data: ", error);
        });
    } else {
      throw new Error(`GraphData: storeDataInGoogleStoarge: authUser is null`);
    }
  };

  processImportData = (data: string) => {
    try {
      // const importedData :MpgExternalData = JSON.parse(data)
      this.importedRawData = JSON.parse(data);
      // console.log("imported data:", this.importedData)
      const entries = new Map<string, MpgEntry>();
      const items = new Map<string, MpgItem>();
      this.importedRawData?.graphData.entries.forEach((itemData) => {
        const entry = MpgEntry.fromImportedItemData(itemData);
        entries.set(entry.id, entry);
        items.set(entry.id, entry);
      });
      const tags = new Map<string, MpgTag>();
      this.importedRawData?.graphData.tags.forEach((itemData) => {
        const tag = MpgTag.fromImportedItemData(itemData);
        tags.set(tag.id, tag);
        items.set(tag.id, tag);
      });
      const lists = new Map<string, MpgList>();
      this.importedRawData?.graphData.tags.forEach((itemData) => {
        const list = MpgList.fromExternalItemData(itemData);
        lists.set(list.id, list);
        items.set(list.id, list);
      });
      this.importedItems = {
        entries: entries,
        tags: tags,
        lists: lists,
        items: items,
      };
      const rels = new Map<string, MpgRel>();
      this.importedRawData?.graphData.rels.forEach((externalReldata) => {
        const item1 = this.importedItems?.items.get(externalReldata.item1Id);
        if (item1 !== undefined) {
          const item2 = this.importedItems?.items.get(externalReldata.item2Id);
          if (item2 !== undefined) {
            const rel = new MpgRel(
              externalReldata.id,
              item1,
              item2,
              externalReldata.type
            );
            rels.set(rel.id, rel);
            // now we can save it
          } else {
            throw new Error(
              `MpgGraphData: processImportedData: item2 was not found`
            );
          }
        } else {
          throw new Error(
            `MpgGraphData: processImportedData: item1 was not found`
          );
        }
      });
      console.log("ImportedItems:", this.importedItems);
    } catch (error) {
      throw error;
    }
  };

  private addToItems = async (id: string, itemData: MpgItemData) => {
    if (this.initialLoadInProgress) {
      this.itemsLoaded += 1;
      if (this.itemsLoaded % 10 === 0) {
        await this.invokeRefreshData();
      }
    }
    switch (itemData.type) {
      case MpgItemType.Entry:
        const newEntry = MpgEntry.fromEntryData(id, itemData);
        this.entries.set(id, newEntry);
        this.items.set(id, newEntry);
        break;
      case MpgItemType.Tag:
        const newTag = MpgTag.fromTagData(id, itemData);
        this.tags.set(id, newTag);
        this.items.set(id, newTag);
        break;
      case MpgItemType.List:
        const newList = MpgList.fromListData(id, itemData);
        this.lists.set(id, newList);
        this.items.set(id, newList);
        break;
      default:
        throw new Error(
          `MpgGraphData: addToItems: invalid type: ${itemData.type}`
        );
    }
  };

  private addToRels = async (id: string, relData: MpgRelData) => {
    if (this.initialLoadInProgress) {
      this.relsLoaded = this.relsLoaded + 1;
      if (this.relsLoaded % 100 === 0) {
        await this.invokeRefreshData();
      }
    }
    const item1 = this.items.get(relData.item1Id);
    if (item1 !== undefined) {
      const item2 = this.items.get(relData.item2Id);
      if (item2 !== undefined) {
        const newRel = new MpgRel(id, item1, item2, relData.type);
        this.rels.set(id, newRel);
        this.handleRelAdded(newRel);
      } else {
        throw new Error(
          `GraphData: addToRels: item2 was not found. rel id:${id}`
        );
      }
    } else {
      throw new Error(
        `GraphData: addToRels: item1 was not found. rel id:${id}`
      );
      // console.log(
      //   `GraphData: addToRels: item1 was not found. rel id:${id}`
      // );
    }
  };

  private loadData = async () => {
    await this.loadItems();
    this.updateDateEntryMap();
    await this.loadtRels();
    // console.log("rels loaded")
    // console.log("applying rel")
    this.invokeRefreshData();
    this.applyAllRels();
    this.populateEntryRelForAllTags();
  };

  private populateEntryRelForAllTags = () => {
    this.tags.forEach((tag) => {
      this.includeTagChildrenEntryRels(tag);
    });
  };

  exportData = () => {
    const exportedData = this.getExportData();
    if (exportedData !== undefined) {
      const text = JSON.stringify(exportedData);
      const dateString = new Date()
        .toString()
        .split("GMT")[0]
        .replace(" ", "_");
      const filename = "Graph-"+dateString+".graphdata";
      this.download(filename, text);
      // this.storeDataInGoogleStorage(filename, text);
    }
  };

  storeDataInGoogleStorage = async (filename: string, text: string) => {
    const storageRef = firebase.storage().ref();
    const graphDataRef = storageRef.child("graphdata");
    if (this.authUser !== null) {
      const userFolderRef = graphDataRef.child(this.authUser.uid);
      const currentDataRef = userFolderRef.child(filename);
      currentDataRef.putString(text).then(function (snapshot) {
        console.log("Uploaded data to the storage!");
      });
    } else {
      throw new Error(`GraphData: storeDataInGoogleStoarge: authUser is null`);
    }
  };

  download = async (filename: string, text: string) => {
    var element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  };

  private applyAllRels = () => {
    this.rels.forEach(async (rel) => {
      this.handleRelAdded(rel);
    });
    // console.log("populating entries for all items")
    // this.populateEntriesWithAllTagsForAllItems();
  };

  // public populateEntriesWithAllTagsForAllItems = () => {
  //   // we are doing this too many time than we need
  //   // we are not doing this for the timebeing
  //   // well, let's try
  //   this.entries.forEach((entry) => {
  //     this.populateEntriesWithAllTagsForItem(entry);
  //     // this.populateItemEntriesWithAllTags(entry);
  //   });
  //   this.lists.forEach((list) => {
  //     this.populateEntriesWithAllTagsForItem(list);
  //     // this.populateItemEntriesWithAllTags(list);
  //   });
  // };

  // item could be a list or entry
  // populateEntriesWithAllTagsForItem = (currenItem: MpgItem) => {
  //   try {
  //     currenItem.entriesWithAllTags = new Map<string, MpgEntry>();
  //     if (currenItem.tagRels.size === 0) {
  //       // an item with no tags will have no entries with all tags
  //       return;
  //     }
  //     if (currenItem.type !== MpgItemType.Tag) {
  //       // console.log("populateEntriesWithAllTagsForItem:, currentItem:",currenItem)
  //       this.entries.forEach((entry) => {
  //         // don't add the entry to itself
  //         // also add only entries
  //         if (
  //           // don't need this as we are iterating over entries
  //           // entry.type === MpgItemType.Entry &&
  //           entry.id !== currenItem.id &&
  //           entry.hasAllTags(currenItem.tagRels)
  //         ) {
  //           currenItem.entriesWithAllTags.set(entry.id, entry);
  //           // now we need to add the item to this enrty's itemsHaveEntryInThierEntriesWIthAllTags
  //           entry.itemsHaveEntryInTheirEntriesWithhAllTags.set(
  //             currenItem.id,
  //             currenItem
  //           );
  //         }
  //       });
  //     } else {
  //       // set entries for tag
  //       // this.entries.forEach((entry) => {
  //       //   // don't add the entry to itself
  //       //   if (
  //       //     entry.id !== currenItem.id &&
  //       //     entry.hasTag(currenItem)
  //       //   ) {
  //       //     currenItem.entriesWithAllTags.set(entry.id, entry);
  //       //   }
  //       // });
  //     }
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  handleRelAdded = (rel: MpgRel) => {
    switch (rel.relType) {
      case MpgRelType.Tag:
        this.handleTagRelAdded(rel);
        break;
      case MpgRelType.Parent:
        this.handleParentRelAdded(rel);
        break;
      default:
        throw new Error(`GraphData: applyRel: invalid rel type: ${rel.type}`);
    }
  };

  private includeTagChildrenEntryRels = (tag: MpgTag) => {
    // note that when we call this dynamically (in the mid of change it could wrong because we are not restting it)
    // console.log("includeTagChildrenEntryRels, tag:", tag.headline);
    if (tag.childRels.size > 0) {
      // console.log("includeTagChildrenEntryRels, children:", tag.childRels);
      tag.childRels.forEach((childRel) => {
        // console.log(
        //   "includeTagChildrenEntryRels, tags of child:",
        //   childRel.item2.tagRels
        // );
        childRel.item2.itemRels.forEach((entryRel) => {
          tag.itemRels.set(entryRel.id, entryRel);
        });
        // do for the child too
        this.includeTagChildrenEntryRels(childRel.tag as MpgTag);
      });
    } else {
      // do nothing
      // no children
    }
  };

  private handleTagRelAdded = (rel: MpgRel) => {
    try {
      //check that item1 is entry and item2 is a tag
      if (
        rel.item1.type === MpgItemType.Entry ||
        rel.item1.type === MpgItemType.List
      ) {
        if (rel.item2.type === MpgItemType.Tag) {
          const tagRel = rel as MpgTagRel;
          rel.item1.tagRels.set(tagRel.id, tagRel);
          // add entries and lists
          rel.item2.itemRels.set(tagRel.id, tagRel);
          // include children tags
          // note that we we change parents this will change
          this.includeTagChildrenEntryRels(rel.item2 as MpgTag);
          // add entries of the new tag to entriesWithAllTags of the item
          // this.addEntriesWithAllTagsToItem(rel.item1, rel.item2 as MpgTag);
          // if (!this.initialLoadInProgress) {
          //   this.populateEntriesWithAllTagsForAllItems();
          // }
          // update item1 entriesWithAllTags
          // this.updateEntriesWithAllTagsOnRelAdded(
          //   rel.item1,
          //   rel.item2 as MpgTag
          // );
        } else {
          throw new Error(
            `GraphData: applyTagRel: item1${rel.item2.headline} is not tag `
          );
        }
      } else {
        throw new Error(
          `GraphData: applyTagRel: item1${rel.item1.headline} is not entry or list `
        );
      }
    } catch (error) {
      throw error;
    }
  };

  updateEntriesWithAllTagsOnRelAdded = (item: MpgItem, tag: MpgTag) => {
    // console.log("GraphData: EntriesWithAllTagsOnRelAdded: item:",item, "tag:",tag)
    // scenario 1: item is a entry
    //  in this case, there will be lists to it to be added
    //  these lists must be in the entryRel
    if (item.type === MpgItemType.Entry) {
      // console.log("GraphData: EntriesWithAllTagsOnRelAdded: item is an entry")
      tag.itemRels.forEach((entryRel) => {
        const entry = entryRel.item1;
        if (entry.id !== item.id && item.hasAllTags(item.tagRels)) {
          entry.entriesWithAllTags.set(item.id, item as MpgEntry);
        }
      });
    } else {
      if (item.type === MpgItemType.List) {
        // scenerio 2: item is a list
        //   there will be entries in it's entriesWithhAllTags to be removed
        item.entriesWithAllTags.forEach((entry) => {
          if (!entry.hasAllTags(item.tagRels)) {
            const entryRemoved = item.entriesWithAllTags.delete(entry.id);
            if (!entryRemoved) {
              throw new Error(`GraphData: dateEntriesWithAllTagsOnRelAdded: entry:${entry.headline}
            was not found in item:${item.headline}`);
            } else {
              // entry was removed successfully
            }
          } else {
            // entry has all tags, leave it there
          }
        });
      }
    }
  };

  updateEntriesWithAllTagsOnRelRemoved = (item: MpgItem, tag: MpgTag) => {
    // scenario 1: item is an entry
    //   so, there will be lists it should be removed from
    //   these lists must have this tag
    // console.log(
    //   "GraphData: EntriesWithAllTagsOnRelRemoved: item:",
    //   item,
    //   "tag:",
    //   tag
    // );
    if (item.type === MpgItemType.Entry) {
      console.log("GraphData: EntriesWithAllTagsOnRelRemoved: item is entry");
      tag.itemRels.forEach((itemRel) => {
        if (itemRel.item1.type === MpgItemType.List) {
          const list = itemRel.item1;
          console.log(
            "GraphData: EntriesWithAllTagsOnRelRemoved: checking list:",
            list
          );
          if (list.id !== item.id) {
            //check if entry is on this list entriesWithAllTags
            if (list.entriesWithAllTags.has(item.id)) {
              if (!item.hasAllTags(list.tagRels)) {
                const entryRemoved = list.entriesWithAllTags.delete(item.id);
                if (!entryRemoved) {
                  throw new Error(`GraphData: EntriesWithAllTagsOnRelRemoved: entry:${item.headline}
                  was not found in item:${list.headline}`);
                } else {
                  // entry was removed successfully, do nothing
                }
              } else {
                // entry has all tags, do nothing
              }
            } else {
              // item is the same as the list, do nothing
            }
          }
        } else {
          // it's an entry or tag, do nothing we don't maintain entriesWithAllTags
        }
      });
    } else {
      if (item.type === MpgItemType.List) {
        // scenario 2: item is a list
        // therefore there will be entries now eligible to be added
        this.entries.forEach((entry) => {
          if (entry.hasAllTags(item.tagRels)) {
            item.entriesWithAllTags.set(entry.id, entry);
          }
        });
      }
    }
  };

  // addEntriesWithAllTagsToItem = (item: MpgItem, tag: MpgTag) => {
  //   tag.entryRels.forEach((entryRel) => {
  //     // check that the entry has all the other tags
  //     const entry = entryRel.item1 as MpgEntry;
  //     if (entry.hasAllTags(item.tagRels) && entry.id !== item.id) {
  //       item.entriesWithAllTags.set(entry.id, entry);
  //       entry.itemsHaveEntryInTheirEntriesWithhAllTags.set(item.id, item);
  //     } else {
  //       // do nothing
  //     }
  //   });
  // };

  // removeEntriesWithTagOfItem = (item: MpgItem, tag: MpgTag) => {
  //   // remove entries from other items that had this tag
  //   item.itemsHaveEntryInTheirEntriesWithhAllTags.forEach((itemWithEntry) => {
  //     // if the item (say list) has this tag and it's removed from the item.
  //     // The item is disqualified of being on entriesWithAllTags
  //     if (itemWithEntry.hasTag(tag) && itemWithEntry.id !== item.id) {
  //       const itemRemoved = itemWithEntry.entriesWithAllTags.delete(item.id);
  //       if (itemRemoved) {
  //         // good, proceed to sevre the revrese realtion
  //         const itemWithEntryRemoved = item.itemsHaveEntryInTheirEntriesWithhAllTags.delete(
  //           itemWithEntry.id
  //         );
  //         if (itemWithEntryRemoved) {
  //           // alll good
  //           // do nothing
  //         } else {
  //           throw new Error(`MpgGraphData: removeEntriesWithTagOfItem: item:${itemWithEntry.headline}
  //           was not found in item:${item.headline}'s itemsHaveEntryInTheirEntriesWithhAllTags`);
  //         }
  //       } else {
  //         throw new Error(`MpgGraphData: removeEntriesWithTagOfItem: item:${item.headline}
  //         was not found in item:${itemWithEntry.headline}'s entriesWithAllTags`);
  //       }
  //     } else {
  //       // do nothing
  //       // either the item does not have this flag and threrefore is not affected
  //       // or it's the same as this item
  //     }
  //   });
  // };

  // populateItemEntriesWithAllTags = (item: MpgItem) => {
  //   // this is very ineffiecent
  //   // improve!!!
  //   // the following is very simple algorithms to populate entriesWithAllTags
  //   // we can improve this signigicantly
  //   // item has a set of TagRels
  //   // entriesWithAllTags are entries that has all tags
  //   // get all entries with any of the tags
  //   // first remove the item's entriesWithAllTags
  //   // because adding an tag may disqualify some existing entries
  //   item.entriesWithAllTags = new Map<string, MpgEntry>();
  //   const entriesWithAnyTag = new Map<string, MpgEntry>();
  //   item.tagRels.forEach((tagRel) => {
  //     const tag = tagRel.tag;
  //     tag.entryRels.forEach((entryRel) => {
  //       const tagEntry = entryRel.item1;
  //       if (!entriesWithAnyTag.has(tagEntry.id)) {
  //         // entry is not there
  //         // add only entries
  //         // don't add entry to itself
  //         if (tagEntry.id !== item.id && tagEntry.type === MpgItemType.Entry) {
  //           entriesWithAnyTag.set(tagEntry.id, tagEntry as MpgEntry);
  //         }
  //       } else {
  //         // do nothing. entry is already there
  //       }
  //     });
  //     // console.log("populateItemEntirsWithAllTags: item:",item,"entries with any tag:",entriesWithAnyTag)
  //     // now remove entries that don't have all tags
  //     entriesWithAnyTag.forEach((entry) => {
  //       if (entry.hasAllTags(item.tagRels)) {
  //         // add to item's entriesWithAllTags
  //         item.entriesWithAllTags.set(entry.id, entry);
  //         // now we need to add the item to this enrty's itemsHaveEntryInThierEntriesWIthAllTags
  //         entry.itemsHaveEntryInTheirEntriesWithhAllTags.set(item.id, item)
  //       } else {
  //         // do nothing
  //       }
  //     });
  //   });
  //   // console.log("populateItemEntirsWithAllTags: item:",item,"entries with ALL tags:",entriesWithAnyTag)
  // };

  private handleParentRelAdded = (rel: MpgRel) => {
    try {
      const parentRel = rel as MpgParentRel;
      rel.item1.childRels.set(parentRel.id, parentRel);
      rel.item2.parentRels.set(parentRel.id, parentRel);
      // populate entries for tag
      this.includeTagChildrenEntryRels(rel.item1 as MpgTag);
      this.includeTagChildrenEntryRels(rel.item2 as MpgTag);
    } catch (error) {
      throw error;
    }
  };

  private loadItems = async () => {
    await this.loadtItemsFromCollection("entries");
    await this.loadtItemsFromCollection("tags");
    await this.loadtItemsFromCollection("lists");
  };

  private loadtItemsFromCollection = async (collectionName: string) => {
    try {
      if (this.db !== null) {
        if (this.authUser !== null) {
          if (this.authUser.uid !== null) {
            const docRef = await this.db
              .collection("users")
              .doc(this.authUser.uid)
              .collection(collectionName)
              .get();
            if (docRef !== undefined) {
              docRef.docs.forEach((doc) => {
                const docData = doc.data();
                if (docData !== undefined) {
                  this.addToItems(doc.id, docData as MpgItemData);
                }
              });
            } else {
              throw new Error(
                `MpgGraph: getCollectionSize: docRef is undefined`
              );
            }
          } else {
            throw new Error(
              `MpgGraph: getCollectionSize: authUser.uid is null`
            );
          }
        } else {
          throw new Error(`MpgGraph: getCollectionSize: authUser is null`);
        }
      } else {
        throw new Error(`MpgGraph: getCollectionSize: db is null`);
      }
    } catch (error) {
      throw error;
    }
  };

  private loadtRels = async () => {
    try {
      if (this.db !== null) {
        if (this.authUser !== null) {
          if (this.authUser.uid !== null) {
            const docRef = await this.db
              .collection("users")
              .doc(this.authUser.uid)
              .collection("rels")
              .get();
            if (docRef !== undefined) {
              docRef.docs.forEach((doc) => {
                const docData = doc.data();
                if (docData !== undefined) {
                  this.addToRels(doc.id, docData as MpgRelData);
                }
              });
            } else {
              throw new Error(
                `MpgGraph: getCollectionSize: docRef is undefined`
              );
            }
          } else {
            throw new Error(
              `MpgGraph: getCollectionSize: authUser.uid is null`
            );
          }
        } else {
          throw new Error(`MpgGraph: getCollectionSize: authUser is null`);
        }
      } else {
        throw new Error(`MpgGraph: getCollectionSize: db is null`);
      }
    } catch (error) {
      throw error;
    }
  };

  private checkUserAndCreateIfNew = async () => {
    try {
      if (await this.doesUserExist()) {
        // user already exist
        await this.loadUserDoc();
        if (this.user !== null) {
          this.user.userSignedOn = true;
          // update user data with new date
          this.user.updatedAt = new Date();
          await this.updateUserDoc(this.user);
          await this.loadData();
        } else {
          throw new Error(
            `MpgGraphData: checkUserAndCreateIfNew: this.user is null`
          );
        }
      } else {
        // new user
        if (this.authUser !== null) {
          let userName = "Unknow";
          if (this.authUser.displayName !== null) {
            userName = this.authUser.displayName.split(" ")[0];
            if (this.authUser !== null) {
              if (this.authUser.uid !== null) {
                this.user = new MpgUser(this.authUser.uid, userName);
                this.user.userSignedOn = true;
                await this.updateUserDoc(this.user);
              }
            }
          }
        } else {
          throw new Error(
            `MpgGraphData: checkUserAndCreateIfNew: this.authuser is null`
          );
        }
      }
      // console.log("settingListners")
      await this.setListnerOnCollections();
      // this.endInitialLoadInProgress()
      // let update loadcal items finish!
      // I really don't know why this seems to comeback before the loading is finish
      // invistigate later
      setTimeout(this.endInitialLoadInProgress, 2000);
      await this.invokeRefreshData();
    } catch (error) {
      throw error;
    }
  };

  private onItemModified = (itemId: string, itemData: MpgItemData) => {
    try {
      const item = this.items.get(itemId);
      if (item !== undefined) {
        item.updateFromItemData(itemData);
        // this.populateEntriesWithAllTagsForAllItems();
        this.updateDateEntryMap();
      } else {
        throw new Error(
          `MpgGraph: onItemModified: undefined item. id:${itemId}`
        );
      }
    } catch (error) {
      throw error;
    }
    this.invokeRefreshData();
  };

  updateItem = async (item: MpgItem) => {
    try {
      let itemData: MpgItemData;
      let collectionName = "";
      item.updatedAt = new Date();
      switch (item.type) {
        case MpgItemType.Entry:
          collectionName = "entries";
          itemData = (item as MpgEntry).getEntryData();
          break;
        case MpgItemType.Tag:
          collectionName = "tags";
          itemData = (item as MpgTag).getTagData();
          break;
        case MpgItemType.List:
          collectionName = "lists";
          itemData = (item as MpgList).getListData();
          break;
        default:
          throw new Error(
            `MpgGraphData: updateItem: invalid type: ${item.type}`
          );
      }
      if (!item.overrideSentiment) {
        const sentimentResult = this.sentiment.analyze(
          item.headline + item.notes
        );
        itemData.sentiment = sentimentResult.comparative;
      }
      if (this.db !== null) {
        if (this.authUser !== null) {
          if (this.authUser !== null) {
            if (this.authUser.uid !== null) {
              await this.db
                .collection("users")
                .doc(this.authUser.uid)
                .collection(collectionName)
                .doc(item.id)
                .set(itemData);
              // await this.onItemModified(item.id, itemData);
            } else {
              console.error("updateItem: user uid is null");
            }
          } else {
            console.error("updateItem: auth user is null");
          }
        } else {
          console.error("updateItem: db is null");
        }
      }
    } catch (error) {
      console.error("updateItem: error updating item: error:", error);
    }
  };

  endInitialLoadInProgress = () => {
    this.initialLoadInProgress = false;
    this.invokeRefreshData();
  };

  getExportData = (): MpgExternalData => {
    try {
      let user = this.user;
      if (this.user !== null) {
        user = this.user;
      } else {
        throw new Error(`MpgGraphData: getExportedData: user is null`);
      }
      const exportData: MpgExternalData = {
        dataVerionNumber: this.dataVersionNumber,
        dataVersionText: this.dataVersionText,
        exportedAt: new Date(),
        user: user.getExternalItemData(),
        graphData: {
          entries: [],
          tags: [],
          lists: [],
          rels: [],
        },
      };
      this.entries.forEach((entry) => {
        const entryData = entry.getExternalItemData();
        exportData.graphData.entries.push(entryData);
      });
      this.tags.forEach((tag) => {
        const tagData = tag.getExternalItemData();
        exportData.graphData.tags.push(tagData);
      });
      this.lists.forEach((list) => {
        const listData = list.getExternalItemData();
        exportData.graphData.lists.push(listData);
      });
      this.rels.forEach((rel) => {
        const externalReldata = rel.getExternalRelData();
        exportData.graphData.rels.push(externalReldata);
      });
      return exportData;
    } catch (error) {
      throw error;
    }
  };

  private updateUserDoc = async (user: MpgUser) => {
    try {
      // console.log("MpgGraphData: updateUserDoc: user:", user);
      if (this.db !== null) {
        if (this.authUser !== null) {
          if (this.authUser !== null) {
            if (this.authUser.uid !== null) {
              await this.db
                .collection("users")
                .doc(this.authUser.uid)
                .set(user.getData());
            } else {
              throw new Error("MpgGraphData: createUserData: user uid is null");
            }
          } else {
            throw new Error("MpgGraphData: createUserData: auth user is null");
          }
        } else {
          throw new Error("MpgGraphData: createUserData: db is null");
        }
      }
    } catch (error) {
      throw error;
    }
  };

  doesUserExist = async (): Promise<boolean> => {
    let userExists = false;
    try {
      if (this.db !== null) {
        if (this.authUser !== null) {
          if (this.authUser.uid !== null) {
            const userCollection = await this.db.collection("users").get();
            if (userCollection.size === 0) {
              return userExists;
            } else {
              userCollection.forEach((user) => {
                if (user.id === this.authUser?.uid) {
                  userExists = true;
                  return userExists;
                }
              });
            }
          } else {
            throw new Error(
              "MpgGraphData: doesUserExist: authUser uid is null"
            );
          }
        } else {
          throw new Error("doesUserExist: auth user is null");
        }
      } else {
        throw new Error("doesUserExist: db is null");
      }
    } catch (error) {
      throw error;
    } finally {
      return userExists;
    }
  };

  private loadUserDoc = async () => {
    try {
      if (this.db !== null) {
        if (this.authUser !== null) {
          if (this.authUser !== null) {
            if (this.authUser.uid !== null) {
              const docRef = await this.db
                .collection("users")
                .doc(this.authUser.uid)
                .get();
              if (docRef !== undefined) {
                this.user = MpgUser.fromData(
                  docRef.id,
                  docRef.data() as MpgUserData
                );
              }
            } else {
              throw new Error("MpgGraphData: createUserData: user uid is null");
            }
          } else {
            throw new Error("MpgGraphData: createUserData: auth user is null");
          }
        } else {
          throw new Error("MpgGraphData: createUserData: db is null");
        }
      }
    } catch (error) {
      throw error;
    }
  };

  // public UpdateUserDoc = async (user: MpgUser) => {
  //   console.log("updateUser: user:",user)
  //   try {
  //     // const userData = user.getUserData();
  //     // if (this.db !== null) {
  //     //   if (this.authUser !== null) {
  //     //     if (this.authUser !== null) {
  //     //       if (this.authUser.uid !== null) {
  //     //         await this.db
  //     //           .collection("users")
  //     //           .doc(this.authUser.uid)
  //     //           .set(userData);
  //     //       } else {
  //     //         throw new Error("MpgGraphData: createUserData: user uid is null");
  //     //       }
  //     //     } else {
  //     //       throw new Error("MpgGraphData: createUserData: auth user is null");
  //     //     }
  //     //   } else {
  //     //     throw new Error("MpgGraphData: createUserData: db is null");
  //     //   }
  //     // }
  //   } catch (error) {
  //     throw error;
  //   }
  // };
}
