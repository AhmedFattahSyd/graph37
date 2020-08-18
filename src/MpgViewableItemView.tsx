import React from "react";
import MpgViewableItem from "./MpgViewableItem";
import {
  Card,
  Button,
  ThemeProvider,
  TextField,
  Typography,
  Tooltip,
  Icon,
  Select,
  MenuItem,
} from "@material-ui/core";
import MpgTheme from "./MpgTheme";
import MpgItemListCompenent from "./MpgItemListComponent";
import MpgEntry from "./MpgEntry";
import MpgTag from "./MpgTag";
import MpgList from "./MpgList";
import MpgPanel, { PanelInterface } from "./MpgPanel";
import { MpgItemType } from "./MpgItemType";
import MpgItem, { MpgItemPrivacy } from "./MpgItem";
import MpgUser from "./MpgUser";
import MpgTimelineComponent from "./MpgTimelineComponent";
import { MpgTimelineRange } from "./MpgGraphData";

// interface EntriesDate {
//   daySinceStart: number,
//   entries: MpgEntry[],
// }

interface ViewableItemViewProps {
  currentItem: MpgViewableItem;
  viewWidth: number;
  closeView: Function;
  openItem: Function;
  setMatchedEntries: Function;
  matchedEntries: Map<string, MpgEntry>;
  matchedTags: Map<string, MpgTag>;
  matchedLists: Map<string, MpgList>;
  deleteItem: Function;
  updateItem: Function;
  viewMargin: number;
  entries: Map<string, MpgEntry>;
  tags: Map<string, MpgTag>;
  removeTagFromItem: Function;
  currentUser: MpgUser | null;
  updateUser: Function;
  processImportedData: Function;
  setDataSavingInProgress: Function;
  earlistEntryDate: number;
  dateEntryMap: Map<number, Map<string, MpgEntry>>;
  updateTimelineRange: Function;
  privateMode: boolean
}
interface ViewableItemViewState {
  searchText: string;
  matchedEntries: Map<string, MpgEntry>;
  matchedTags: Map<string, MpgTag>;
  matchedLists: Map<string, MpgList>;
  entries: Map<string, MpgEntry>;
  tags: Map<string, MpgTag>;
  privacy: MpgItemPrivacy;
  overallSentiment: number;
  dateEntryMap: Map<number, Map<string, MpgEntry>>;
  timelineRange: MpgTimelineRange;
}

export default class MpgViewableItemView extends React.Component<
  ViewableItemViewProps,
  ViewableItemViewState
