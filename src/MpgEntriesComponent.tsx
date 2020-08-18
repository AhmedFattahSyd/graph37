import React from "react";
import {
  Card,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from "@material-ui/core";
import MpgItem from "./MpgItem";
import MpgItemListCompenent from "./MpgItemListComponent";
import MpgTheme from "./MpgTheme";
import MpgTagRel from "./MpgTagRel";
import { MpgItemType } from "./MpgItemType";

interface ItemEntriesProps {
  currentEntry: MpgItem;
  openItem: Function;
  //   creatNewEntryAndTagItAndAddToItem: Function;
  //   tagExistingEntryAndAddToItem: Function;
  entries: Map<string, MpgItem>;
  deleteItem: Function;
  updateItem: Function;
  refreshItem: Function;
  // existingEntries: Map<string, MpgItem>;
  addNewEntryToEntriesOfItem: Function;
  addExistingEntryToEntriesOfEntry: Function;
  removeEntryFromItem: Function;
  removeTagFromItem: Function;
  showActive: boolean;
  showParked: boolean;
  showArchived: boolean;
  setDataSavingInProgress: Function;
  privateMode: boolean
}

interface ItemEntriesState {
  entrySearchText: string;
  entryListVisible: boolean;
  // existingEntries: Map<string, MpgItem>;
  currentItem: MpgItem;
  matchedEntries: Array<MpgItem>;
  tagEntryRels: Map<string, MpgTagRel>;
  showActive: boolean;
  showParked: boolean;
  showArchived: boolean;
}

export default class MpgItemEntriesComponent extends React.Component<
  ItemEntriesProps,
  ItemEntriesState
> {
  readonly ADD_NEW_ENTRY_ID = "ADD_NEW_ENTRY_ID";
  constructor(props: ItemEntriesProps) {
    super(props);
    // const existingEntries = this.getEntriesToShow(props.currentEntry)
    this.state = {
      entrySearchText: "",
      entryListVisible: false,
      // existingEntries: props.currentEntry.entriesWithAllTags,
      // existingEntries: props.currentEntry.entriesWithAllTags,
      currentItem: props.currentEntry,
      matchedEntries: new Array<MpgItem>(),
      tagEntryRels: props.currentEntry.tagRels,
      showActive: props.showActive,
      showArchived: props.showArchived,
      showParked: props.showParked,
    };
  }

  render = () => {
    return (
      <Card style={{ textAlign: "left", margin: 5, padding: 3 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            margin: 0,
          }}
        >
          {this.state.showActive ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <TextField
                id="entrySearch"
                label="Add or search for entries"
                value={this.state.entrySearchText}
                style={{
                  marginLeft: 10,
                  width: "95%",
                  fontSize: 10,
                  marginTop: 0,
                }}
                onChange={this.handleEntrySearchTextChange}
                // onKeyPress={event=>this.handleKeyPressed(event)}
                autoComplete="off"
              />
              <Button
                onClick={() => this.handleAddNewEntryNew()}
                style={{
                  margin: 0,
                  color: MpgTheme.palette.primary.contrastText,
                  backgroundColor: MpgTheme.palette.primary.main,
                  height: 20,
                  width: 30,
                  fontSize: 9,
                }}
                size="small"
                // color="secondary"
              >
                Add
              </Button>
            </div>
          ) : (
            <div></div>
          )}
        </div>
        {this.renderMatchedEntries()}
        {this.renderExistingEntries()}
      </Card>
    );
  };

  renderMatchedEntries = () => {
    return (
      <div>
        {this.state.entryListVisible ? (
          <List>
            {this.state.matchedEntries.map((entry) => (
              <ListItem
                key={entry.id}
                button
                onClick={(event) => this.handleAddNewEntry(event, entry.id)}
              >
                <ListItemText
                  primary={entry.headline}
                  style={{ fontSize: 12 }}
                />
              </ListItem>
            ))}
            <Divider />
            <ListItem
              key={this.ADD_NEW_ENTRY_ID}
              button
              onClick={(event) =>
                this.handleAddNewEntry(event, this.ADD_NEW_ENTRY_ID)
              }
            >
              <ListItemText
                primary={"Add new entry: " + this.state.entrySearchText}
              />
            </ListItem>
          </List>
        ) : (
          <div />
        )}
      </div>
    );
  };

  handleAddNewEntryNew = async () => {
    this.props.setDataSavingInProgress(true);
    await this.props.addNewEntryToEntriesOfItem(
      this.state.currentItem.id,
      this.state.entrySearchText
    );
    const currentItem = this.state.currentItem;
    await this.setState({
      entrySearchText: "",
      entryListVisible: false,
      // existingEntries: this.state.currentItem.entriesWithAllTags,
      currentItem: currentItem,
    });
    await this.props.refreshItem();
    this.props.setDataSavingInProgress(false);
  };

  handleAddNewEntry = async (event: any, entryId: string) => {
    try {
      this.props.setDataSavingInProgress(true);
      if (entryId === this.ADD_NEW_ENTRY_ID) {
        await this.props.addNewEntryToEntriesOfItem(
          this.state.currentItem.id,
          this.state.entrySearchText
        );
      } else {
        // add link to existing card
        await this.props.addExistingEntryToEntriesOfEntry(
          this.state.currentItem.id,
          entryId
        );
      }
      const currentItem = this.state.currentItem;
      await this.setState({
        entrySearchText: "",
        entryListVisible: false,
        // existingEntries: this.state.currentItem.entriesWithAllTags,
        currentItem: currentItem,
      });
      await this.props.refreshItem();
      this.props.setDataSavingInProgress(false);
    } catch (error) {
      throw error;
      // console.log("MpgItemEntriesComponent: handleAddNewEntry: error:" + error);
    }
  };

  getEntriesToShow = (item: MpgItem): Map<string, MpgItem> => {
    let entries = new Map<string, MpgItem>();
    if (item.type === MpgItemType.Tag) {
      item.itemRels.forEach((tagRel) => {
        // add only entries
        if (tagRel.item1.type === MpgItemType.Entry) {
          entries.set(tagRel.item.id, tagRel.item);
        }
      });
    } else {
      // entries = this.state.currentItem.entriesWithAllTags;
      if (this.state.currentItem.tagRels.size > 0) {
        this.props.entries.forEach((entry) => {
          if (entry.hasAllTags(this.state.currentItem.tagRels)) {
            entries.set(entry.id, entry);
          }
        });
      }
    }
    return entries;
  };

  renderExistingEntries = () => {
    const entries = this.getEntriesToShow(this.state.currentItem);
    return (
      <Card
        style={{
          backgroundColor: MpgTheme.palette.primary.light,
          margin: 5,
        }}
      >
        <MpgItemListCompenent
          items={entries}
          // items={this.state.existingEntries}
          openItem={this.props.openItem}
          deleteItem={this.props.deleteItem}
          refreshItem={this.props.refreshItem}
          updateItem={this.props.updateItem}
          removeFromListEnabled={true}
          removeFromListToolTip={"Remove this entry"}
          removeFromListFun={this.handleRemoveFromList}
          showArchived={this.state.showArchived}
          removeTagFromItem={this.props.removeTagFromItem}
          showActive={this.state.showActive}
          showParked={this.state.showParked}
          setDataSavingInProgress={this.props.setDataSavingInProgress}
          privateMode={this.props.privateMode}
        />
      </Card>
    );
  };

  // getTagEntries = (): Map<string,MpgItem>=>{
  //   const tagEntries = new Map<string,MpgItem>()
  //   this.state.currentEntry.tagRels.forEach(tagRel=>{
  //     tagEntries.set(tagRel.item1.id, tagRel.item1)
  //   })
  //   return tagEntries
  // }

  handleRemoveFromList = async (item: MpgItem) => {
    this.props.setDataSavingInProgress(true);
    await this.props.removeEntryFromItem(this.state.currentItem, item);
    // this.setState({existingEntries: this.state.currentItem.entriesWithAllTags})
    this.props.setDataSavingInProgress(false);
  };

  static getDerivedStateFromProps = (
    newProps: ItemEntriesProps,
    state: ItemEntriesState
  ) => {
    state = {
      ...state,
      currentItem: newProps.currentEntry,
      // existingEntries: newProps.currentEntry.entriesWithAllTags,
    };
    // console.log("EntriesComponent: getDrive... entriesWithAllTags",newProps.currentEntry.entriesWithAllTags)
    return state;
  };

  // componentDidUpdate=()=>{
  //   this.setState({existingEntries: this.getEntriesToShow(this.state.currentEntry)})
  // }

  // handleEntrySearchTextChange = async (event: React.ChangeEvent) => {
  handleEntrySearchTextChange = async (event: any) => {
    const entrySearchText = (event.target as HTMLInputElement).value;
    this.setState({
      entrySearchText: entrySearchText,
    });
    // console.log("event:",event)
    // if (event.key === "Enter") {
    //   if (entrySearchText.length > 3) {
    //     this.setState({
    //       entrySearchText: entrySearchText,
    //       entryListVisible: true,
    //     });
    //     await this.setMatchedEntries(entrySearchText);
    //   } else {
    //     this.setState({
    //       entrySearchText: entrySearchText,
    //       entryListVisible: false,
    //     });
    //   }
    // }
  };

  handleKeyPressed = async (event: any) => {
    // console.log("event:",event)
    if (event.key === "Enter") {
      if (this.state.entrySearchText.length > 3) {
        this.setState({
          entryListVisible: true,
        });
        await this.setMatchedEntries(this.state.entrySearchText);
      } else {
        this.setState({
          // entrySearchText: entrySearchText,
          entryListVisible: false,
        });
      }
    }
  };

  // handleEntrySearchTextChange = async (event: React.ChangeEvent) => {
  //   const entrySearchText = (event.target as HTMLInputElement).value;
  //   if (entrySearchText.length > 10) {
  //     this.setState({
  //       entrySearchText: entrySearchText,
  //       entryListVisible: true,
  //     });
  //     await this.setMatchedEntries(entrySearchText);
  //   } else {
  //     this.setState({
  //       entrySearchText: entrySearchText,
  //       entryListVisible: false,
  //     });
  //   }
  // };

  setMatchedEntries = async (text: string) => {
    try {
      // remove entries that are already in the item
      const entriesToSearch = Array.from(this.props.entries.values()).filter(
        (entry) => {
          return !(
            // this.state.currentEntry.entriesWithAllTags.has(entry.id) ||
            (
              this.getEntriesToShow(this.state.currentItem).has(entry.id) ||
              // this.state.existingEntries.has(entry.id)
              entry.id === this.state.currentItem.id
            )
          );
        }
      );
      const foundEntryList = entriesToSearch.filter((entry) => {
        return entry.headline.toLowerCase().includes(text.toLowerCase());
      });
      this.setState({ matchedEntries: foundEntryList });
      // });
    } catch (error) {
      console.log("setMatchedTags: error:", error);
    }
  };
}