> {
  private panelList: PanelInterface[] = [];
  private renderHeaderFunction: Function;
  // private dateEntryMap: Map<number, Map<string, MpgEntry>> = new Map();
  // private earlistEntryDate: number = 0
  // private entriesDate: Map<number, Array<MpgEntry>> = new Map();
  private tagList: Map<number, MpgTag> = new Map();
  private entriesWithNoTag: Map<string, MpgEntry> = new Map();
  constructor(props: ViewableItemViewProps) {
    super(props);
    let privacy = MpgItemPrivacy.Public;
    if (this.props.currentUser !== null) {
      privacy = this.props.currentUser.privacy;
    }
    this.state = {
      searchText: "",
      matchedEntries: new Map(),
      matchedTags: new Map(),
      matchedLists: new Map(),
      entries: props.entries,
      tags: props.tags,
      privacy: privacy,
      overallSentiment: this.calculateOverallSentiment(),
      dateEntryMap: props.dateEntryMap,
      timelineRange: MpgTimelineRange.All,
    };
    this.renderHeaderFunction = this.renderSearchHeader;
    this.initViewParameters();
  }

  handleTimelineRangeChange = async (
    event: React.ChangeEvent<{ value: any }>
  ) => {
    try {
      const timelineRange = event.target.value;
      await this.setState({ timelineRange: timelineRange });
      this.props.updateTimelineRange(timelineRange)
    } catch (error) {
      throw error;
    }
  };

  private initViewParameters = () => {
    switch (this.props.currentItem.type) {
      case MpgItemType.Search:
        this.initSearchParameters();
        break;
      case MpgItemType.Timeline:
        this.initTimelineParameters();
        break;
      case MpgItemType.TagList:
        this.initTagListParameters();
        break;
      case MpgItemType.Inbox:
        this.initInboxParameters();
        break;
      case MpgItemType.Context:
        this.initContextParameters();
        break;
      case MpgItemType.Import:
        this.initImportParameters();
        break;
      default:
        throw new Error(
          `ViewableItemView: invalid current item type:${this.props.currentItem.type}`
        );
    }
  };

  renderLeftIcon = () => {
    return (
      <div>
        <Tooltip title={"Close"}>
          <Icon
            onClick={() => this.handleClose()}
            style={{
              fontSize: "18px",
              color: MpgTheme.palette.primary.contrastText,
            }}
          >
            close
          </Icon>
        </Tooltip>
      </div>
    );
  };

  private initSearchParameters = () => {
    this.panelList.push({
      index: 0,
      renderLabelFun: this.renderListsPanelLabel,
      renderDetailsFun: this.renderMatchedLists,
      initialStateOpen: false,
      leftSideFunction: this.handleRemoveFromList,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 1,
      renderLabelFun: this.renderTagsPanelLabel,
      renderDetailsFun: this.renderMatchedTags,
      initialStateOpen: false,
      leftSideFunction: this.handleRemoveFromList,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 2,
      renderLabelFun: this.renderEntriesPanelLabel,
      renderDetailsFun: this.renderMatchedEntries,
      initialStateOpen: false,
      leftSideFunction: this.handleRemoveFromList,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.renderHeaderFunction = this.renderSearchHeader;
  };

  private initImportParameters = () => {
    // this.panelList.push({
    //   index: 0,
    //   renderLabelFun: this.renderListsPanelLabel,
    //   renderDetailsFun: this.renderMatchedLists,
    //   initialStateOpen: false,
    //   leftSideFunction: this.handleRemoveFromList,
    //   leftSideFunctionEnabled: true,
    //   leftSideFunctionIcon: "",
    //   leftSideFunctionToolTip: "",
    // });
    // this.panelList.push({
    //   index: 1,
    //   renderLabelFun: this.renderTagsPanelLabel,
    //   renderDetailsFun: this.renderMatchedTags,
    //   initialStateOpen: false,
    //   leftSideFunction: this.handleRemoveFromList,
    //   leftSideFunctionEnabled: true,
    //   leftSideFunctionIcon: "",
    //   leftSideFunctionToolTip: "",
    // });
    // this.panelList.push({
    //   index: 2,
    //   renderLabelFun: this.renderEntriesPanelLabel,
    //   renderDetailsFun: this.renderMatchedEntries,
    //   initialStateOpen: false,
    //   leftSideFunction: this.handleRemoveFromList,
    //   leftSideFunctionEnabled: true,
    //   leftSideFunctionIcon: "",
    //   leftSideFunctionToolTip: "",
    // });
    this.renderHeaderFunction = this.renderImportHeader;
  };

  private initTimelineParameters = () => {
    this.createTimelinePanels();
    this.renderHeaderFunction = this.renderTimelineHeader;
  };

  private initTagListParameters = () => {
    this.CreateTagListPanels();
    this.renderHeaderFunction = this.renderTagListHeader;
  };

  private initInboxParameters = () => {
    this.createInboxPanels();
    this.renderHeaderFunction = this.renderInboxtHeader;
  };

  private initContextParameters = () => {
    this.createContextPanels();
    this.renderHeaderFunction = this.renderContextHeader;
  };

  // private initImportParameters = () => {
  //   this.createImportPanels();
  //   this.renderHeaderFunction = this.renderImportHeader;
  // };

  renderListsPanelLabel = (): string => {
    return "Lists: (" + this.state.matchedLists.size + ")";
  };

  renderTagsPanelLabel = (): string => {
    return "Tags: (" + this.state.matchedTags.size + ")";
  };

  renderEntriesPanelLabel = (): string => {
    return "Entries: (" + this.state.matchedEntries.size + ")";
  };

  renderItemBodyAbovePanels = () => {
    switch (this.props.currentItem.type) {
      case MpgItemType.Search:
        return this.renderSearchParamsDetails();
      case MpgItemType.Timeline:
        return this.renderTimelineDetails();
      case MpgItemType.Context:
        return this.renderContextDetails();
      case MpgItemType.Import:
        return this.renderImportParamsDetails();
      default:
        return <div></div>;
    }
  };

  render = () => {
    return (
      <div>
        <Card
          elevation={1}
          style={{
            maxWidth: this.props.viewWidth,
            minWidth: this.props.viewWidth,
            margin: this.props.viewMargin,
            marginTop: 5,
            backgroundColor: MpgTheme.palette.primary.dark,
          }}
        >
          {this.renderHeaderFunction()}
          {this.renderItemBodyAbovePanels()}
          {/* {this.props.currentItem.type === MpgItemType.Search
            ? this.renderSearchParamsDetails()
            : this.renderTimelineDetails()} */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              margin: 5,
            }}
          >
            <Button
              onClick={() => this.handleClose()}
              style={{
                margin: 5,
                color: MpgTheme.palette.primary.contrastText,
                backgroundColor: MpgTheme.palette.primary.main,
              }}
              size="small"
            >
              Close
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  private renderPanels = () => {
    return (
      <div>
        <Card
          elevation={1}
          style={{
            margin: 5,
            backgroundColor: MpgTheme.palette.primary.main,
          }}
        >
          {this.panelList.map((panel) => {
            return (
              <div key={panel.index}>
                <MpgPanel
                  index={panel.index}
                  renderLabelFun={panel.renderLabelFun}
                  renderDetailFun={panel.renderDetailsFun}
                  initialStateOpen={panel.initialStateOpen}
                  leftSideFunction={panel.leftSideFunction}
                  leftSideFunctionIcon={panel.leftSideFunctionIcon}
                  leftSideFunctionToolTip={panel.leftSideFunctionToolTip}
                  leftSideFunctionEnabled={panel.leftSideFunctionEnabled}
                />
              </div>
            );
          })}
        </Card>
      </div>
    );
  };

  static getDerivedStateFromProps = (
    newProps: ViewableItemViewProps,
    state: ViewableItemViewState
  ) => {
    state = {
      ...state,
      matchedEntries: newProps.matchedEntries,
      matchedTags: newProps.matchedTags,
      matchedLists: newProps.matchedLists,
      entries: newProps.entries,
      dateEntryMap: newProps.dateEntryMap,
    };
    return state;
  };

  componentDidlUpdate = () => {
    console.log("componentDidUpdate");
  };

  handleClose = () => {
    this.props.closeView(this.props.currentItem);
  };

  setAllMatchedItems = () => {
    this.props.setMatchedEntries(this.state.searchText);
  };

  private renderSearchParamsDetails = () => {
    return (
      <ThemeProvider theme={MpgTheme}>
        <Card
          elevation={1}
          style={{
            textAlign: "left",
            margin: 5,
            paddingRight: 2,
            paddingLeft: 2,
            paddingTop: -150,
            paddingBottom: 0,
            //   width: "100%"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              margin: 5,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <TextField
                id="seachText"
                autoFocus
                // onFocus={event => event.target.select()}
                label="Search text"
                value={this.state.searchText}
                margin="normal"
                style={{ width: "80%", fontSize: 12 }}
                onChange={this.handleSearchTextChange}
                // onKeyPress={this.handleKeyPressed}
                // onBlur={event=>this.setAllMatchedItems()}
              />
              <Button
                onClick={() => this.setAllMatchedItems()}
                style={{
                  margin: 0,
                  color: MpgTheme.palette.primary.contrastText,
                  backgroundColor: MpgTheme.palette.primary.main,
                  height: 20,
                  width: 30,
                  fontSize: 9,
                }}
                size="small"
              >
                Search
              </Button>
            </div>
          </div>
          {this.renderPanels()}
          {/* {this.renderMatchedLists()}
          {this.renderMatchedTags()}
          {this.renderMatchedEntries()} */}
        </Card>
      </ThemeProvider>
    );
  };

  private renderImportParamsDetails = () => {
    return (
      <ThemeProvider theme={MpgTheme}>
        <Card
          elevation={1}
          style={{
            textAlign: "left",
            margin: 5,
            paddingRight: 2,
            paddingLeft: 2,
            paddingTop: -150,
            paddingBottom: 0,
            //   width: "100%"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              margin: 5,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div>
                <Button variant="contained" component="label">
                  Upload File
                  <input
                    type="file"
                    style={{ display: "none" }}
                    onChange={(event) => this.handleFileUploadChange(event)}
                  />
                </Button>
              </div>
              {/* <input
                id="myInput"
                type="file"
                ref={(ref) => (this.upload = ref)}
                style={{ display: "none" }}
              />
              <Button
                onClick={() => this.upload.click()}
                style={{
                  margin: 0,
                  color: MpgTheme.palette.primary.contrastText,
                  backgroundColor: MpgTheme.palette.primary.main,
                  height: 20,
                  width: 30,
                  fontSize: 9,
                }}
                size="small"
              >
                Select file
              </Button> */}
            </div>
          </div>
        </Card>
      </ThemeProvider>
    );
  };

  private handleFileUploadChange = async (event: any) => {
    try {
      const file = event.target.files[0];
      var reader = new FileReader();
      await reader.readAsText(file);
      reader.onload = (event: any) => {
        const data = event.target.result;
        this.props.processImportedData(data);
        // console.log("handleFileUploadChange: event:",event,"data:",data);
      };
    } catch (error) {
      throw error;
    }
  };

  private renderContextDetails = () => {
    return (
      <ThemeProvider theme={MpgTheme}>
        <Card
          elevation={1}
          style={{
            textAlign: "left",
            margin: 5,
            paddingRight: 2,
            paddingLeft: 2,
            paddingTop: -150,
            paddingBottom: 0,
            //   width: "100%"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              margin: 5,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Typography
                style={{
                  fontSize: "12px",
                  color: MpgTheme.palette.primary.dark,
                  marginTop: 5,
                  marginLeft: 0,
                  marginRight: 10,
                  fontWeight: "bold",
                }}
                align="left"
              >
                Select privacy level:
              </Typography>
              <Select
                labelId="privacyInputLabel"
                id="privacySelect"
                value={this.state.privacy}
                onChange={this.handleTimelineRangeChange}
              >
                <MenuItem value={MpgItemPrivacy.Public}>Public</MenuItem>
                <MenuItem value={MpgItemPrivacy.Personal}>Personal</MenuItem>
                <MenuItem value={MpgItemPrivacy.Private}>Private</MenuItem>
              </Select>
            </div>
          </div>
          {this.renderPanels()}
          {/* {this.renderMatchedLists()}
          {this.renderMatchedTags()}
          {this.renderMatchedEntries()} */}
        </Card>
      </ThemeProvider>
    );
  };

  createInboxPanels = () => {
    // get entries with no tag
    this.state.entries.forEach((entry) => {
      if (entry.tagRels.size === 0) {
        this.entriesWithNoTag.set(entry.id, entry);
      }
    });
    const panel: PanelInterface = {
      index: 0,
      renderLabelFun: this.renderInboxPanelLabel,
      renderDetailsFun: this.renderInbox,
      initialStateOpen: true,
      leftSideFunction: this.handleRemoveFromList,
      leftSideFunctionEnabled: false,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    };
    this.panelList.push(panel);
  };

  createContextPanels = () => {};

  // populateTagSetWithChildren = (tag: MpgTag, entryList: Map<string,MpgEntry>=new Map())=>{

  // }

  // populateAllTagSetWithChildren =(MpgTag)=>{

  // }

  populateTagSet = () => {
    // populate tagList
    // create temprory tag list with entryMap
    const tagListArray = Array.from(this.state.tags.values());
    // include children entryRels
    const sortedTagListArray = tagListArray.sort((item1, item2) => {
      return item2.itemRels.size - item1.itemRels.size;
    });
    let index = 0;
    // populate tag list
    sortedTagListArray.forEach((tag) => {
      this.tagList.set(index, tag);
      index += 1;
    });
  };

  CreateTagListPanels = () => {
    this.populateTagSet();
    this.tagList.forEach((tag, key) => {
      const panel: PanelInterface = {
        index: key,
        renderLabelFun: this.renderTagListPanelLabel,
        renderDetailsFun: this.renderTagListPanel,
        initialStateOpen: false,
        leftSideFunction: this.handleRemoveFromList,
        leftSideFunctionEnabled: false,
        leftSideFunctionIcon: "",
        leftSideFunctionToolTip: "",
      };
      this.panelList.push(panel);
    });
  };

  // is set exist (set, sets= [])
  //   sets include set?
  //     yes: true
  //     no: false

  // getTagSets(tagsRel, sets=[])
  // tagSets = []
  //   iterate over tagsRels
  //     create a set for every tagRel
  //       is it the sets?
  //         yes: return
  //         no: append it to sets

  // createTagSetPanels = ()=>{
  //   interface TagSetEntries {
  //     tagSet: Set<MpgTag[]>,
  //     entries: MpgEntry[],
  //   }
  //   const tagSetEntriesArray: TagSetEntries[] = []
  //   this.props.entries.forEach(entry=>{
  //     const tagSets: Set<MpgTag[]>[] = []
  //   })
  // }
  // createTagSetPanels
  // intreface TagSetEntries {tagSet, entries}
  //    iterate of entries
  //      find all sets of tags (a, b, a&b), etc
  //         iterate over sets
  //           does the tagSetEntries exist?
  //             if yes, add to the TagSetEntries and add entry
  //             if o, create a new tagSetEntries and add entry
  // sort tagSetEntries
  // create a panel for each set

  createTimelinePanels = () => {
    // this.dateEntryMap = new Map();
    // // sort entries by time
    // const entryArray = Array.from(this.state.entries.values());
    // // use createdAt
    // // const sortedEntries = entryArray.sort((item1, item2) => {
    // //   return item2.updatedAt.getTime() - item1.updatedAt.getTime();
    // // });
    // const sortedEntries = entryArray.sort((item1, item2) => {
    //   return item2.createdAt.getTime() - item1.createdAt.getTime();
    // });
    // // const earlistEntryDate = sortedEntries[
    // //   sortedEntries.length - 1
    // // ].createdAt.setHours(0, 0, 0, 0);
    // // make start of the day at 6:00am
    // // this doesn't work well because the date is different
    // // const earlistEntryDate = sortedEntries[
    // //   sortedEntries.length - 1
    // // ].createdAt.setHours(0, 0, 0, 0);
    // this.earlistEntryDate = sortedEntries[
    //   sortedEntries.length - 1
    // ].createdAt.setHours(0, 0, 0, 0);
    // const dayInMilliseconds = 1000 * 60 * 60 * 24;
    // sortedEntries.forEach((entry) => {
    //   // add element for createdAt and updatedAt
    //   // this should be a fuction fo createdAt and UpdatedAt
    //   // createdAt
    //   let numberOfDaysSinceStart = Math.floor(
    //     (entry.createdAt.getTime() - this.earlistEntryDate) / dayInMilliseconds
    //   );
    //   let entriesDate = this.dateEntryMap.get(numberOfDaysSinceStart);
    //   if (entriesDate !== undefined) {
    //     entriesDate.set(entry.id, entry);
    //     // entriesDate.push(entry);
    //   } else {
    //     entriesDate = new Map<string, MpgEntry>();
    //     // entriesDate = new Array<MpgEntry>();
    //     entriesDate.set(entry.id, entry);
    //     this.dateEntryMap.set(numberOfDaysSinceStart, entriesDate);
    //   }
    //   numberOfDaysSinceStart = Math.floor(
    //     (entry.updatedAt.getTime() - this.earlistEntryDate) / dayInMilliseconds
    //   );
    //   // updateAt
    //   entriesDate = this.dateEntryMap.get(numberOfDaysSinceStart);
    //   if (entriesDate !== undefined) {
    //     entriesDate.set(entry.id, entry);
    //     // entriesDate.push(entry);
    //   } else {
    //     entriesDate = new Map<string, MpgEntry>();
    //     entriesDate.set(entry.id, entry);
    //     // entriesDate = new Array<MpgEntry>();
    //     entriesDate.set(entry.id, entry);
    //     this.dateEntryMap.set(numberOfDaysSinceStart, entriesDate);
    //   }
    // });
    // console.log("CreateTimelinePanels: entriesDate:",this.entriesDate)
    // now create a panel for each entry
    this.state.dateEntryMap.forEach((entryDate, key) => {
      const panel: PanelInterface = {
        index: key,
        renderLabelFun: this.renderTimelinePanelLabel,
        renderDetailsFun: this.renderTimelinePanel,
        initialStateOpen: false,
        leftSideFunction: this.handleRemoveFromList,
        leftSideFunctionEnabled: false,
        leftSideFunctionIcon: "",
        leftSideFunctionToolTip: "",
      };
      this.panelList.push(panel);
    });
    // console.log("CreatePanelList: panelList:",this.panelList)
  };

  private renderMatchedLists = () => {
    return (
      <div>
        {this.state.matchedLists.size > 0 ? (
          <div>
            <Card
              style={{
                backgroundColor: MpgTheme.palette.primary.light,
                margin: 5,
              }}
            >
              <MpgItemListCompenent
                items={this.state.matchedLists}
                openItem={this.props.openItem}
                deleteItem={this.props.deleteItem}
                refreshItem={this.refreshItem}
                updateItem={this.props.updateItem}
                removeFromListEnabled={false}
                removeFromListToolTip={""}
                removeFromListFun={this.handleRemoveFromList}
                showArchived={true}
                removeTagFromItem={this.props.removeTagFromItem}
                showParked={true}
                showActive={true}
                setDataSavingInProgress={this.props.setDataSavingInProgress}
                privateMode={this.props.privateMode}
              />
            </Card>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  };

  renderTimelinePanelLabel = (index: number): string => {
    // get date
    const entriesDate = this.state.dateEntryMap.get(index);
    let date = new Date();
    let size = "(0)";
    let sentiment = "(0)";
    // let sentimentEmoji = "😐"
    if (entriesDate !== undefined) {
      // const entriesArray = Array.from(entriesDate.values());
      // date = entriesArray[0].updatedAt;
      date = this.calculateDateFromIndex(index);
      size = "(" + entriesDate.size + ")";
      // size = "(" + entriesDate.length + ")";
      const averageSentiment = this.calculateAverageSentiment(entriesDate);
      // this.calculateAverageSentiment(entriesDate)
      // let sentimentSign = ""
      // if(averageSentiment > 0){
      //   sentimentEmoji = this.postiveEmoji
      //   sentimentSign = "+"
      // }
      // if(averageSentiment < 0){
      //   sentimentEmoji = this.negativeEmoji
      // }
      // sentiment = "("+sentimentEmoji+sentimentSign+averageSentiment.toFixed(2)+") "
      sentiment = MpgItem.getSentimentTextOfSentiment(averageSentiment);
    }
    return (
      size + " " + date.toString().substring(0, 16) + "(" + sentiment + ")"
    );
  };

  private calculateDateFromIndex = (index: number): Date => {
    const dayInMilliseconds = 1000 * 60 * 60 * 24;
    return new Date(this.props.earlistEntryDate + index * dayInMilliseconds);
  };

  // calculateAverageSentiment = (entries: Map<string, MpgEntry>): number => {
  calculateAverageSentiment = (entries: Map<string, MpgEntry>): number => {
    let averageSentiment = 0;
    if (entries.size !== 0) {
      let sumOfSentiment = 0;
      entries.forEach((entry) => {
        sumOfSentiment += entry.netSentiment;
      });
      averageSentiment = sumOfSentiment / entries.size;
    }
    return averageSentiment;
  };

  calculateOverallSentiment = (): number => {
    let sumOfSentiments = 0;
    let aggregateSentiment = 0;
    const entriesSize = this.props.entries.size;
    if (entriesSize > 0) {
      this.props.entries.forEach((entry) => {
        sumOfSentiments += entry.netSentiment;
      });
      aggregateSentiment = sumOfSentiments / entriesSize;
    }
    return aggregateSentiment;
  };

  renderTagListPanelLabel = (index: number) => {
    let tagHeadline = "";
    const tag = this.tagList.get(index);
    let size = 0;
    if (tag !== undefined) {
      tagHeadline = tag.headline;
      size = tag.itemRels.size;
    }
    return tagHeadline + "(" + size + ")";
  };

  renderInboxPanelLabel = () => {
    return "";
  };

  renderContextPanelLabel = () => {
    return "Set context parameters";
  };

  private renderTimelineDetails = () => {
    return (
      <ThemeProvider theme={MpgTheme}>
        <Card
          elevation={1}
          style={{
            textAlign: "left",
            margin: 5,
            paddingRight: 2,
            paddingLeft: 2,
            paddingTop: -150,
            paddingBottom: 0,
            //   width: "100%"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: 5,
            }}
          >
            {/* <Select
              labelId="timelineRange"
              id="timelineselect"
              value={this.state.timelineRange}
              onChange={this.handleTimelineRangeChange}
              color="primary"
            >
              <MenuItem value={MpgTimelineRange.All}>All</MenuItem>
              <MenuItem value={MpgTimelineRange.Month}>Month</MenuItem>
              <MenuItem value={MpgTimelineRange.Week}>Week</MenuItem>
              <MenuItem value={MpgTimelineRange.Day}>Day</MenuItem>
            </Select> */}
          </div>
          <MpgTimelineComponent
            viewWidth={this.props.viewWidth}
            viewHeight={200}
            entries={this.state.entries}
            earlistEntryDate={this.props.earlistEntryDate}
            dateEntryMap={this.state.dateEntryMap}
          />
          {this.renderPanels()}
          {/* {this.renderMatchedLists()}
          {this.renderMatchedTags()}
          {this.renderMatchedEntries()} */}
        </Card>
      </ThemeProvider>
    );
  };

  handleTimelineChange = async (event: React.ChangeEvent<{ value: any }>) => {
    const timelineRange = event.target.value;
    await this.props.updateTimelineRange(timelineRange);
    await this.setState({ timelineRange: timelineRange });
  };

  private renderMatchedTags = () => {
    return (
      <div>
        {this.state.matchedTags.size > 0 ? (
          <div>
            <Card
              style={{
                backgroundColor: MpgTheme.palette.primary.light,
                margin: 5,
              }}
            >
              <MpgItemListCompenent
                items={this.state.matchedTags}
                openItem={this.props.openItem}
                deleteItem={this.props.deleteItem}
                refreshItem={this.refreshItem}
                updateItem={this.props.updateItem}
                removeFromListEnabled={false}
                removeFromListToolTip={""}
                removeFromListFun={this.handleRemoveFromList}
                showArchived={true}
                removeTagFromItem={this.props.removeTagFromItem}
                showActive={true}
                showParked={true}
                setDataSavingInProgress={this.props.setDataSavingInProgress}
                privateMode={this.props.privateMode}
              />
            </Card>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  };

  private renderInbox = () => {
    return (
      <div>
        {this.state.matchedTags.size > 0 ? (
          <div>
            <Card
              style={{
                backgroundColor: MpgTheme.palette.primary.light,
                margin: 5,
              }}
            >
              <MpgItemListCompenent
                items={this.entriesWithNoTag}
                openItem={this.props.openItem}
                deleteItem={this.props.deleteItem}
                refreshItem={this.refreshItem}
                updateItem={this.props.updateItem}
                removeFromListEnabled={false}
                removeFromListToolTip={""}
                removeFromListFun={this.handleRemoveFromList}
                showArchived={false}
                removeTagFromItem={this.props.removeTagFromItem}
                showParked={true}
                showActive={true}
                setDataSavingInProgress={this.props.setDataSavingInProgress}
                privateMode={this.props.privateMode}
              />
            </Card>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  };

  handleRemoveFromList = () => {
    // do nothing opeation is disabled
  };

  refreshItem = async () => {
    switch (this.props.currentItem.type) {
      case MpgItemType.Search:
        this.setAllMatchedItems();
        break;
      case MpgItemType.Timeline:
        await this.createTimelinePanels();
        break;
    }
  };

  private renderMatchedEntries = () => {
    return (
      <div>
        {this.state.matchedEntries.size > 0 ? (
          <div>
            <Card
              style={{
                backgroundColor: MpgTheme.palette.primary.light,
                margin: 5,
              }}
            >
              <MpgItemListCompenent
                items={this.state.matchedEntries}
                openItem={this.props.openItem}
                deleteItem={this.props.deleteItem}
                refreshItem={this.refreshItem}
                updateItem={this.props.updateItem}
                removeFromListEnabled={false}
                removeFromListToolTip={""}
                removeFromListFun={this.handleRemoveFromList}
                showArchived={true}
                removeTagFromItem={this.props.removeTagFromItem}
                showActive={true}
                showParked={true}
                setDataSavingInProgress={this.props.setDataSavingInProgress}
                privateMode={this.props.privateMode}
              />
            </Card>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  };

  private renderTimelinePanel = (index: number) => {
    let entriesMap = this.state.dateEntryMap.get(index);
    // console.log("renderTimelinePanel: entryMap:",entryMap)
    if (entriesMap === undefined) {
      entriesMap = new Map<string, MpgEntry>();
    }
    return (
      <div>
        {this.state.matchedLists.size > 0 ? (
          <div>
            <Card
              style={{
                backgroundColor: MpgTheme.palette.primary.light,
                margin: 5,
              }}
            >
              <MpgItemListCompenent
                items={entriesMap}
                openItem={this.props.openItem}
                deleteItem={this.props.deleteItem}
                refreshItem={this.refreshItem}
                updateItem={this.props.updateItem}
                removeFromListEnabled={false}
                removeFromListToolTip={""}
                removeFromListFun={this.handleRemoveFromList}
                showArchived={true}
                removeTagFromItem={this.props.removeTagFromItem}
                showParked={true}
                showActive={true}
                showTime={true}
                sortOnlyTimeAscending={true}
                setDataSavingInProgress={this.props.setDataSavingInProgress}
                privateMode={this.props.privateMode}
              />
            </Card>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  };

  private renderTagListPanel = (index: number) => {
    const tag = this.tagList.get(index);
    let entryMap = new Map<string, MpgItem>();
    if (tag !== undefined) {
      tag.itemRels.forEach((entryRel) => {
        entryMap.set(entryRel.item1.id, entryRel.item1);
      });
    }
    return (
      <div>
        {this.state.matchedLists.size > 0 ? (
          <div>
            <Card
              style={{
                backgroundColor: MpgTheme.palette.primary.light,
                margin: 5,
              }}
            >
              <MpgItemListCompenent
                items={entryMap}
                openItem={this.props.openItem}
                deleteItem={this.props.deleteItem}
                refreshItem={this.refreshItem}
                updateItem={this.props.updateItem}
                removeFromListEnabled={false}
                removeFromListToolTip={""}
                removeFromListFun={this.handleRemoveFromList}
                showArchived={true}
                removeTagFromItem={this.props.removeTagFromItem}
                showActive={true}
                showParked={true}
                setDataSavingInProgress={this.props.setDataSavingInProgress}
                privateMode={this.props.privateMode}
              />
            </Card>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  };

  handleSearchTextChange = async (event: React.ChangeEvent) => {
    const searchText = (event.target as HTMLInputElement).value;
    this.setState({
      searchText: searchText,
    });
  };

  renderSearchHeader = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignContent: "center",
          alignItems: "center",
          margin: 5,
        }}
      >
        {this.renderLeftIcon()}
        <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            color: MpgTheme.palette.primary.contrastText,
          }}
        >
          Search graph
        </Typography>
        {this.renderRightIcon()}
      </div>
    );
  };

  renderImportHeader = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignContent: "center",
          alignItems: "center",
          margin: 5,
        }}
      >
        {this.renderLeftIcon()}
        <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            color: MpgTheme.palette.primary.contrastText,
          }}
        >
          Import data
        </Typography>
        {this.renderRightIcon()}
      </div>
    );
  };

  renderRightIcon = () => {
    return <div style={{ width: 5 }}></div>;
  };

  renderTimelineHeader = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignContent: "center",
          alignItems: "center",
          margin: 5,
        }}
      >
        {this.renderLeftIcon()}
        <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            color: MpgTheme.palette.primary.contrastText,
          }}
        >
          {"(" +
            this.props.entries.size +
            ") " +
            "Timeline (" +
            MpgItem.getSentimentTextOfSentiment(this.state.overallSentiment) +
            ")"}
        </Typography>
        {this.renderRightIcon()}
      </div>
    );
  };

  renderTagListHeader = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignContent: "center",
          alignItems: "center",
          margin: 5,
        }}
      >
        {this.renderLeftIcon()}
        <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            color: MpgTheme.palette.primary.contrastText,
          }}
        >
          Tag List
        </Typography>
        {this.renderRightIcon()}
      </div>
    );
  };

  renderInboxtHeader = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignContent: "center",
          alignItems: "center",
          margin: 5,
        }}
      >
        {this.renderLeftIcon()}
        <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            color: MpgTheme.palette.primary.contrastText,
          }}
        >
          Inbox ({this.entriesWithNoTag.size})
        </Typography>
        {this.renderRightIcon()}
      </div>
    );
  };

  renderContextHeader = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignContent: "center",
          alignItems: "center",
          margin: 5,
        }}
      >
        {this.renderLeftIcon()}
        <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            color: MpgTheme.palette.primary.contrastText,
          }}
        >
          Context
        </Typography>
        {this.renderRightIcon()}
      </div>
    );
  };
}
